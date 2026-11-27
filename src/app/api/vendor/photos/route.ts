import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { billingAdmin, validOrigin } from '@/lib/billing/stripe'
import { vendorEntitlements } from '@/lib/vendors/entitlements'
import { imageType, lastPhotoSlot, maxGalleryPhotos, maxUploadBytes, photoBucket } from '@/lib/vendors/portfolio'

export const runtime = 'nodejs'
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const fail = (error: string, status: number) => NextResponse.json({ error }, { status })

async function ownerContext(vendorId: string) {
  if (!uuid.test(vendorId)) return null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = billingAdmin()
  const { data: vendor, error } = await admin.from('vendors')
    .select('id,claimed_by,is_claimed').eq('id', vendorId).maybeSingle()
  if (error || !vendor?.is_claimed || vendor.claimed_by !== user.id) return null
  return { vendor, admin, ownerId: user.id }
}

async function canUploadExtra(vendor: NonNullable<Awaited<ReturnType<typeof ownerContext>>>['vendor']) {
  return (await vendorEntitlements([vendor])).get(vendor.id)?.premiumPreview === true
}

export async function POST(request: Request) {
  if (!validOrigin(request)) return fail('Invalid request origin.', 403)
  if (Number(request.headers.get('content-length')) > maxUploadBytes + 65536) return fail('Image is too large.', 413)
  let form: FormData
  try { form = await request.formData() } catch { return fail('Invalid upload request.', 400) }

  const vendorId = String(form.get('vendorId') ?? '')
  const rawSlot = form.get('slot')
  const slot = Number(rawSlot)
  const file = form.get('file')
  if (typeof rawSlot !== 'string' || !/^\d+$/.test(rawSlot) || slot > lastPhotoSlot ||
      !(file instanceof File) || file.size === 0 || file.size > maxUploadBytes) {
    return fail('Choose a JPG, PNG or WebP image up to 4 MB.', 400)
  }

  const context = await ownerContext(vendorId)
  if (!context) return fail('Verified vendor ownership required.', 403)
  const { vendor, admin } = context
  if (slot !== 0 && !(await canUploadExtra(vendor))) {
    return fail('An active Premium Preview subscription is required for additional images.', 403)
  }

  const mime = imageType(new Uint8Array(await file.slice(0, 24).arrayBuffer()))
  if (!mime || mime !== file.type) return fail('Choose a valid JPG, PNG or WebP image.', 400)
  const { data: existing, error: lookupError } = await admin.from('vendor_photos').select('id')
    .eq('vendor_id', vendor.id).eq('sort_order', slot).maybeSingle()
  if (lookupError) return fail('Could not check image placement.', 500)
  if (existing) return fail('This placement was filled. Refresh the page before trying again.', 409)

  const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
  const path = `${vendor.id}/${crypto.randomUUID()}.${extension}`
  const bucket = photoBucket(slot)
  const storage = admin.storage.from(bucket)
  const { error: storageError } = await storage.upload(path, file, { contentType: mime, upsert: false })
  if (storageError) {
    console.error('Vendor image upload failed:', storageError.message)
    return fail('Unable to upload image.', 500)
  }

  const { data: photoId, error: insertError } = await admin.rpc('attach_vendor_photo', {
    p_vendor_id: vendor.id, p_owner_id: context.ownerId, p_slot: slot, p_path: path,
  })
  if (insertError || !photoId) {
    const { error: cleanupError } = await storage.remove([path])
    if (cleanupError) console.error('Vendor image upload cleanup failed:', cleanupError.message)
    if (insertError?.code === '23505') return fail('This placement was filled. Refresh the page before trying again.', 409)
    return insertError ? fail('Unable to attach image to listing.', 500) : fail('Listing ownership or Premium access changed.', 403)
  }
  return NextResponse.json({ photo: { id: photoId, storage_path: path, storage_bucket: bucket, sort_order: slot, alt_text: null } }, { status: 201 })
}

export async function DELETE(request: Request) {
  if (!validOrigin(request)) return fail('Invalid request origin.', 403)
  let input
  try { input = await request.json() } catch { return fail('Invalid request.', 400) }
  const { vendorId, photoId } = input ?? {}
  if (typeof vendorId !== 'string' || typeof photoId !== 'string' || !uuid.test(photoId)) return fail('Invalid photo.', 400)
  const context = await ownerContext(vendorId)
  if (!context) return fail('Verified vendor ownership required.', 403)

  const { admin } = context
  const { data: photo, error: lookupError } = await admin.from('vendor_photos')
    .select('id,storage_path,storage_bucket').eq('id', photoId).eq('vendor_id', vendorId).maybeSingle()
  if (lookupError) return fail('Unable to look up image.', 500)
  if (!photo) return fail('Photo not found.', 404)
  if (!photo.storage_path.startsWith(`${vendorId}/`)) return fail('This legacy image requires support to remove.', 409)
  const { error: storageError } = await admin.storage.from(photo.storage_bucket).remove([photo.storage_path])
  if (storageError) return fail('Unable to remove stored image.', 500)
  const { error: deleteError } = await admin.from('vendor_photos').delete().eq('id', photo.id).eq('vendor_id', vendorId)
  if (deleteError) return fail('Unable to finish removing the image. Please retry.', 500)
  return NextResponse.json({ ok: true })
}

function validOrder(value: unknown): value is string[] {
  return Array.isArray(value) && value.length >= 2 && value.length <= maxGalleryPhotos &&
    new Set(value).size === value.length && value.every(id => typeof id === 'string' && uuid.test(id))
}

export async function PATCH(request: Request) {
  if (!validOrigin(request)) return fail('Invalid request origin.', 403)
  let input
  try { input = await request.json() } catch { return fail('Invalid request.', 400) }
  const { vendorId, current, order } = input ?? {}
  if (typeof vendorId !== 'string' || !validOrder(current) || !validOrder(order)) return fail('Invalid photo order.', 400)

  const context = await ownerContext(vendorId)
  if (!context || !(await canUploadExtra(context.vendor))) return fail('Verified owner with active Premium Preview required.', 403)
  const { data, error } = await context.admin.rpc('reorder_vendor_portfolio', {
    p_vendor_id: vendorId, p_owner_id: context.ownerId, p_current: current, p_order: order,
  })
  if (error) {
    console.error('Vendor photo reorder failed:', error.code)
    return fail('Could not save the photo order.', 500)
  }
  if (data === 'conflict') return fail('The gallery changed. Refresh the page before reordering.', 409)
  if (data !== 'ok') return fail('Verified owner with active Premium Preview required.', 403)
  return NextResponse.json({ ok: true })
}
