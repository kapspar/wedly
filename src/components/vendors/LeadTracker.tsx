'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { leadStages } from '@/lib/vendors/inbox'
export type LeadState={stage:string;notes:string|null;follow_up_date:string|null}
export default function LeadTracker({vendorId,inquiryId,initial}:{
  vendorId:string;inquiryId:string;initial?:LeadState|null
}) {
  const router=useRouter()
  const [stage,setStage]=useState(initial?.stage??'new')
  const [notes,setNotes]=useState(initial?.notes??'')
  const [date,setDate]=useState(initial?.follow_up_date??'')
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const [error,setError]=useState('')
  async function save(){
    setBusy(true);setMessage('');setError('')
    try{
      const response=await fetch('/api/vendor/leads',{method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({vendorId,inquiryId,stage,notes,followUp:date||null})
      })
      const data=await response.json() as {error?:string}
      if(!response.ok)throw new Error(data.error??'Could not save lead')
      setMessage('Lead updated.')
      router.refresh()
    }catch(error){setError(error instanceof Error?error.message:'Could not save lead')}
    finally{setBusy(false)}
  }
  return <section className="mt-4 rounded-xl border border-border-soft bg-primary-soft/20 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-plum">Premium lead management</p>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <label className="block text-xs font-medium text-ink">Pipeline stage
        <select value={stage} onChange={e=>setStage(e.target.value)} className="mt-1 w-full rounded-lg border border-border-soft bg-white p-2.5 text-base">
          {leadStages.map(([key,label])=><option key={key} value={key}>{label}</option>)}
        </select>
      </label>
      <label className="block text-xs font-medium text-ink">Follow-up date (optional)
        <input type="date" value={date}
          onChange={e=>setDate(e.target.value)} className="mt-1 w-full rounded-lg border border-border-soft bg-white p-2.5 text-base"/>
      </label>
    </div>
    <label className="mt-3 block text-xs font-medium text-ink">Private business notes
      <textarea rows={3} maxLength={2000} value={notes} onChange={e=>setNotes(e.target.value)}
        placeholder="Your follow-ups, availability, quote details. Only the verified business owner can view these."
        className="mt-1 w-full rounded-lg border border-border-soft bg-white p-3 text-base"/>
    </label>
    {error&&<p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
    {message&&<p role="status" className="mt-2 text-xs text-green-700">{message}</p>}
    <button type="button" disabled={busy} onClick={()=>void save()} className="mt-3 min-h-11 rounded-lg bg-plum px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
      {busy?'Saving…':'Save lead'}
    </button>
  </section>
}
