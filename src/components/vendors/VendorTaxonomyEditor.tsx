'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Category = {id:string;name:string}
type Service = {id:string;category_id:string;name:string}
export default function VendorTaxonomyEditor({vendorId,primaryCategoryId,categories,services,initialCategories,initialServices}:{
 vendorId:string;primaryCategoryId:string;categories:Category[];services:Service[];initialCategories:string[];initialServices:string[]
}) {
 const [selected,setSelected]=useState<string[]>(Array.from(new Set([primaryCategoryId,...initialCategories])))
 const [selectedServices,setSelectedServices]=useState<string[]>(initialServices)
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState('')
 const [error,setError]=useState('')
 const toggle=(id:string)=>{if(id===primaryCategoryId)return;setSelected(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);setSelectedServices(p=>p.filter(s=>services.find(x=>x.id===s)?.category_id!==id))}
 async function save(){
  setBusy(true);setError('');setMessage('')
  const db=createClient()
  const {data:{user}}=await db.auth.getUser()
  if(!user){setError('Sign in again.');setBusy(false);return}
  const {data:vendor}=await db.from('vendors').select('id').eq('id',vendorId).eq('claimed_by',user.id).eq('is_claimed',true).maybeSingle()
  if(!vendor){setError('You do not own this listing.');setBusy(false);return}
  const chosen=Array.from(new Set([primaryCategoryId,...selected]))
  const {data:current,error:readError}=await db.from('vendor_category_memberships').select('category_id').eq('vendor_id',vendorId)
  if(readError){setError(readError.message);setBusy(false);return}
  const remove=(current??[]).map(x=>x.category_id).filter(id=>!chosen.includes(id)&&id!==primaryCategoryId)
  const add=chosen.filter(id=>!(current??[]).some(x=>x.category_id===id))
  if(remove.length){const {error:e}=await db.from('vendor_category_memberships').delete().eq('vendor_id',vendorId).in('category_id',remove);if(e){setError(e.message);setBusy(false);return}}
  if(add.length){const {error:e}=await db.from('vendor_category_memberships').insert(add.map(category_id=>({vendor_id:vendorId,category_id})));if(e){setError(e.message);setBusy(false);return}}
  const {data:existing,error:serviceReadError}=await db.from('vendor_service_memberships').select('service_id').eq('vendor_id',vendorId)
  if(serviceReadError){setError(serviceReadError.message);setBusy(false);return}
  const desired=selectedServices.filter(id=>services.some(s=>s.id===id&&chosen.includes(s.category_id)))
  const drop=(existing??[]).map(x=>x.service_id).filter(id=>!desired.includes(id))
  const insert=desired.filter(id=>!(existing??[]).some(x=>x.service_id===id))
  if(drop.length){const {error:e}=await db.from('vendor_service_memberships').delete().eq('vendor_id',vendorId).in('service_id',drop);if(e){setError(e.message);setBusy(false);return}}
  if(insert.length){const {error:e}=await db.from('vendor_service_memberships').insert(insert.map(service_id=>({vendor_id:vendorId,service_id})));if(e){setError(e.message);setBusy(false);return}}
  setMessage('Categories and services saved.');setBusy(false)
 }
 return <section className="mt-8 rounded-2xl border border-border-soft bg-white p-6 sm:p-8">
 <h2 className="font-[family-name:var(--font-heading)] text-xl text-plum">Categories & services</h2>
 <p className="mt-2 text-sm text-muted">Choose every category your business serves. Your original primary category remains selected.</p>
 <div className="mt-5 grid gap-4 sm:grid-cols-2">{categories.map(cat=><div key={cat.id} className="rounded-xl border border-border-soft p-4">
 <label className="flex items-center gap-2 font-medium text-ink"><input type="checkbox" checked={selected.includes(cat.id)} disabled={cat.id===primaryCategoryId} onChange={()=>toggle(cat.id)}/>{cat.name}{cat.id===primaryCategoryId&&<span className="text-xs text-muted">(Primary)</span>}</label>
 {selected.includes(cat.id)&&services.filter(s=>s.category_id===cat.id).length>0&&<div className="ml-5 mt-3 space-y-2">{services.filter(s=>s.category_id===cat.id).map(s=><label key={s.id} className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" checked={selectedServices.includes(s.id)} onChange={()=>setSelectedServices(p=>p.includes(s.id)?p.filter(x=>x!==s.id):[...p,s.id])}/>{s.name}</label>)}</div>}
 </div>)}</div>
 {error&&<p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
 {message&&<p role="status" className="mt-4 text-sm text-green-700">{message}</p>}
 <button type="button" onClick={()=>void save()} disabled={busy} className="mt-5 rounded-xl bg-plum px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy?'Saving…':'Save categories & services'}</button>
 </section>
}
