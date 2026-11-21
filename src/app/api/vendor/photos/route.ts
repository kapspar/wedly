import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { billingAdmin, validOrigin } from '@/lib/billing/stripe'
import { vendorEntitlements } from '@/lib/vendors/entitlements'

export const runtime = 'nodejs'
const allowed = new Set(['image/jpeg', 'image/png', 'image/webp'])
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function ownerContext(vendorId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !uuid.test(vendorId)) return null
  const admin = billingAdmin()
  const { data: vendor, error } = await admin.from('vendors')
    .select('id,claimed_by,is_claimed').eq('id', vendorId).maybeSingle()
  if (error || !vendor?.is_claimed || vendor.claimed_by !== user.id) return null
  return { vendor, admin }
}

export async function POST(request: Request) {
  if (!validOrigin(request)) return NextResponse.json({error:'Invalid request origin'}, {status:403})
  let form: FormData
  try { form=await request.formData() } catch { return NextResponse.json({error:'Invalid upload request'}, {status:400}) }
  const vendorId=String(form.get('vendorId')??'')
  const slot=Number(form.get('slot'))
  const file=form.get('file')
  if (!Number.isInteger(slot) || slot<0 || slot>17 || !(file instanceof File) ||
      file.size===0 || file.size>5*1024*1024 || !allowed.has(file.type))
    return NextResponse.json({error:'Choose an image (JPG, PNG, WebP, maximum 5 MB) and valid placement.'},{status:400})

  const context=await ownerContext(vendorId)
  if(!context) return NextResponse.json({error:'Verified vendor ownership required'},{status:403})
  const { vendor,admin }=context
  const entitlements=await vendorEntitlements([vendor])
  if(slot>=3 && !entitlements.get(vendor.id)?.premiumPreview)
    return NextResponse.json({error:'An active Premium Preview subscription is required for portfolio photos.'},{status:403})
  const { data:existing,error:lookupError }=await admin.from('vendor_photos').select('id')
    .eq('vendor_id',vendor.id).eq('sort_order',slot).maybeSingle()
  if(lookupError) return NextResponse.json({error:'Could not check image placement'},{status:500})
  if(existing) return NextResponse.json({error:'Remove the current photo in this placement before uploading.'},{status:409})

  const extension=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg'
  const path=`${vendor.id}/${crypto.randomUUID()}.${extension}`
  const {error:storageError}=await admin.storage.from('vendor-photos').upload(path,file,{contentType:file.type,upsert:false})
  if(storageError){
    console.error('Premium image storage upload failed:',storageError.message)
    return NextResponse.json({error:'Unable to upload image.'},{status:500})
  }
  const {data:photo,error:insertError}=await admin.from('vendor_photos')
    .insert({vendor_id:vendor.id,storage_path:path,sort_order:slot,alt_text:vendor.id})
    .select('id,storage_path,sort_order,alt_text').single()
  if(insertError || !photo){
    await admin.storage.from('vendor-photos').remove([path])
    return NextResponse.json({error:insertError?.code==='23505'?'This image placement is already in use.':'Unable to attach image to listing.'},{status:insertError?.code==='23505'?409:500})
  }
  return NextResponse.json({photo},{status:201})
}

export async function DELETE(request: Request) {
  if(!validOrigin(request))return NextResponse.json({error:'Invalid request origin'},{status:403})
  let input:{vendorId?:string;photoId?:string}
  try{input=await request.json()}catch{return NextResponse.json({error:'Invalid request'},{status:400})}
  const vendorId=input.vendorId??'',photoId=input.photoId??''
  if(!uuid.test(vendorId)||!uuid.test(photoId))return NextResponse.json({error:'Invalid photo'},{status:400})
  const context=await ownerContext(vendorId)
  if(!context)return NextResponse.json({error:'Verified vendor ownership required'},{status:403})
  const {admin}=context
  const {data:photo,error:lookupError}=await admin.from('vendor_photos')
    .select('id,storage_path').eq('id',photoId).eq('vendor_id',vendorId).maybeSingle()
  if(lookupError||!photo)return NextResponse.json({error:'Photo not found'},{status:404})
  // Delete the public file first, so the listing never points at a removed row
  // while the underlying file is still accessible.
  const {error:storageError}=await admin.storage.from('vendor-photos').remove([photo.storage_path])
  if(storageError) return NextResponse.json({error:'Unable to remove stored image'},{status:500})
  const {error:deleteError}=await admin.from('vendor_photos').delete().eq('id',photo.id).eq('vendor_id',vendorId)
  if(deleteError)return NextResponse.json({error:'Image removed from storage, but listing cleanup failed. Contact support.'},{status:500})
  return NextResponse.json({ok:true})
}
