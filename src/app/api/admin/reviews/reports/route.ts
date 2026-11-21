import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { billingAdmin, validOrigin } from '@/lib/billing/stripe'
export const runtime = 'nodejs'
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export async function POST(request:Request) {
  if (!validOrigin(request)) return NextResponse.json({ error:'Invalid request origin' }, { status:403 })
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  const {data:isAdmin,error:roleError}=await supabase.rpc('is_admin')
  if (roleError || !isAdmin) return NextResponse.json({ error:'Admin access required' }, { status:403 })
  let input:{ reportId?:string; decision?:string; note?:string; unpublish?:boolean }
  try {input=await request.json()}catch{return NextResponse.json({error:'Invalid submission'},{status:400})}
  const reportId=input.reportId??'',decision=input.decision,note=typeof input.note==='string'?input.note.trim():''
  if (!uuid.test(reportId)||!['dismissed','upheld'].includes(decision??'')||note.length<20||note.length>1000||
      typeof input.unpublish!=='boolean'||(input.unpublish && decision!=='upheld'))
    return NextResponse.json({error:'Provide a 20–1,000 character justification and a valid decision.'},{status:400})
  const admin=billingAdmin()
  const {data:report,error:lookupError}=await admin.from('review_reports').select('id,review_id,status').eq('id',reportId).maybeSingle()
  if (lookupError) return NextResponse.json({error:'Could not load report'},{status:500})
  if (!report || report.status!=='pending') return NextResponse.json({error:'Report already reviewed'},{status:409})
  if (input.unpublish) {
    // Record the moderation action before hiding the review; a dismissed or
    // upheld dispute without an explicit violation decision keeps it public.
    const {error:reviewError}=await admin.from('reviews').update({
      moderation_status:'rejected',is_approved:false,moderation_note:note,
      moderated_by:user.id,moderated_at:new Date().toISOString()
    }).eq('id',report.review_id).eq('moderation_status','approved')
    if (reviewError) return NextResponse.json({error:'Could not unpublish review'},{status:500})
  }
  const {data:changed,error}=await admin.from('review_reports').update({
    status:decision,reviewer_note:note,handled_by:user.id,handled_at:new Date().toISOString()
  }).eq('id',reportId).eq('status','pending').select('id').maybeSingle()
  if (error) return NextResponse.json({error:'Could not save decision'},{status:500})
  if (!changed) return NextResponse.json({error:'Report already handled'},{status:409})
  return NextResponse.json({ok:true})
}
