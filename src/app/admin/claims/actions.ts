'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function reviewClaim(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sign in required')
  const claimId = String(formData.get('claim_id') ?? '')
  const decision = String(formData.get('decision') ?? '')
  const note = String(formData.get('note') ?? '').trim()
  if (!/^[0-9a-f-]{36}$/i.test(claimId)) throw new Error('Invalid claim')
  if (!['approved','rejected','more_info'].includes(decision)) throw new Error('Invalid decision')
  const { error } = await supabase.rpc('review_vendor_claim' as never, {
    p_claim_id: claimId, p_decision: decision, p_note: note || null,
  } as never)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/claims')
  revalidatePath('/admin/vendors')
}
