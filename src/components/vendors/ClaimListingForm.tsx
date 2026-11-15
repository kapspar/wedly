'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ClaimListingForm({ vendorId, userId }: { vendorId: string; userId?: string }) {
  const [email,setEmail] = useState('')
  const [evidence,setEvidence] = useState('')
  const [explanation,setExplanation] = useState('')
  const [status,setStatus] = useState('')
  const [busy,setBusy] = useState(false)
  if (!userId) return <a className="text-primary underline text-sm" href="/auth/login">Sign in to claim this business</a>
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setStatus('')
    const supabase = createClient()
    const { error } = await supabase.from('vendor_claims' as never).insert({
      vendor_id:vendorId, requester_id:userId, business_email:email.trim(),
      evidence_url:evidence.trim() || null, explanation:explanation.trim(),
    } as never)
    setBusy(false)
    setStatus(error ? error.message : 'Claim submitted for review. This does not automatically verify ownership.')
  }
  return <form onSubmit={submit} className="space-y-3">
    <p className="text-sm text-muted">Own this business? Request access. Wedly will review your evidence before approving.</p>
    <label className="block text-sm text-ink">Business email<input type="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
    <label className="block text-sm text-ink">Evidence URL (optional)<input type="url" placeholder="https://" value={evidence} onChange={e=>setEvidence(e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
    <label className="block text-sm text-ink">Explain your connection to the business<textarea required minLength={20} maxLength={3000} rows={3} value={explanation} onChange={e=>setExplanation(e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
    <button disabled={busy} className="rounded-lg bg-primary text-white px-4 py-2 disabled:opacity-50">{busy?'Submitting…':'Request ownership'}</button>
    {status && <p role="status" className="text-sm text-muted">{status}</p>}
  </form>
}
