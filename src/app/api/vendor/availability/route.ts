import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { billingAdmin, validOrigin } from '@/lib/billing/stripe'
import { vendorEntitlements } from '@/lib/vendors/entitlements'
export const runtime='nodejs'

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const statuses=new Set(['available','tentative','booked','unavailable','clear'])
export async function POST(request:Request) {
  if(!validOrigin(request))return NextResponse.json({error:'Invalid request origin'},{status:403})
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)return NextResponse.json({error:'Sign in as a vendor'},{status:401})
  let payload:{vendorId?:string;date?:string;status?:string}
  try{payload=await request.json()}catch{return NextResponse.json({error:'Invalid request'},{status:400})}
  const vendorId=payload.vendorId??'',date=payload.date??'',status=payload.status??''
  const today=new Date().toISOString().slice(0,10)
  const last=new Date(Date.now()+366*86400000).toISOString().slice(0,10)
  if(!uuid.test(vendorId)||!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date ||
    date<today||date>last||!statuses.has(status))
    return NextResponse.json({error:'Choose a valid date within the coming 12 months and availability status.'},{status:400})
  const admin=billingAdmin()
  const {data:vendor,error:vendorError}=await admin.from('vendors').select('id,claimed_by,is_claimed')
    .eq('id',vendorId).maybeSingle()
  if(vendorError||!vendor?.is_claimed||vendor.claimed_by!==user.id)
    return NextResponse.json({error:'Verified listing ownership required'},{status:403})
  if(status!=='clear'){
    const privileges=await vendorEntitlements([vendor])
    if(!privileges.get(vendor.id)?.premiumPreview)
      return NextResponse.json({error:'Premium Preview subscription required to publish availability.'},{status:403})
  }
  if(status==='clear'){
    const {error}=await admin.from('vendor_availability').delete()
      .eq('vendor_id',vendor.id).eq('available_date',date)
    if(error)return NextResponse.json({error:'Could not clear availability'},{status:500})
  }else{
    const {error}=await admin.from('vendor_availability').upsert({
      vendor_id:vendor.id,available_date:date,status,
      updated_by:user.id,updated_at:new Date().toISOString()
    },{onConflict:'vendor_id,available_date'})
    if(error)return NextResponse.json({error:'Could not save availability'},{status:500})
  }
  return NextResponse.json({ok:true})
}
