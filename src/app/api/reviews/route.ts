import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { billingAdmin, validOrigin } from '@/lib/billing/stripe'

export const runtime = 'nodejs'

const ratingFields = ['rating','communication_rating','quality_rating','value_rating','reliability_rating'] as const
const allowedTypes = new Set(['image/jpeg','image/png','image/webp','application/pdf'])

export async function POST(request: Request) {
  if (!validOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in to submit a review.' }, { status: 401 })
  let form: FormData
  try { form = await request.formData() } catch { return NextResponse.json({ error: 'Invalid submission.' }, { status: 400 }) }
  const vendorId = String(form.get('vendorId') ?? '')
  const body = String(form.get('body') ?? '').trim()
  const date = String(form.get('service_date') ?? '')
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vendorId) ||
      body.length < 20 || body.length > 3000) {
    return NextResponse.json({ error: 'Add at least 20 characters describing your experience (up to 3,000).' }, { status: 400 })
  }
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || date > new Date().toISOString().slice(0,10))) {
    return NextResponse.json({ error: 'Choose a past service date.' }, { status: 400 })
  }
  const scores: Record<string,number|null> = {}
  for (const field of ratingFields) {
    const raw = form.get(field)
    if (!raw && field !== 'rating') { scores[field] = null; continue }
    const score = Number(raw)
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return NextResponse.json({ error: 'Ratings must be between 1 and 5.' }, { status: 400 })
    }
    scores[field] = score
  }
  const file = form.get('evidence')
  const evidence = file instanceof File && file.size > 0 ? file : null
  if (evidence && (evidence.size > 5 * 1024 * 1024 || !allowedTypes.has(evidence.type))) {
    return NextResponse.json({ error: 'Evidence must be JPG, PNG, WebP or PDF, maximum 5 MB.' }, { status: 400 })
  }
  try {
    const admin = billingAdmin()
    const { data: vendor, error: vendorError } = await admin.from('vendors')
      .select('id,claimed_by,is_published').eq('id',vendorId).maybeSingle()
    if (vendorError) throw vendorError
    if (!vendor?.is_published) return NextResponse.json({ error: 'Vendor listing unavailable.' }, { status: 404 })
    if (vendor.claimed_by === user.id) return NextResponse.json({ error: 'You cannot review your own business.' }, { status: 403 })
    const { data: existing, error: existingError } = await admin.from('reviews')
      .select('id').eq('vendor_id',vendorId).eq('couple_id',user.id).maybeSingle()
    if (existingError) throw existingError
    if (existing) return NextResponse.json({ error: 'You already submitted a review for this business.' }, { status: 409 })

    // Keep the entire evidence file in a private bucket, never in a public URL.
    const reviewId = crypto.randomUUID()
    let evidencePath: string | null = null
    if (evidence) {
      const extension = evidence.type === 'application/pdf' ? 'pdf' : evidence.type.split('/')[1] === 'jpeg' ? 'jpg' : evidence.type.split('/')[1]
      evidencePath = `${reviewId}/evidence.${extension}`
      const { error: uploadError } = await admin.storage.from('review-evidence')
        .upload(evidencePath, evidence, { contentType:evidence.type, upsert:false })
      if (uploadError) throw uploadError
    }
    const { error: insertError } = await admin.from('reviews').insert({
      id: reviewId, vendor_id: vendorId, couple_id: user.id, body,
      rating: scores.rating, communication_rating:scores.communication_rating,
      quality_rating:scores.quality_rating, value_rating:scores.value_rating,
      reliability_rating:scores.reliability_rating,
      service_date: date, evidence_path: evidencePath,
      moderation_status:'pending', is_approved:false, customer_verified:false,
    })
    if (insertError) {
      if (evidencePath) await admin.storage.from('review-evidence').remove([evidencePath])
      if (insertError.code === '23505') return NextResponse.json({ error:'You already submitted a review for this business.' }, { status:409 })
      throw insertError
    }
    return NextResponse.json({ ok:true, message:'Review submitted for moderation.' }, { status:201 })
  } catch (error) {
    console.error('Review submission failed:', error instanceof Error ? error.message : 'server error')
    return NextResponse.json({ error:'Unable to submit your review. Please try again.' }, { status:500 })
  }
}
