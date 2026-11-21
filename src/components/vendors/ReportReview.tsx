'use client'
import { useState } from 'react'
export default function ReportReview({reviewId}:{reviewId:string}) {
  const [open,setOpen]=useState(false)
  const [reason,setReason]=useState('not_genuine')
  const [details,setDetails]=useState('')
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const [error,setError]=useState('')
  async function submit(){
    setBusy(true);setError('')
    try {
      const response=await fetch('/api/reviews/report',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({reviewId,reason,details})
      })
      const data=await response.json() as {error?:string;message?:string}
      if(!response.ok)throw new Error(data.error??'Unable to submit report.')
      setMessage(data.message??'Report submitted.')
      setOpen(false)
    }catch(e){setError(e instanceof Error?e.message:'Unable to submit report.')}
    finally{setBusy(false)}
  }
  return <div className="mt-3">
    {!message&&!open&&<button type="button" onClick={()=>setOpen(true)} className="text-xs text-muted underline hover:text-plum">Report this review</button>}
    {message&&<p role="status" className="text-xs text-green-700">{message}</p>}
    {open&&<div className="mt-2 rounded-xl border border-border-soft bg-ivory p-4 space-y-3">
      <p className="text-xs text-muted">Reports are confidential and reviewed by PlanWedly. Reporting does not automatically remove a review.</p>
      <label className="block text-xs font-semibold text-ink">Reason
        <select value={reason} onChange={e=>setReason(e.target.value)} className="mt-1 block w-full rounded-lg border border-border-soft bg-white p-2 text-sm">
          <option value="not_genuine">Not a genuine customer experience</option>
          <option value="privacy">Personal or private information</option>
          <option value="harassment">Abuse, threats or harassment</option>
          <option value="inaccurate">Specific factual claim is disputed</option>
          <option value="conflict_of_interest">Undisclosed relationship or conflict</option>
          <option value="other">Other concern</option>
        </select>
      </label>
      <label className="block text-xs font-semibold text-ink">Explain your concern
        <textarea value={details} onChange={e=>setDetails(e.target.value)} rows={3} maxLength={2000} minLength={20}
          placeholder="Describe the issue and what needs verification. Do not include private personal details."
          className="mt-1 block w-full rounded-lg border border-border-soft bg-white p-2 text-sm"/>
      </label>
      {error&&<p role="alert" className="text-xs text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button type="button" disabled={busy||details.trim().length<20} onClick={submit} className="rounded-lg bg-plum px-3 py-2 text-xs text-white disabled:opacity-50">{busy?'Sending…':'Send report'}</button>
        <button type="button" onClick={()=>setOpen(false)} className="text-xs text-muted underline">Cancel</button>
      </div>
    </div>}
  </div>
}
