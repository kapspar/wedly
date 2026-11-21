'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
export default function VendorReviewReply({reviewId}:{reviewId:string}){
  const router=useRouter()
  const [reply,setReply]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  async function send(){
    setBusy(true);setError('')
    try{
      const r=await fetch('/api/vendor/reviews/respond',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reviewId,response:reply})})
      const data=await r.json() as {error?:string}
      if(!r.ok)throw new Error(data.error||'Unable to submit reply')
      router.refresh()
    }catch(e){setError(e instanceof Error?e.message:'Unable to submit reply')}
    finally{setBusy(false)}
  }
  return <div className="mt-3 space-y-2">
    <label className="block text-xs font-medium text-plum">Reply as the business (admin approval required)
      <textarea rows={3} maxLength={1500} value={reply} onChange={e=>setReply(e.target.value)}
        placeholder="Thank the customer or address their experience professionally. Avoid personal details."
        className="mt-2 block w-full rounded-xl border border-border-soft p-3 text-sm text-ink"/>
    </label>
    {error&&<p role="alert" className="text-xs text-red-700">{error}</p>}
    <button type="button" disabled={busy||reply.trim().length<10} onClick={send}
      className="rounded-lg bg-plum px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
      {busy?'Sending…':'Submit response for moderation'}
    </button>
  </div>
}
