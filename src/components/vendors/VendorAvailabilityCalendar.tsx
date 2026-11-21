'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export type AvailabilityEntry={available_date:string;status:string}
const labels:Record<string,string>={available:'Available',tentative:'Tentative',booked:'Booked',unavailable:'Unavailable'}
const dots:Record<string,string>={
  available:'bg-emerald-600',tentative:'bg-amber-500',
  booked:'bg-slate-500',unavailable:'bg-red-500',
}
const dayLabels=['S','M','T','W','T','F','S']
export default function VendorAvailabilityCalendar({
  vendorId,initialEntries,editable=false,
}:{
  vendorId?:string;initialEntries:AvailabilityEntry[];editable?:boolean
}){
  const router=useRouter()
  const [entries,setEntries]=useState<AvailabilityEntry[]>(initialEntries)
  const [offset,setOffset]=useState(0)
  const [selected,setSelected]=useState<string|null>(null)
  const [status,setStatus]=useState('available')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [message,setMessage]=useState('')
  const now=new Date()
  const first=new Date(now.getFullYear(),now.getMonth()+offset,1)
  const year=first.getFullYear(),month=first.getMonth()
  const count=new Date(year,month+1,0).getDate(),start=first.getDay()
  const earliest=new Date(now.getFullYear(),now.getMonth(),now.getDate())
  const latest=new Date(earliest.getTime()+366*86400000)
  const byDate=new Map(entries.map(item=>[item.available_date,item.status]))
  const iso=(day:number)=>`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  async function save(){
    if(!vendorId||!selected||busy)return
    setBusy(true);setError('');setMessage('')
    try {
      const response=await fetch('/api/vendor/availability',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({vendorId,date:selected,status})
      })
      const data=await response.json() as {error?:string}
      if(!response.ok)throw new Error(data.error??'Could not update availability.')
      setEntries(previous=>status==='clear'
        ?previous.filter(entry=>entry.available_date!==selected)
        :[...previous.filter(entry=>entry.available_date!==selected),{available_date:selected,status}])
      setMessage('Availability updated.')
      setSelected(null)
      router.refresh()
    } catch(error){setError(error instanceof Error?error.message:'Unable to save availability.')}
    finally{setBusy(false)}
  }
  return <section className="rounded-2xl border border-border-soft bg-white p-5 sm:p-7">
    <h2 className="font-[family-name:var(--font-heading)] text-xl text-plum">{editable?'Manage availability':'Availability calendar'}</h2>
    <p className="mt-2 text-xs text-muted">{editable
      ? 'Mark individual dates. Unmarked days show “Ask for availability” to couples. This is not a confirmed booking system.'
      : 'Vendor-reported dates only. Unmarked dates mean “Ask for availability,” not that the vendor is free. Inquire to confirm.'}</p>
    <div className="mt-5 flex items-center justify-between gap-3">
      <button type="button" disabled={offset<=0} onClick={()=>{setOffset(n=>n-1);setSelected(null)}} className="rounded-lg border border-border-soft px-3 py-1 text-sm text-plum disabled:opacity-30" aria-label="Previous month">←</button>
      <p className="font-semibold text-plum">{first.toLocaleDateString('en-CA',{month:'long',year:'numeric'})}</p>
      <button type="button" disabled={offset>=11} onClick={()=>{setOffset(n=>n+1);setSelected(null)}} className="rounded-lg border border-border-soft px-3 py-1 text-sm text-plum disabled:opacity-30" aria-label="Next month">→</button>
    </div>
    <div className="mt-4 grid grid-cols-7 gap-1.5">
      {dayLabels.map((day,i)=><span key={i} className="py-2 text-center text-xs font-semibold text-muted">{day}</span>)}
      {Array.from({length:start},(_,i)=><span key={`empty-${i}`} />)}
      {Array.from({length:count},(_,i)=>{
        const day=i+1,date=iso(day),st=byDate.get(date)
        const within=new Date(year,month,day)>=earliest&&new Date(year,month,day)<=latest
        return <button key={date} type="button"
          disabled={!editable||!within}
          title={`${date}: ${st?labels[st]:'Ask for availability'}`}
          aria-label={`${date}: ${st?labels[st]:'Ask for availability'}`}
          onClick={()=>{setSelected(date);setStatus(st??'available');setError('');setMessage('')}}
          className={`flex min-h-12 flex-col items-center justify-center rounded-lg border text-sm ${selected===date?'border-primary bg-primary-soft':'border-border-soft bg-ivory/50'} ${editable&&within?'hover:border-primary':'cursor-default'}`}>
          <span className={within?'text-ink':'text-muted/50'}>{day}</span>
          {st&&<span className={`mt-1 h-1.5 w-1.5 rounded-full ${dots[st]}`}/>}
        </button>
      })}
    </div>
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
      {Object.entries(labels).map(([key,label])=><span key={key} className="inline-flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${dots[key]}`}/>{label}</span>)}
      <span className="inline-flex items-center gap-1.5">○ Ask for availability</span>
    </div>
    {editable&&selected&&<div className="mt-5 rounded-xl bg-primary-soft/30 p-4">
      <label className="block text-sm font-medium text-plum">Status for {selected}
        <select value={status} onChange={e=>setStatus(e.target.value)} className="mt-2 w-full rounded-lg border border-border-soft bg-white p-3 text-sm">
          {Object.entries(labels).map(([key,label])=><option key={key} value={key}>{label}</option>)}
          <option value="clear">Clear / ask for availability</option>
        </select>
      </label>
      <button type="button" onClick={()=>void save()} disabled={busy}
        className="mt-3 rounded-lg bg-plum px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy?'Saving…':'Save date'}</button>
    </div>}
    {error&&<p role="alert" className="mt-3 text-xs text-red-700">{error}</p>}
    {message&&<p role="status" className="mt-3 text-xs text-green-700">{message}</p>}
  </section>
}
