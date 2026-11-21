import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { billingAdmin, validOrigin } from '@/lib/billing/stripe'
import { vendorEntitlements } from '@/lib/vendors/entitlements'
export const runtime='nodejs'
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
type Package={title:string;description:string;starting_price_cad:number|null}
type FAQ={question:string;answer:string}
function normalizeVideo(value:string){
  let url:URL
  try{url=new URL(value)}catch{return null}
  if(url.protocol!=='https:')return null
  const host=url.hostname.toLowerCase()
  let youtubeId:string|null=null,vimeoId:string|null=null
  if(['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com','youtu.be'].includes(host)){
    youtubeId=host==='youtu.be'?url.pathname.split('/')[1]:
      url.searchParams.get('v')??url.pathname.split('/').filter(Boolean).pop()??null
    if(youtubeId&&/^[A-Za-z0-9_-]{11}$/.test(youtubeId))
      return `https://www.youtube.com/watch?v=${youtubeId}`
  }
  if(['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(host)){
    vimeoId=url.pathname.split('/').filter(Boolean).pop()??null
    if(vimeoId&&/^\d{1,12}$/.test(vimeoId))return `https://vimeo.com/${vimeoId}`
  }
  return null
}
export async function POST(request:Request){
  if(!validOrigin(request))return NextResponse.json({error:'Invalid request origin'},{status:403})
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)return NextResponse.json({error:'Sign in as a vendor'},{status:401})
  let input:{vendorId?:string;packages?:unknown;faqs?:unknown;highlights?:unknown;videoUrls?:unknown}
  try{input=await request.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
  const vendorId=input.vendorId??''
  if(!uuid.test(vendorId)||!Array.isArray(input.packages)||input.packages.length>5||
    !Array.isArray(input.faqs)||input.faqs.length>5||
    !Array.isArray(input.highlights)||input.highlights.length>5||
    !Array.isArray(input.videoUrls)||input.videoUrls.length>3)
    return NextResponse.json({error:'Use up to 5 packages, 5 FAQs, 5 highlights and 3 video links.'},{status:400})
  const packages:Package[]=[]
  for(const raw of input.packages){
    if(!raw||typeof raw!=='object')return NextResponse.json({error:'Invalid package'},{status:400})
    const p=raw as Record<string,unknown>,title=typeof p.title==='string'?p.title.trim():'',
      description=typeof p.description==='string'?p.description.trim():'',
      amount=p.starting_price_cad
    if(title.length<2||title.length>100||description.length>500||
      (amount!==null&&(!Number.isInteger(amount)||Number(amount)<1||Number(amount)>1000000)))
      return NextResponse.json({error:'Package title, description or price is invalid.'},{status:400})
    packages.push({title,description,starting_price_cad:amount as number|null})
  }
  const faqs:FAQ[]=[]
  for(const raw of input.faqs){
    if(!raw||typeof raw!=='object')return NextResponse.json({error:'Invalid FAQ'},{status:400})
    const item=raw as Record<string,unknown>,question=typeof item.question==='string'?item.question.trim():'',
      answer=typeof item.answer==='string'?item.answer.trim():''
    if(question.length<5||question.length>160||answer.length<5||answer.length>600)
      return NextResponse.json({error:'FAQ questions and answers must be meaningful and concise.'},{status:400})
    faqs.push({question,answer})
  }
  const highlights:string[]=[]
  for(const raw of input.highlights){
    if(typeof raw!=='string'||raw.trim().length<3||raw.trim().length>120)
      return NextResponse.json({error:'Highlights must contain 3–120 characters.'},{status:400})
    highlights.push(raw.trim())
  }
  const videoUrls:string[]=[]
  for(const raw of input.videoUrls){
    if(typeof raw!=='string')return NextResponse.json({error:'Invalid video URL'},{status:400})
    const normalized=normalizeVideo(raw.trim())
    if(!normalized)return NextResponse.json({error:'Use valid YouTube or Vimeo video URLs.'},{status:400})
    videoUrls.push(normalized)
  }
  const admin=billingAdmin()
  const {data:vendor,error:vendorError}=await admin.from('vendors')
    .select('id,claimed_by,is_claimed').eq('id',vendorId).maybeSingle()
  if(vendorError||!vendor?.is_claimed||vendor.claimed_by!==user.id)
    return NextResponse.json({error:'Verified listing owner required'},{status:403})
  if(!(await vendorEntitlements([vendor])).get(vendor.id)?.premiumPreview)
    return NextResponse.json({error:'Active Premium Preview subscription required'},{status:403})
  const {error}=await admin.from('vendor_premium_profiles').upsert({
    vendor_id:vendor.id,owner_id:user.id,packages,faqs,highlights,
    video_urls:videoUrls,updated_at:new Date().toISOString()
  },{onConflict:'vendor_id'})
  if(error)return NextResponse.json({error:'Could not save enhanced profile'},{status:500})
  return NextResponse.json({ok:true})
}
