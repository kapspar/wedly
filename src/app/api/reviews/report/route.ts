import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { billingAdmin, validOrigin } from '@/lib/billing/stripe'

export const runtime = 'nodejs'

const reasons = new Set(['not_genuine','privacy','harassment','inaccurate','conflict_of_interest','other'])
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  if (!validOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in to report a review.' }, { status: 401 })
  let input: { reviewId?: string; reason?: string; details?: string }
  try { input = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const reviewId = input.reviewId ?? ''
  const reason = input.reason ?? ''
  const details = typeof input.details === 'string' ? input.details.trim() : ''
  if (!uuid.test(reviewId) || !reasons.has(reason) || details.length < 20 || details.length > 2000)
    return NextResponse.json({ error: 'Select a reason and provide 20–2,000 characters explaining the issue.' }, { status: 400 })
  const admin = billingAdmin()
  const { data: review, error: reviewError } = await admin.from('reviews')
    .select('id,vendor_id,couple_id,is_approved,moderation_status').eq('id',reviewId).maybeSingle()
  if (reviewError) return NextResponse.json({ error: 'Could not check review' }, { status: 500 })
  if (!review || !review.is_approved || review.moderation_status !== 'approved')
    return NextResponse.json({ error: 'The review is not available for reporting.' }, { status: 404 })
  // Review authors cannot report themselves; they can request help separately.
  if (review.couple_id === user.id) return NextResponse.json({ error: 'You cannot report your own review.' }, { status: 403 })
  const { error } = await admin.from('review_reports').insert({
    review_id:reviewId,reporter_id:user.id,reason,details,status:'pending'
  })
  if (error?.code === '23505') return NextResponse.json({ error:'You already reported this review. Our team will assess your report.' }, { status:409 })
  if (error) {
    console.error('Review report insert failed:', error.code)
    return NextResponse.json({ error:'Could not submit report.' }, { status:500 })
  }
  return NextResponse.json({ ok:true,message:'Report sent to PlanWedly moderation.' }, { status:201 })
}
