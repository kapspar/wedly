'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Bookmark, CheckCircle2, ExternalLink, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export type Stage = 'saved'|'contacted'|'quoted'|'booked'|'declined'
export type ShortlistItem = {
  wedding_id:string
  vendor_id:string
  stage:Stage
  quote_amount:number|null
  notes:string
  vendor:{name:string;slug:string;city:string;pricing_range:string|null}|null
}
const stages:{value:Stage;label:string}[]=[
  {value:'saved',label:'Saved'},
  {value:'contacted',label:'Contacted'},
  {value:'quoted',label:'Quoted'},
  {value:'booked',label:'Booked'},
  {value:'declined',label:'Not selected'}
]
const money=(n:number)=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(n)
export default function ShortlistTracker({weddingId,initialItems}:{weddingId:string;initialItems:ShortlistItem[]}) {
  const [items,setItems]=useState(initialItems)
  const [filter,setFilter]=useState('all')
  const [busy,setBusy]=useState('')
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const visible=useMemo(()=>items.filter(item=>filter==='all'||item.stage===filter),[items,filter])
  const counts=useMemo(()=>Object.fromEntries(stages.map(stage=>[stage.value,items.filter(item=>item.stage===stage.value).length])) as Record<Stage,number>,[items])
  const quotedTotal=items.filter(item=>item.stage==='booked').reduce((sum,item)=>sum+Number(item.quote_amount||0),0)
  async function update(vendorId:string,patch:{stage?:Stage;quote_amount?:number|null;notes?:string}) {
    if(busy)return
    setBusy(vendorId);setError('');setNotice('')
    const {data,error:writeError}=await createClient().from('wedding_vendor_shortlist')
      .update({...patch,updated_at:new Date().toISOString()})
      .eq('wedding_id',weddingId).eq('vendor_id',vendorId)
      .select('stage,quote_amount,notes').single()
    if(writeError)setError('Could not save this vendor: '+writeError.message)
    else if(data){setItems(current=>current.map(item=>item.vendor_id===vendorId?{...item,...data}:item));setNotice('Saved to your shared wedding shortlist.')}
    setBusy('')
  }
  async function remove(vendorId:string){
    if(busy||!window.confirm('Remove this vendor from the shared wedding shortlist?'))return
    setBusy(vendorId);setError('');setNotice('')
    const {error:writeError}=await createClient().from('wedding_vendor_shortlist').delete().eq('wedding_id',weddingId).eq('vendor_id',vendorId)
    if(writeError)setError('Could not remove vendor: '+writeError.message)
    else setItems(current=>current.filter(item=>item.vendor_id!==vendorId))
    setBusy('')
  }
  return <div className="space-y-5">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-xl border border-border-soft bg-white p-4"><p className="text-xs text-muted">On shortlist</p><p className="mt-1 text-2xl font-bold text-plum">{items.length}</p></div>
      <div className="rounded-xl border border-border-soft bg-white p-4"><p className="text-xs text-muted">Contacted or quoted</p><p className="mt-1 text-2xl font-bold text-plum">{counts.contacted+counts.quoted}</p></div>
      <div className="rounded-xl border border-border-soft bg-white p-4"><p className="text-xs text-muted">Booked</p><p className="mt-1 text-2xl font-bold text-plum">{counts.booked}</p></div>
      <div className="rounded-xl border border-border-soft bg-white p-4"><p className="text-xs text-muted">Recorded booked quotes</p><p className="mt-1 text-xl font-bold text-plum">{money(quotedTotal)}</p></div>
    </div>
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice&&<p role="status" className="text-sm text-primary">{notice}</p>}
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={()=>setFilter('all')} className={'rounded-full border px-3 py-2 text-xs font-medium '+(filter==='all'?'bg-primary text-white border-primary':'bg-white border-border-soft')}>All ({items.length})</button>
      {stages.map(stage=><button type="button" key={stage.value} onClick={()=>setFilter(stage.value)} className={'rounded-full border px-3 py-2 text-xs font-medium '+(filter===stage.value?'bg-primary text-white border-primary':'bg-white border-border-soft')}>{stage.label} ({counts[stage.value]})</button>)}
    </div>
    {visible.length===0?<div className="rounded-2xl border border-border-soft bg-white p-8 text-center">
      <Bookmark className="mx-auto mb-3 h-8 w-8 text-primary"/>
      <p className="text-sm text-muted">{items.length?'No vendors at this stage yet.':'No vendors saved for this wedding yet.'}</p>
      <Link href="/vendors" className="mt-3 inline-block text-sm font-medium text-primary underline">Browse wedding vendors</Link>
    </div>:<div className="space-y-4">{visible.map(item=><div key={item.vendor_id} className="rounded-2xl border border-border-soft bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="font-[family-name:var(--font-heading)] text-xl text-plum">{item.vendor?.name||'Vendor listing unavailable'}</h2>
          <p className="mt-1 text-xs text-muted">{item.vendor?.city||'Location not listed'}{item.vendor?.pricing_range?' · '+item.vendor.pricing_range:''}</p>
          {item.vendor&&<Link href={'/vendor/'+encodeURIComponent(item.vendor.slug)} className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">View listing <ExternalLink className="h-3 w-3"/></Link>}
        </div>
        <button type="button" aria-label={'Remove '+(item.vendor?.name||'vendor')} disabled={!!busy} onClick={()=>remove(item.vendor_id)} className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4"/></button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-muted">Decision stage
          <select disabled={!!busy} value={item.stage} onChange={e=>update(item.vendor_id,{stage:e.target.value as Stage})} className="mt-1 block w-full rounded-xl border border-border-soft bg-white px-3 py-2.5 text-sm text-ink">{stages.map(stage=><option key={stage.value} value={stage.value}>{stage.label}</option>)}</select>
        </label>
        <label className="text-xs font-medium text-muted">Quote (CAD, optional)
          <input key={item.vendor_id+':quote:'+String(item.quote_amount)} disabled={!!busy} type="number" min="0" max="99999999" step="0.01" defaultValue={item.quote_amount??''} onBlur={e=>{const value=e.target.value.trim();const next=value===''?null:Number(value);if((next===null||Number.isFinite(next)&&next>=0&&next<=99999999)&&next!==item.quote_amount)void update(item.vendor_id,{quote_amount:next})}} className="mt-1 block w-full rounded-xl border border-border-soft bg-white px-3 py-2.5 text-sm text-ink"/>
        </label>
      </div>
      <label className="mt-3 block text-xs font-medium text-muted">Private planning notes
        <textarea key={item.vendor_id+':notes:'+item.notes} disabled={!!busy} maxLength={2000} rows={2} defaultValue={item.notes} placeholder="Availability, package details, follow-up dates…" onBlur={e=>{const next=e.target.value.trim();if(next!==item.notes)void update(item.vendor_id,{notes:next})}} className="mt-1 block w-full resize-y rounded-xl border border-border-soft bg-white px-3 py-2.5 text-sm text-ink"/>
      </label>
      {item.stage==='booked'&&<p className="mt-3 flex items-center gap-2 text-xs text-primary"><CheckCircle2 className="h-4 w-4"/>Marked booked in your planner. This does not make a reservation with the vendor.</p>}
    </div>)}</div>}
    <p className="text-xs text-muted">Stages, quotes, and notes are visible to both people sharing your wedding. Recording a booking here does not contact or charge the vendor.</p>
  </div>
}
