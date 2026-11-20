'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Claim = {
  id: string
  vendorName: string
  vendorSlug: string
  vendorCity: string
  requesterName: string
  requesterEmail: string
  businessEmail: string
  evidenceUrl: string | null
  explanation: string
  createdAt: string
  status: string
  reviewNote: string | null
}

export default function ClaimReviewCard({ claim }: { claim: Claim }) {
  const router = useRouter()
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'more_info' | null>(null)
  const [note, setNote] = useState('')
  const [verified, setVerified] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function submit() {
    if (!decision || busy) return
    if (decision !== 'approved' && !note.trim()) {
      setError('Provide a note explaining your decision.')
      return
    }
    if (decision === 'approved' && !verified) {
      setError('Verify business ownership before approving.')
      return
    }
    setBusy(true)
    setError('')
    setSuccess('')
    const supabase = createClient()
    const { error: reviewError } = await supabase.rpc('review_vendor_claim', {
      p_claim_id: claim.id,
      p_decision: decision,
      p_note: note.trim() || null,
    })
    setBusy(false)
    if (reviewError) {
      setError(reviewError.message)
      return
    }
    setSuccess(decision === 'approved'
      ? 'Claim approved. The vendor now owns this listing.'
      : decision === 'rejected' ? 'Claim rejected.' : 'Additional information requested.')
    setDecision(null)
    setNote('')
    router.refresh()
  }

  const active = claim.status === 'pending'
  const safeEvidence = claim.evidenceUrl && /^https:\/\//i.test(claim.evidenceUrl)
  return (
    <article className="rounded-2xl border border-border-soft bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <a href={`/vendor/${claim.vendorSlug}`} className="font-[family-name:var(--font-heading)] text-xl text-plum hover:underline">
            {claim.vendorName}
          </a>
          <p className="text-sm text-muted">{claim.vendorCity} · Requested {new Date(claim.createdAt).toLocaleDateString('en-CA')}</p>
        </div>
        <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-plum capitalize">
          {claim.status.replace('_', ' ')}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 text-sm">
        <div><p className="font-medium text-ink">Requester</p>
          <p className="text-muted">{claim.requesterName}</p>
          <p className="text-muted break-all">{claim.requesterEmail}</p>
        </div>
        <div><p className="font-medium text-ink">Claimed business email</p>
          <p className="text-muted break-all">{claim.businessEmail}</p>
          {safeEvidence && <a href={claim.evidenceUrl!} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">
            View supporting link
          </a>}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-ink mb-1">Ownership explanation</p>
        <p className="whitespace-pre-wrap break-words rounded-lg bg-ivory p-4 text-sm text-ink">{claim.explanation}</p>
      </div>
      {!active && claim.reviewNote && (
        <p className="text-sm text-muted">Review note: {claim.reviewNote}</p>
      )}
      {active && (
        <div className="border-t border-border-soft pt-4 space-y-3">
          <p className="text-sm text-muted">Independently verify the requester’s ownership before approving. Submitting an approval immediately assigns this listing to the requester.</p>
          <div className="flex flex-wrap gap-2">
            {([
              ['approved', 'Approve'],
              ['rejected', 'Reject'],
              ['more_info', 'Request more info'],
            ] as const).map(([value, label]) => (
              <button key={value} type="button" onClick={() => { setDecision(value); setError('') }}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${decision === value ? 'bg-plum text-white border-plum' : 'border-border-soft text-plum hover:bg-primary-soft'}`}>
                {label}
              </button>
            ))}
          </div>
          {decision && (
            <div className="space-y-3">
              <label htmlFor={`review-note-${claim.id}`} className="block text-sm font-medium text-ink">
                Review note {decision !== 'approved' ? '(required)' : '(optional)'}
              </label>
              <textarea id={`review-note-${claim.id}`} rows={3} maxLength={3000}
                value={note} onChange={e => setNote(e.target.value)}
                placeholder="Document what you checked or explain the next steps."
                className="w-full rounded-xl border border-border-soft p-3 text-sm text-ink" />
              {decision === 'approved' && (
                <label className="flex items-start gap-2 text-sm text-ink">
                  <input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} className="mt-1" />
                  I have independently verified the requester’s authority to represent this business.
                </label>
              )}
              <button type="button" disabled={busy} onClick={submit}
                className="rounded-xl bg-plum px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {busy ? 'Saving…' : `Confirm ${decision === 'approved' ? 'approval' : decision === 'rejected' ? 'rejection' : 'request'}`}
              </button>
            </div>
          )}
        </div>
      )}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && <p role="status" className="rounded-lg bg-primary-soft p-3 text-sm text-plum">{success}</p>}
    </article>
  )
}
