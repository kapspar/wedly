import { NextResponse } from 'next/server'
import { billingAdmin } from '@/lib/billing/stripe'
import { createClient } from '@/lib/supabase/server'
import { vendorEntitlements } from '@/lib/vendors/entitlements'
import { galleryStart, photoSrc } from '@/lib/vendors/portfolio'

export async function GET(request: Request, { params }: { params: Promise<{ photoId: string }> }) {
  const { photoId } = await params
  const headers = { 'Cache-Control': 'private, no-store' }
  const unavailable = () => new NextResponse(null, { status: 404, headers })
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(photoId)) return unavailable()

  const admin = billingAdmin()
  const { data: photo } = await admin.from('vendor_photos')
    .select('id,vendor_id,storage_path,storage_bucket,alt_text,sort_order')
    .eq('id', photoId).gte('sort_order', galleryStart).maybeSingle()
  if (!photo) return unavailable()

  const { data: vendor } = await admin.from('vendors')
    .select('id,is_claimed,claimed_by,is_published').eq('id', photo.vendor_id).maybeSingle()
  if (!vendor?.is_claimed || !vendor.claimed_by) return unavailable()
  const isPublic = vendor.is_published && (await vendorEntitlements([vendor])).get(vendor.id)?.premiumPreview
  if (!isPublic) {
    const client = await createClient()
    const { data: { user } } = await client.auth.getUser()
    if (user?.id !== vendor.claimed_by) return unavailable()
  }

  if (photo.storage_bucket === 'vendor-photos') {
    // Existing images retain their original storage identity.
    return NextResponse.redirect(new URL(photoSrc({ ...photo, sort_order: 0 }), request.url), { headers })
  }
  const { data } = await admin.storage.from(photo.storage_bucket).createSignedUrl(photo.storage_path, 60)
  return data?.signedUrl ? NextResponse.redirect(data.signedUrl, { headers }) : unavailable()
}
