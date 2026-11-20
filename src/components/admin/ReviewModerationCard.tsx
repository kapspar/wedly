'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export type ReviewAdminItem = {
  id:string;vendor_name:string;reviewer_name:string;
  rating:number;body:string|null;created_at:string;service_date:string|null;
  communication_rating:number|null;quality_rating:number|null;
  value_rating:number|null;reliability_rating:number|null;
  evidence_path:string|null;moderation_status:string;
  customer_verified:boolean;moderation_note:string|null
}
export default function ReviewModerationCard({review}:{review:ReviewAdminItem}) {
  const router=useRouter()
  const [verified,setVerified]=useState(false)
  const [note,setNote]=useState(review.moderation_note??'')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  async function decide(decision:'approved'|'rejected') {
    setBusy(true);setError('')
    try {
      const response=await fetch('/api/admin/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:review.id,decision,verified:decision==='approved'&&verified,note})})
      const payload=await response.json() as {error?:string}
      if(!response.ok)throw new Error(payload.error??'Could not moderate review.')
      router.refresh()
    }catch(err){setError(err instanceof Error?err.message:'Moderation failed')}
    finally{setBusy(false)}
  }
  return <article className="rounded-xl border border-border-soft bg-white p-5 space-y-3">
    <div className="flex flex-wrap justify-between gap-2"><div><p className="font-semibold text-plum">{review.vendor_name}</p><p className="text-xs text-muted">Submitted by {review.reviewer_name} · {new Date(review.created_at).toLocaleDateString('en-CA')}</p></div><span className="text-sm font-semibold">{review.rating} / 5 overall</span></div>
    <p className="whitespace-pre-line text-sm text-ink">{review.body}</p>
    <p className="text-xs text-muted">Communication: {review.communication_rating??'—'} · Quality: {review.quality_rating??'—'} · Value: {review.value_rating??'—'} · Reliability: {review.reliability_rating??'—'}</p>
    {review.service_date&&<p className="text-xs text-muted">Reported service date: {review.service_date}</p>}
    {review.evidence_path?<a target="_blank" rel="noopener noreferrer" href={'/api/admin/reviews/evidence?id='+review.id} className="inline-block text-sm text-primary underline">View private evidence (60-second link)</a>:<p className="text-xs text-muted">No evidence submitted — customer cannot be marked verified.</p>}
    {review.moderation_status==='pending'?<>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={!review.evidence_path} checked={verified} onChange={e=>setVerified(e.target.checked)}/> Evidence establishes a genuine customer relationship (Verified Customer)</label>
      <label className="block text-xs text-muted">Internal moderator note<textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={1000} rows={2} className="mt-1 block w-full rounded-lg border border-border-soft p-2 text-sm"/></label>
      {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-3"><button disabled={busy} type="button" onClick={()=>decide('approved')} className="rounded-lg bg-plum px-4 py-2 text-sm text-white disabled:opacity-50">Approve review</button><button disabled={busy} type="button" onClick={()=>decide('rejected')} className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700 disabled:opacity-50">Reject</button></div>
    </>:<p className="text-sm text-muted">Moderated: {review.moderation_status}{review.customer_verified?' · Verified Customer':''}{review.moderation_note?' · '+review.moderation_note:''}</p>}
  </article>
}
