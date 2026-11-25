'use client'

import { useMemo, useState } from 'react'
import { CalendarClock, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { EVENT_TYPES } from '@/lib/constants'
import type { EventType } from '@/lib/types/database'

export type Commitment = {
  id:string
  wedding_id:string
  category_id:string
  event_id:string|null
  vendor_id:string|null
  description:string
  total_amount:number
  paid_amount:number
  due_date:string|null
  notes:string
}
export type WeddingEventChoice = {id:string;event_type:EventType;custom_label:string|null}
export type VendorChoice = {id:string;name:string;quote_amount:number|null}
type CategoryChoice = {id:string;name:string;enabled:boolean}

const money=(value:number)=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:2}).format(value)
const eventName=(event:WeddingEventChoice)=>event.custom_label?.trim()||EVENT_TYPES.find(t=>t.value===event.event_type)?.label||event.event_type
const parseMoney=(value:string)=>value.trim()!=='' && Number.isFinite(Number(value))?Number(value):NaN
const validMoney=(value:number)=>Number.isFinite(value)&&value>=0&&value<=99999999&&Math.abs(value*100-Math.round(value*100))<0.00001
const today=()=>{
 const now=new Date()
 return [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-')
}
const dateLabel=(value:string)=>new Date(value+'T12:00:00').toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'})

export default function BudgetCommitmentTracker({weddingId,categories,events,vendors,commitments,setCommitments}:{
 weddingId:string;categories:CategoryChoice[];events:WeddingEventChoice[];vendors:VendorChoice[];
 commitments:Commitment[];setCommitments:React.Dispatch<React.SetStateAction<Commitment[]>>
}) {
 const [description,setDescription]=useState('')
 const [categoryId,setCategoryId]=useState('')
 const [eventId,setEventId]=useState('')
 const [vendorId,setVendorId]=useState('')
 const [amount,setAmount]=useState('')
 const [paid,setPaid]=useState('0')
 const [dueDate,setDueDate]=useState('')
 const [notes,setNotes]=useState('')
 const [busy,setBusy]=useState('')
 const [error,setError]=useState('')
 const [success,setSuccess]=useState('')
 const [showCompleted,setShowCompleted]=useState(true)
 const sorted=useMemo(()=>[...commitments].filter(c=>showCompleted||c.total_amount>c.paid_amount).sort((a,b)=>(a.due_date??'9999').localeCompare(b.due_date??'9999')),[commitments,showCompleted])
 const unpaidCount=commitments.filter(c=>c.total_amount>c.paid_amount).length
 const overdue=commitments.filter(c=>c.due_date && c.due_date<today() && c.total_amount>c.paid_amount).length
 const currency=(value:string)=>parseMoney(value)
 async function create(e:React.FormEvent){
  e.preventDefault()
  if(busy)return
  setError('');setSuccess('')
  const cost=currency(amount),paidSum=currency(paid)
  if(!description.trim()||description.trim().length>240||!categoryId||!validMoney(cost)||!validMoney(paidSum)||paidSum>cost){
   setError('Add a description, category, and valid amounts. Paid cannot exceed total cost.');return
  }
  setBusy('new')
  const {data,error:writeError}=await createClient().from('budget_commitments').insert({
   wedding_id:weddingId,description:description.trim(),category_id:categoryId,event_id:eventId||null,
   vendor_id:vendorId||null,total_amount:cost,paid_amount:paidSum,due_date:dueDate||null,notes:notes.trim()
  }).select('*').single()
  if(writeError)setError('Unable to save payment: '+writeError.message)
  else if(data){
   setCommitments(current=>[{...data,total_amount:Number(data.total_amount),paid_amount:Number(data.paid_amount)},...current])
   setDescription('');setCategoryId('');setEventId('');setVendorId('');setAmount('');setPaid('0');setDueDate('');setNotes('')
   setSuccess('Cost recorded in your shared wedding budget.')
  }
  setBusy('')
 }
 async function update(id:string,patch:Partial<Pick<Commitment,'paid_amount'|'total_amount'|'due_date'|'notes'|'category_id'|'event_id'|'vendor_id'|'description'>>){
  if(busy)return
  const original=commitments.find(c=>c.id===id);if(!original)return
  const proposed={...original,...patch}
  if(!validMoney(proposed.total_amount)||!validMoney(proposed.paid_amount)||proposed.paid_amount>proposed.total_amount){
   setError('Paid cannot exceed total cost. Enter valid non-negative amounts.');return
  }
  setBusy(id);setError('');setSuccess('')
  const {data,error:writeError}=await createClient().from('budget_commitments')
   .update({...patch,updated_at:new Date().toISOString()})
   .eq('id',id).eq('wedding_id',weddingId).select('*').single()
  if(writeError)setError('Unable to update cost: '+writeError.message)
  else if(data){
   setCommitments(current=>current.map(c=>c.id===id?{...data,total_amount:Number(data.total_amount),paid_amount:Number(data.paid_amount)}:c))
   setSuccess('Payment details updated for both partners.')
  }
  setBusy('')
 }
 async function remove(id:string){
  if(busy||!window.confirm('Delete this payment or commitment record?'))return
  setBusy(id);setError('');setSuccess('')
  const {error:writeError}=await createClient().from('budget_commitments').delete().eq('id',id).eq('wedding_id',weddingId)
  if(writeError)setError('Could not remove record: '+writeError.message)
  else setCommitments(current=>current.filter(c=>c.id!==id))
  setBusy('')
 }
 const vendorChoice=(id:string)=>{
  const selected=vendors.find(v=>v.id===id)
  setVendorId(id)
  if(selected && !description.trim())setDescription(selected.name)
  if(selected?.quote_amount!==null&&selected?.quote_amount!==undefined&&!amount)setAmount(String(selected.quote_amount))
 }
 return <div className="space-y-5">
  <div className="flex flex-wrap gap-3 text-xs text-muted">
   <span>{commitments.length} recorded costs</span><span>{unpaidCount} outstanding</span>
   {overdue>0&&<span className="font-semibold text-red-700">{overdue} overdue</span>}
  </div>
  <form onSubmit={create} className="rounded-2xl border border-border-soft bg-white p-5">
   <h3 className="mb-4 font-medium text-plum">Record a cost or payment</h3>
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="text-xs font-medium text-muted sm:col-span-2">Description<input required maxLength={240} value={description} onChange={e=>setDescription(e.target.value)} placeholder="e.g. Wedding photographer package" className="mt-1 block w-full rounded-xl border border-border-soft p-3 text-sm text-ink"/></label>
    <label className="text-xs font-medium text-muted">Budget category<select required value={categoryId} onChange={e=>setCategoryId(e.target.value)} className="mt-1 block w-full rounded-xl border border-border-soft p-3 text-sm text-ink"><option value="">Choose category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name.replaceAll('_',' ')}{!c.enabled?' (disabled)':''}</option>)}</select></label>
    <label className="text-xs font-medium text-muted">Wedding event (optional)<select value={eventId} onChange={e=>setEventId(e.target.value)} className="mt-1 block w-full rounded-xl border border-border-soft p-3 text-sm text-ink"><option value="">General wedding</option>{events.map(ev=><option key={ev.id} value={ev.id}>{eventName(ev)}</option>)}</select></label>
    <label className="text-xs font-medium text-muted">Shortlisted vendor (optional)<select value={vendorId} onChange={e=>vendorChoice(e.target.value)} className="mt-1 block w-full rounded-xl border border-border-soft p-3 text-sm text-ink"><option value="">No linked vendor</option>{vendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
    <label className="text-xs font-medium text-muted">Balance due date (optional)<input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="mt-1 block w-full rounded-xl border border-border-soft p-3 text-sm text-ink"/></label>
    <label className="text-xs font-medium text-muted">Total cost (CAD)<input required type="number" step="0.01" min="0" max="99999999" value={amount} onChange={e=>setAmount(e.target.value)} className="mt-1 block w-full rounded-xl border border-border-soft p-3 text-sm text-ink"/></label>
    <label className="text-xs font-medium text-muted">Paid so far (CAD)<input required type="number" step="0.01" min="0" max="99999999" value={paid} onChange={e=>setPaid(e.target.value)} className="mt-1 block w-full rounded-xl border border-border-soft p-3 text-sm text-ink"/></label>
    <label className="text-xs font-medium text-muted sm:col-span-2">Notes (optional)<textarea rows={2} maxLength={2000} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Deposit reference, payment schedule, contact details…" className="mt-1 block w-full rounded-xl border border-border-soft p-3 text-sm text-ink"/></label>
   </div>
   <button type="submit" disabled={!!busy || !categoryId||!description.trim()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white disabled:opacity-50"><Plus className="h-4 w-4"/> Add cost</button>
  </form>
  {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
  {success&&<p role="status" className="rounded-xl bg-primary-soft/40 p-3 text-sm text-plum">{success}</p>}
  <div className="flex items-center justify-between gap-2"><h3 className="font-medium text-plum">Recorded costs</h3><label className="flex items-center gap-2 text-xs text-muted"><input type="checkbox" checked={showCompleted} onChange={e=>setShowCompleted(e.target.checked)}/> Show fully paid</label></div>
  {sorted.length===0?<div className="rounded-2xl border border-border-soft bg-white p-6 text-center text-sm text-muted">No payment records to show. Add a vendor package, deposit, or other wedding cost above.</div>:
   <div className="space-y-3">{sorted.map(c=>{
    const balance=c.total_amount-c.paid_amount,paidOff=balance<=0
    const isOverdue=!!c.due_date&&c.due_date<today()&&!paidOff
    return <div key={c.id} className="rounded-2xl border border-border-soft bg-white p-4 sm:p-5">
     <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="font-medium text-ink">{c.description}</p>
       <p className="mt-1 text-xs text-muted">{categories.find(cat=>cat.id===c.category_id)?.name.replaceAll('_',' ')||'Budget category'}
       {c.event_id?' · '+(events.find(event=>event.id===c.event_id)?eventName(events.find(event=>event.id===c.event_id)!):'Wedding event'):''}
       {c.vendor_id?' · '+(vendors.find(v=>v.id===c.vendor_id)?.name||'Linked vendor'):''}</p>
      </div>
      <button type="button" aria-label={'Remove '+c.description} disabled={!!busy} onClick={()=>remove(c.id)} className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-700 disabled:opacity-50"><Trash2 className="h-4 w-4"/></button>
     </div>
     <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-ivory p-3 text-center text-xs">
      <div><p className="text-muted">Cost</p><p className="font-semibold text-ink">{money(c.total_amount)}</p></div>
      <div><p className="text-muted">Paid</p><p className="font-semibold text-ink">{money(c.paid_amount)}</p></div>
      <div><p className="text-muted">Owed</p><p className="font-semibold text-plum">{money(balance)}</p></div>
     </div>
     <div className="mt-3 grid gap-3 sm:grid-cols-3">
      <label className="text-xs text-muted">Total cost (CAD)<input key={c.id+'total'+c.total_amount} type="number" step="0.01" min="0" max="99999999" defaultValue={c.total_amount} disabled={!!busy} onBlur={e=>{const value=parseMoney(e.target.value);if(validMoney(value)&&value!==c.total_amount)void update(c.id,{total_amount:value})}} className="mt-1 w-full rounded-xl border border-border-soft p-2 text-sm text-ink"/></label>
      <label className="text-xs text-muted">Paid so far (CAD)<input key={c.id+'paid'+c.paid_amount} type="number" step="0.01" min="0" max="99999999" defaultValue={c.paid_amount} disabled={!!busy} onBlur={e=>{const value=parseMoney(e.target.value);if(validMoney(value)&&value!==c.paid_amount)void update(c.id,{paid_amount:value})}} className="mt-1 w-full rounded-xl border border-border-soft p-2 text-sm text-ink"/></label>
      <label className="text-xs text-muted"><span className="inline-flex items-center gap-1"><CalendarClock className="h-3 w-3"/>Due date</span><input type="date" key={c.id+'due'+c.due_date} defaultValue={c.due_date||''} disabled={!!busy} onChange={e=>update(c.id,{due_date:e.target.value||null})} className="mt-1 w-full rounded-xl border border-border-soft p-2 text-sm text-ink"/></label>
     </div>
     <div className="mt-3 flex flex-wrap gap-3 text-xs">
      {paidOff?<span className="inline-flex items-center gap-1 text-primary"><CheckCircle2 className="h-4 w-4"/>Fully paid</span>:isOverdue?<span className="font-semibold text-red-700">Payment overdue</span>:c.due_date?<span className="text-muted">Remaining balance due {dateLabel(c.due_date)}</span>:<span className="text-muted">No payment deadline set</span>}
     </div>
     {c.notes&&<p className="mt-3 whitespace-pre-wrap text-xs text-muted">{c.notes}</p>}
    </div>
   })}</div>}
 </div>
}
