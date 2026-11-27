import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { billingAdmin, validOrigin } from '@/lib/billing/stripe'
import { vendorEntitlements } from '@/lib/vendors/entitlements'
import { isLeadStage } from '@/lib/vendors/inbox'

export const runtime = 'nodejs'
const ids = z.object({ vendorId: z.uuid(), inquiryId: z.uuid() })
const leadUpdate = ids.extend({
  stage: z.string().refine(isLeadStage),
  notes: z.string().trim().max(2000).optional(),
  followUp: z.iso.date().nullable().optional(),
})
const readUpdate = ids.extend({ read: z.boolean() })
const response = (error: string, status: number) => NextResponse.json({ error }, { status })

async function currentUser() {
  const supabase = await createClient()
  return (await supabase.auth.getUser()).data.user
}

export async function PATCH(request: Request) {
  if (!validOrigin(request)) return response('Invalid request origin.', 403)
  const user = await currentUser()
  if (!user) return response('Sign in as a vendor.', 401)
  const input = readUpdate.safeParse(await request.json().catch(() => null))
  if (!input.success) return response('Invalid inquiry update.', 400)

  const { vendorId, inquiryId, read } = input.data
  const { data, error } = await billingAdmin().rpc('set_vendor_inquiry_read', {
    p_vendor: vendorId, p_owner: user.id, p_inquiry: inquiryId, p_read: read,
  })
  if (error) {
    console.error('Vendor inbox update failed:', error.code)
    return response('Could not update the inquiry.', 500)
  }
  if (!data) return response('Inquiry not found for this business.', 404)
  return NextResponse.json({ ok: true })
}

export async function POST(request: Request) {
  if (!validOrigin(request)) return response('Invalid request origin.', 403)
  const user = await currentUser()
  if (!user) return response('Sign in as a vendor.', 401)
  const input = leadUpdate.safeParse(await request.json().catch(() => null))
  if (!input.success) return response('Choose a valid stage, follow-up date and notes up to 2,000 characters.', 400)

  const { vendorId, inquiryId, stage, notes, followUp } = input.data
  const admin = billingAdmin()
  const { data: vendor, error: vendorError } = await admin.from('vendors')
    .select('id,claimed_by,is_claimed').eq('id', vendorId).maybeSingle()
  if (vendorError || !vendor?.is_claimed || vendor.claimed_by !== user.id)
    return response('Verified listing ownership required.', 403)
  if (!(await vendorEntitlements([vendor])).get(vendor.id)?.premiumPreview)
    return response('Premium Preview required to manage leads.', 403)

  const { data, error } = await admin.rpc('save_vendor_inquiry_lead', {
    p_vendor: vendorId, p_owner: user.id, p_inquiry: inquiryId, p_stage: stage,
    p_notes: notes || null, p_follow_up: followUp ?? null,
  })
  if (error) {
    console.error('Lead pipeline save failed:', error.code)
    return response('Could not update the lead.', 500)
  }
  if (data === 'missing') return response('Inquiry not found for this business.', 404)
  if (data !== 'ok') return response('Verified owner with active Premium Preview required.', 403)
  return NextResponse.json({ ok: true })
}
