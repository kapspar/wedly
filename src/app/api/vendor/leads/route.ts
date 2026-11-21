import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { billingAdmin, validOrigin } from '@/lib/billing/stripe'
import { vendorEntitlements } from '@/lib/vendors/entitlements'
export const runtime='nodejs'
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const stages=new Set(['new','contacted','quoted','booked','lost'])
export async function POST(request:Request) {
  if(!validOrigin(request))return NextResponse.json({error:'Invalid request origin'},{status:403})
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)return NextResponse.json({error:'Sign in as a vendor'},{status:401})
  let input:{vendorId?:string;inquiryId?:string;stage?:string;notes?:string;followUp?:string|null}
  try{input=await request.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
  const vendorId=input.vendorId??'',inquiryId=input.inquiryId??'',stage=input.stage??''
  const notes=typeof input.notes==='string'?input.notes.trim():''
  const followUp=input.followUp??''
  if(!uuid.test(vendorId)||!uuid.test(inquiryId)||!stages.has(stage)||notes.length>2000 ||
    (followUp && (!/^\d{4}-\d{2}-\d{2}$/.test(followUp)||Number.isNaN(Date.parse(followUp))||
      new Date(followUp).toISOString().slice(0,10)!==followUp||followUp<new Date().toISOString().slice(0,10))))
    return NextResponse.json({error:'Choose a valid stage, reminder date and notes up to 2,000 characters.'},{status:400})
  const admin=billingAdmin()
  const {data:vendor,error:vendorError}=await admin.from('vendors')
    .select('id,claimed_by,is_claimed').eq('id',vendorId).maybeSingle()
  if(vendorError||!vendor?.is_claimed||vendor.claimed_by!==user.id)
    return NextResponse.json({error:'Verified listing ownership required'},{status:403})
  const badge=(await vendorEntitlements([vendor])).get(vendor.id)
  if(!badge?.premiumPreview)return NextResponse.json({error:'Premium Preview required to manage leads.'},{status:403})
  const {data:inquiry,error:inquiryError}=await admin.from('inquiries')
    .select('id').eq('id',inquiryId).eq('vendor_id',vendorId).maybeSingle()
  if(inquiryError||!inquiry)return NextResponse.json({error:'Inquiry not found for this business.'},{status:404})
  const {error}=await admin.from('vendor_lead_pipeline').upsert({
    inquiry_id:inquiryId,vendor_id:vendorId,owner_id:user.id,
    stage,notes:notes||null,follow_up_date:followUp||null,updated_at:new Date().toISOString()
  },{onConflict:'inquiry_id'})
  if(error){
    console.error('Lead pipeline save failed:',error.code)
    return NextResponse.json({error:'Could not update the lead.'},{status:500})
  }
  return NextResponse.json({ok:true})
}
