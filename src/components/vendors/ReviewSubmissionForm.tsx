'use client'
import { useState, type FormEvent } from 'react'

const categories = [
  ['communication_rating','Communication'],
  ['quality_rating','Quality of service'],
  ['value_rating','Value for money'],
  ['reliability_rating','Professionalism and reliability'],
] as const

export default function ReviewSubmissionForm({ vendorId }: { vendorId: string }) {
  const [busy,setBusy] = useState(false)
  const [message,setMessage] = useState('')
  const [error,setError] = useState('')
  const [rating,setRating] = useState('5')
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setError('');setMessage('')
    const form = new FormData(event.currentTarget)
    form.set('vendorId',vendorId)
    form.set('rating',rating)
    try {
      const response = await fetch('/api/reviews',{ method:'POST', body:form })
      const payload = await response.json() as { error?:string; message?:string }
      if (!response.ok) throw new Error(payload.error ?? 'Could not submit your review.')
      setMessage(payload.message ?? 'Review submitted for moderation.')
    } catch(e) { setError(e instanceof Error ? e.message : 'Could not submit review.') }
    finally { setBusy(false) }
  }
  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border-soft bg-white p-6">
      <p className="text-sm text-muted">Only review a vendor you have genuinely hired or worked with. Reviews are screened before publication. Supplying evidence is optional but required for the Verified Customer badge.</p>
      <label className="block text-sm font-medium text-ink">Overall experience *
        <select value={rating} onChange={e=>setRating(e.target.value)} className="mt-2 block w-full rounded-lg border border-border-soft bg-white p-3">
          {[5,4,3,2,1].map(n=><option key={n} value={n}>{n} star{n===1?'':'s'}</option>)}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        {categories.map(([key,label])=>(
          <label key={key} className="block text-sm text-ink">{label} (optional)
            <select name={key} defaultValue="" className="mt-2 block w-full rounded-lg border border-border-soft bg-white p-3">
              <option value="">Not rated</option>
              {[5,4,3,2,1].map(n=><option key={n} value={n}>{n} star{n===1?'':'s'}</option>)}
            </select>
          </label>
        ))}
      </div>
      <label className="block text-sm text-ink">When did you use this service? (optional)
        <input name="service_date" type="date" max={new Date().toISOString().slice(0,10)} className="mt-2 block w-full rounded-lg border border-border-soft bg-white p-3" />
      </label>
      <label className="block text-sm text-ink">Tell couples about your real experience *
        <textarea name="body" required minLength={20} maxLength={3000} rows={5} className="mt-2 block w-full rounded-lg border border-border-soft bg-white p-3" placeholder="Describe the service, communication and delivery." />
      </label>
      <label className="block text-sm text-ink">Optional proof of service (private)
        <input name="evidence" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="mt-2 block w-full text-sm" />
      </label>
      <p className="text-xs text-muted">Evidence is accessible to authorized PlanWedly reviewers only, not vendors or the public. Remove addresses, signatures, account numbers and other sensitive information before uploading. Maximum 5 MB. Please do not upload someone else's personal information without their permission.</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="text-sm text-green-700">{message}</p>}
      <button disabled={busy || !!message} type="submit" className="rounded-xl bg-plum px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy?'Submitting…':'Submit review for moderation'}</button>
    </form>
  )
}
