import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { billingAdmin } from '@/lib/billing/stripe'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  const { data:isAdmin,error:roleError } = await supabase.rpc('is_admin')
  if (roleError || !isAdmin) return NextResponse.json({ error:'Forbidden' }, { status:403 })
  const id = new URL(request.url).searchParams.get('id')
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error:'Invalid review' }, { status:400 })
  const admin = billingAdmin()
  const { data:review,error } = await admin.from('reviews').select('evidence_path').eq('id',id).maybeSingle()
  if (error || !review?.evidence_path) return NextResponse.json({ error:'Evidence unavailable' }, { status:404 })
  const { data,error:signError } = await admin.storage.from('review-evidence')
    .createSignedUrl(review.evidence_path, 60)
  if (signError || !data?.signedUrl) return NextResponse.json({ error:'Could not open evidence' }, { status:500 })
  return NextResponse.redirect(data.signedUrl, { status:302, headers:{ 'Cache-Control':'no-store' } })
}
