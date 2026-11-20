'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

export default function ClaimRequestForm({ vendorId, vendorSlug, requesterId }: {
  vendorId: string
  vendorSlug: string
  requesterId: string
}) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    if (explanation.trim().length < 20 || explanation.trim().length > 3000) {
      setError('Describe your connection to this business in 20–3000 characters.')
      return
    }
    if (evidenceUrl.trim() && !/^https:\/\//i.test(evidenceUrl.trim())) {
      setError('The supporting link must start with https://')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== requesterId) {
      setError('Your session expired. Sign in and try again.')
      setLoading(false)
      return
    }
    const { error: insertError } = await supabase.from('vendor_claims').insert({
      vendor_id: vendorId,
      requester_id: user.id,
      business_email: email.trim(),
      evidence_url: evidenceUrl.trim() || null,
      explanation: explanation.trim(),
      status: 'pending',
    })
    setLoading(false)
    if (insertError) {
      setError(insertError.code === '23505'
        ? 'You already have an active request for this listing.'
        : 'We could not submit your request. Please check your details and try again.')
      return
    }
    setSent(true)
    router.refresh()
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-border-soft bg-white p-7">
        <h2 className="text-xl font-semibold text-plum">Claim request submitted</h2>
        <p className="mt-3 text-sm text-muted">
          We received your request. Your listing remains unclaimed until PlanWedly reviews and approves it.
        </p>
        <Link className="mt-5 inline-block font-medium text-primary underline" href={`/vendor/${vendorSlug}`}>
          Back to business listing
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border-soft bg-white p-6 sm:p-8 shadow-sm">
      <div>
        <label htmlFor="claim-email" className="block text-sm font-medium text-ink mb-2">Business email address</label>
        <input id="claim-email" type="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)}
          placeholder="hello@yourbusiness.ca" className="w-full rounded-xl border border-border-soft p-3 text-ink" />
        <p className="text-xs text-muted mt-2">Use an address associated with the business when possible.</p>
      </div>
      <div>
        <label htmlFor="claim-evidence" className="block text-sm font-medium text-ink mb-2">Supporting website or social profile (optional)</label>
        <input id="claim-evidence" type="url" pattern="https://.*" value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)}
          placeholder="https://..." className="w-full rounded-xl border border-border-soft p-3 text-ink" />
      </div>
      <div>
        <label htmlFor="claim-explanation" className="block text-sm font-medium text-ink mb-2">How are you associated with this business?</label>
        <textarea id="claim-explanation" required minLength={20} maxLength={3000} rows={5}
          value={explanation} onChange={e => setExplanation(e.target.value)}
          placeholder="Tell us your role, how we can verify your connection, and any relevant details."
          className="w-full rounded-xl border border-border-soft p-3 text-ink" />
        <p className="mt-1 text-xs text-muted">{explanation.length}/3000 characters</p>
      </div>
      <p className="text-sm text-muted">A request does not give you access to edit the business. Our team must verify and approve ownership first.</p>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <Button type="submit" loading={loading} className="w-full">Submit claim request</Button>
    </form>
  )
}
