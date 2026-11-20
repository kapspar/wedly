'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type RequestItem = {
  id: string
  name: string
  city: string
  category: string
  requesterEmail: string
  businessEmail: string
  phone: string | null
  websiteUrl: string | null
  instagramUrl: string | null
  description: string | null
  status: string
  reviewNote: string | null
  resultingVendorId: string | null
  createdAt: string
}

export default function ListingRequestReviewCard({ request }: { request: RequestItem }) {
  const router = useRouter()
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null)
  const [verified, setVerified] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function review() {
    if (!decision || busy) return
    if (decision === 'approved' && !verified) {
      setError('Confirm that the business and requester are verified before approval.')
      return
    }
    if (decision === 'rejected' && !note.trim()) {
      setError('Explain the reason for rejecting this submission.')
      return
    }
    setBusy(true)
    setError('')
    const supabase = createClient()
    const { error: rpcError } = await supabase.rpc('review_vendor_listing_request', {
      p_request_id: request.id,
      p_decision: decision,
      p_note: note.trim() || null,
    })
    setBusy(false)
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    setMessage(decision === 'approved' ? 'Business approved and published.' : 'Business submission rejected.')
    setDecision(null)
    router.refresh()
  }

  return (
    <article className="space-y-4 rounded-2xl border border-border-soft bg-white p-6 shadow-sm">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h3 className="font-[family-name:var(--font-heading)] text-xl text-plum">{request.name}</h3>
          <p className="mt-1 text-sm text-muted">{request.category} · {request.city}</p>
          <p className="mt-1 text-xs text-muted">Submitted {new Date(request.createdAt).toLocaleDateString('en-CA')}</p>
        </div>
        <span className="self-start rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-plum capitalize">{request.status}</span>
      </div>
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <p className="break-all text-ink"><strong>Account:</strong> {request.requesterEmail}</p>
        <p className="break-all text-ink"><strong>Business email:</strong> {request.businessEmail}</p>
        {request.phone && <p className="text-ink"><strong>Phone:</strong> {request.phone}</p>}
        {request.websiteUrl && /^https:\/\//.test(request.websiteUrl) &&
          <a href={request.websiteUrl} rel="noopener noreferrer" target="_blank" className="break-all text-primary underline">Visit website</a>}
        {request.instagramUrl && /^https:\/\//.test(request.instagramUrl) &&
          <a href={request.instagramUrl} rel="noopener noreferrer" target="_blank" className="break-all text-primary underline">View Instagram</a>}
      </div>
      {request.description && <p className="whitespace-pre-wrap break-words rounded-xl bg-ivory p-4 text-sm text-ink">{request.description}</p>}
      {request.reviewNote && <p className="text-sm text-muted">Review note: {request.reviewNote}</p>}
      {request.resultingVendorId && <Link href={`/admin/vendors`} className="text-sm font-medium text-primary underline">View managed vendors</Link>}

      {request.status === 'pending' && (
        <div className="space-y-4 border-t border-border-soft pt-4">
          <p className="text-sm text-muted">Check for existing directory duplicates and verify the person represents this business before approving. Approval will immediately publish the listing.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { setDecision('approved'); setError('') }}
              className={`rounded-xl border px-4 py-2 text-sm font-medium ${decision === 'approved' ? 'bg-plum text-white' : 'border-border-soft text-plum'}`}>Approve and publish</button>
            <button type="button" onClick={() => { setDecision('rejected'); setError('') }}
              className={`rounded-xl border px-4 py-2 text-sm font-medium ${decision === 'rejected' ? 'bg-plum text-white' : 'border-border-soft text-plum'}`}>Reject</button>
          </div>
          {decision && (
            <div className="space-y-3">
              <label htmlFor={`note-${request.id}`} className="block text-sm font-medium text-ink">Review note {decision === 'rejected' ? '(required)' : '(optional)'}</label>
              <textarea id={`note-${request.id}`} rows={3} maxLength={3000}
                className="w-full rounded-xl border border-border-soft p-3 text-sm text-ink"
                value={note} onChange={e => setNote(e.target.value)} />
              {decision === 'approved' && (
                <label className="flex items-start gap-2 text-sm text-ink">
                  <input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} className="mt-1" />
                  I have checked for duplicates and independently verified this business and requester.
                </label>
              )}
              <button disabled={busy} onClick={review} type="button"
                className="rounded-xl bg-plum px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {busy ? 'Processing…' : 'Confirm decision'}
              </button>
            </div>
          )}
        </div>
      )}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-primary-soft p-3 text-sm text-plum">{message}</p>}
    </article>
  )
}
