'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
export default function AdminReviewResponseCard({review}:{
  review:{id:string;vendorName:string;rating:number;body:string|null;vendor_response:string}
}){
  const [busy,setBusy]=useState(false),[error,setError]=useState('')
  const router=useRouter()
  async function moderate(decision:'approved'|'rejected'){
    setBusy(true);setError('')
    try{
      const r=await fetch('/api/admin/reviews/response',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({reviewId:review.id,decision})
      })
      const result=await r.json() as {error?:string}
      if(!r.ok)throw new Error(result.error??'Unable to moderate response')
      router.refresh()
    }catch(e){setError(e instanceof Error?e.message:'Moderation failed')}
    finally{setBusy(false)}
  }
  return <article className="rounded-xl border border-border-soft bg-white p-5">
    <p className="font-semibold text-plum">{review.vendorName} · {review.rating}/5 customer review</p>
    <p className="mt-2 whitespace-pre-line text-xs text-muted">{review.body}</p>
    <div className="mt-3 rounded-lg bg-primary-soft/30 p-3">
      <p className="text-xs font-semibold text-plum">Proposed business response</p>
      <p className="mt-2 whitespace-pre-line text-sm text-ink">{review.vendor_response}</p>
    </div>
    {error&&<p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
    <div className="mt-4 flex gap-2">
      <button disabled={busy} onClick={()=>moderate('approved')} className="rounded-lg bg-plum px-4 py-2 text-xs text-white disabled:opacity-50">Approve response</button>
      <button disabled={busy} onClick={()=>moderate('rejected')} className="rounded-lg border border-red-200 px-4 py-2 text-xs text-red-700 disabled:opacity-50">Reject</button>
    </div>
  </article>
}
