import { NextResponse } from 'next/server'
import { billingAdmin, validOrigin } from '@/lib/billing/stripe'
export const runtime='nodejs'
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const events=new Set(['view','website','instagram'])
export async function POST(request:Request){
  if(!validOrigin(request))return NextResponse.json({error:'Invalid origin'},{status:403})
  const text=await request.text()
  if(text.length>350)return NextResponse.json({error:'Invalid event'},{status:400})
  let payload:{vendorId?:string;sessionId?:string;kind?:string}
  try{payload=JSON.parse(text)}catch{return NextResponse.json({error:'Invalid event'},{status:400})}
  const vendorId=payload.vendorId??'',sessionId=payload.sessionId??'',kind=payload.kind??''
  if(!uuid.test(vendorId)||!uuid.test(sessionId)||!events.has(kind))
    return NextResponse.json({error:'Invalid event'},{status:400})
  const admin=billingAdmin()
  const {data:vendor,error:vendorError}=await admin.from('vendors')
    .select('id').eq('id',vendorId).eq('is_published',true).maybeSingle()
  if(vendorError||!vendor)return NextResponse.json({error:'Vendor unavailable'},{status:404})
  const {error}=await admin.from('vendor_metric_events').upsert({
    vendor_id:vendorId,session_id:sessionId,kind,
    event_date:new Date().toISOString().slice(0,10)
  },{onConflict:'vendor_id,event_date,kind,session_id',ignoreDuplicates:true})
  if(error)return NextResponse.json({error:'Could not store event'},{status:500})
  return NextResponse.json({ok:true})
}
