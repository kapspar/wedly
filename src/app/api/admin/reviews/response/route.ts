import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { billingAdmin, validOrigin } from '@/lib/billing/stripe'
export const runtime = 'nodejs'
export async function POST(request:Request){
  if(!validOrigin(request))return NextResponse.json({error:'Invalid request origin'},{status:403})
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
  const {data:allowed,error:roleError}=await supabase.rpc('is_admin')
  if(roleError||!allowed)return NextResponse.json({error:'Admin access required'},{status:403})
  let payload:{reviewId?:string;decision?:string}
  try{payload=await request.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
  const id=payload.reviewId??'',decision=payload.decision
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ||!['approved','rejected'].includes(decision??''))
    return NextResponse.json({error:'Invalid decision'},{status:400})
  const admin=billingAdmin()
  const {data,error}=await admin.from('reviews').update({
    response_status:decision,response_moderated_by:user.id,response_moderated_at:new Date().toISOString()
  }).eq('id',id).eq('moderation_status','approved').eq('is_approved',true)
    .eq('response_status','pending').select('id').maybeSingle()
  if(error)return NextResponse.json({error:'Could not moderate response'},{status:500})
  if(!data)return NextResponse.json({error:'Response already reviewed or unavailable'},{status:409})
  return NextResponse.json({ok:true})
}
