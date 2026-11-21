'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
type Report = {id:string;reviewId:string;vendor:string;reviewRating:number;reviewBody:string|null;reason:string;details:string;reporterKind:string;createdAt:string}
export default function ReviewReportCard({report}:{report:Report}){
  const [note,setNote]=useState('')
  const [busy,setBusy]=useState(false)
  const [unpublish,setUnpublish]=useState(false)
  const [error,setError]=useState('')
  const router=useRouter()
  async function decide(decision:'dismissed'|'upheld'){
    setBusy(true);setError('')
    try {
      const res=await fetch('/api/admin/reviews/reports',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({reportId:report.id,decision,note,unpublish:decision==='upheld'&&unpublish})
      })
      const data=await res.json() as {error?:string}
      if(!res.ok)throw new Error(data.error??'Unable to save decision')
      router.refresh()
    }catch(e){setError(e instanceof Error?e.message:'Could not save decision')}
    finally{setBusy(false)}
  }
  return <article className="rounded-2xl border border-border-soft bg-white p-5 space-y-3">
    <div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold text-plum">{report.vendor}</p><p className="text-xs text-muted">Reported by: {report.reporterKind} · {new Date(report.createdAt).toLocaleDateString('en-CA')}</p></div><span className="text-xs text-muted">{report.reviewRating}/5 original review</span></div>
    <p className="text-xs text-muted">Reason: {report.reason.replaceAll('_',' ')}</p>
    <p className="whitespace-pre-line text-sm text-ink">{report.details}</p>
    <div className="rounded-lg bg-ivory p-3"><p className="text-xs font-semibold text-muted">Original review</p><p className="mt-2 whitespace-pre-line text-sm text-ink">{report.reviewBody}</p></div>
    <label className="block text-xs text-muted">Moderator decision notes (required)
      <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} maxLength={1000} className="mt-2 block w-full rounded-lg border border-border-soft p-2 text-sm" placeholder="Document the evidence checked and the reason for your decision."/>
    </label>
    <label className="flex gap-2 text-xs text-ink"><input type="checkbox" checked={unpublish} onChange={e=>setUnpublish(e.target.checked)}/>
      Unpublish review for a confirmed policy violation (only with Uphold). Do not hide a review merely because the vendor disputes its rating.
    </label>
    {error&&<p role="alert" className="text-xs text-red-700">{error}</p>}
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={busy||note.trim().length<20} onClick={()=>decide('dismissed')} className="rounded-lg border border-border-soft px-4 py-2 text-xs font-semibold text-plum disabled:opacity-50">Dismiss report · keep review</button>
      <button type="button" disabled={busy||note.trim().length<20} onClick={()=>decide('upheld')} className="rounded-lg bg-plum px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{unpublish?'Uphold & unpublish':'Uphold · keep review'}</button>
    </div>
  </article>
}
