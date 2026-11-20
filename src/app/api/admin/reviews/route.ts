import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { billingAdmin, validOrigin } from '@/lib/billing/stripe'

export const runtime = 'nodejs'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: isAdmin, error } = await supabase.rpc('is_admin')
  return !error && isAdmin === true
}

export async function POST(request: Request) {
  if (!validOrigin(request)) return NextResponse.json({ error:'Invalid origin' }, { status:403 })
  if (!await requireAdmin()) return NextResponse.json({ error:'Administrator access required' }, { status:403 })
  let payload: { id?:string; decision?:string; verified?:boolean; note?:string }
  try { payload = await request.json() } catch { return NextResponse.json({ error:'Invalid JSON' }, { status:400 }) }
  const { id,decision,verified,note } = payload
  if (!id || !/^[0-9a-f-]{36}$/i.test(id) || !['approved','rejected'].includes(decision ?? '') ||
    typeof verified !== 'boolean' || typeof note !== 'string' || note.length > 1000) {
    return NextResponse.json({ error:'Invalid moderation request' }, { status:400 })
  }
  const admin = billingAdmin()
  const { data:review,error:lookupError } = await admin.from('reviews')
    .select('id,evidence_path,moderation_status').eq('id',id).maybeSingle()
  if (lookupError) return NextResponse.json({ error:'Review lookup failed' }, { status:500 })
  if (!review || review.moderation_status !== 'pending') return NextResponse.json({ error:'Review has already been moderated' }, { status:409 })
  if (verified && (decision !== 'approved' || !review.evidence_path)) {
    return NextResponse.json({ error:'Customer verification requires evidence and approval' }, { status:400 })
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await admin.from('reviews').update({
    moderation_status:decision,is_approved:decision==='approved',
    customer_verified:decision==='approved' && verified,
    moderation_note:note.trim() || null, moderated_by:user!.id, moderated_at:new Date().toISOString()
  }).eq('id',id).eq('moderation_status','pending').select('id').maybeSingle()
  if (error) return NextResponse.json({ error:'Failed to moderate review' }, { status:500 })
  if (!data) return NextResponse.json({ error:'Review was already processed' }, { status:409 })
  return NextResponse.json({ ok:true })
}
