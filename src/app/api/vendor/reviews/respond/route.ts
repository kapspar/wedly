import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { billingAdmin, validOrigin } from '@/lib/billing/stripe'
export const runtime = 'nodejs'

export async function POST(request:Request) {
  if (!validOrigin(request)) return NextResponse.json({error:'Invalid request origin'},{status:403})
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user) return NextResponse.json({error:'Sign in as the business owner'},{status:401})
  let body:{reviewId?:string;response?:string}
  try{body=await request.json()}catch{return NextResponse.json({error:'Invalid submission'},{status:400})}
  const id=body.reviewId ?? ''
  const response=typeof body.response==='string'?body.response.trim():''
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ||response.length<10||response.length>1500)
    return NextResponse.json({error:'Response must contain 10–1,500 characters'},{status:400})
  const admin=billingAdmin()
  const {data:review,error}=await admin.from('reviews')
    .select('id,vendor_id,is_approved,moderation_status,response_status')
    .eq('id',id).maybeSingle()
  if(error) return NextResponse.json({error:'Review lookup failed'},{status:500})
  if(!review||!review.is_approved||review.moderation_status!=='approved')
    return NextResponse.json({error:'Only approved reviews can receive responses'},{status:403})
  const {data:vendor,error:vendorError}=await admin.from('vendors')
    .select('id,claimed_by,is_claimed').eq('id',review.vendor_id).maybeSingle()
  if(vendorError) return NextResponse.json({error:'Business ownership lookup failed'},{status:500})
  if(!vendor?.is_claimed||vendor.claimed_by!==user.id)
    return NextResponse.json({error:'Only the verified listing owner can reply'},{status:403})
  if(review.response_status!=='none') return NextResponse.json({error:'A response was already submitted. Contact PlanWedly to request a correction.'},{status:409})
  const {data:changed,error:updateError}=await admin.from('reviews').update({
    vendor_response:response,response_status:'pending',response_submitted_at:new Date().toISOString(),
    response_moderated_at:null,response_moderated_by:null
  }).eq('id',id).eq('response_status','none').select('id').maybeSingle()
  if(updateError)return NextResponse.json({error:'Could not submit response'},{status:500})
  if(!changed)return NextResponse.json({error:'Response already submitted'},{status:409})
  return NextResponse.json({ok:true,message:'Your response was submitted for moderation.'},{status:201})
}
