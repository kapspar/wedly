'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import {BookOpen,CheckCircle2,Copy,Heart,ShieldCheck} from 'lucide-react'
import {createClient} from '@/lib/supabase/client'
type TemplateInfo={title:string;description:string;type:string;events:string[];tasks:string[];budgets:{category:string;budgeted:number}[]}
const seeds=[
 {slug:'tamil-hindu',title:'Tamil Hindu wedding',type:'hindu',description:'Temple ceremony, home celebrations, reception and family planning.'},
 {slug:'tamil-christian',title:'Tamil Christian / Catholic wedding',type:'christian_catholic',description:'Church ceremony, reception, vendors and ceremony preparation.'},
 {slug:'tamil-interfaith',title:'Tamil interfaith wedding',type:'interfaith',description:'Coordinate family traditions and multiple ceremonies in one plan.'}
]
export default function Plans({sharedToken}:{sharedToken?:string}){
 const [weddingId,setWeddingId]=useState('')
 const [weddingType,setWeddingType]=useState('')
 const [active,setActive]=useState<string|null>(sharedToken?'shared':null)
 const [preview,setPreview]=useState<TemplateInfo|null>(null)
 const [loading,setLoading]=useState(!!sharedToken)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const [message,setMessage]=useState('')
 const [shareLink,setShareLink]=useState('')
 useEffect(()=>{let active=true;async function load(){
  const {data:{user}}=await createClient().auth.getUser()
  if(!active||!user)return
  const {data:wedding}=await createClient().from('weddings').select('id,wedding_type').limit(1).maybeSingle()
  if(active&&wedding){setWeddingId(wedding.id);setWeddingType(wedding.wedding_type)}
 }void load();return()=>{active=false}},[])
 useEffect(()=>{if(!sharedToken)return;let active=true;async function load(){
  const {data,error:err}=await createClient().rpc('get_wedding_plan_template',{p_token:sharedToken})
  if(!active)return
  if(err||!data||Array.isArray(data)||typeof data!=='object'){setError('This shared plan is unavailable.');setPreview(null)}
  else setPreview(data as unknown as TemplateInfo)
  setLoading(false)
 }void load();return()=>{active=false}},[sharedToken])
 async function openTemplate(slug:string){
  setActive(slug);setError('');setMessage('');setPreview(null);setLoading(true)
  const {data,error:err}=await createClient().rpc('get_wedding_plan_template',{p_slug:slug})
  if(err||!data||typeof data!=='object'||Array.isArray(data))setError('Unable to load the template.')
  else setPreview(data as unknown as TemplateInfo)
  setLoading(false)
 }
 async function apply(){
  if(!weddingId||busy)return
  setBusy(true);setError('');setMessage('')
  const {data,error:err}=await createClient().rpc('apply_wedding_plan_template',{p_wedding:weddingId,...(sharedToken?{p_token:sharedToken}:{p_slug:active||''})})
  if(err)setError('Could not add plan: '+err.message)
  else if(data&&typeof data==='object'&&!Array.isArray(data)){
   const result=data as Record<string,unknown>
   setMessage('Added '+String(result.events||0)+' events, '+String(result.tasks||0)+' tasks and '+String(result.budgets||0)+' budget categories. Existing information stays unchanged.')
  }else setMessage('The plan was applied. Open your dashboard to review.')
  setBusy(false)
 }
 async function share(){
  if(!weddingId||busy)return
  if(!window.confirm('Create a shareable plan? Anyone with the link can see your event types, checklist task titles and category budget estimates. Guest names, contact details, vendors, actual payments and private notes will NOT be included. Review task titles for personal information before sharing.'))return
  setBusy(true);setError('');setShareLink('')
  const {data,error:err}=await createClient().rpc('create_wedding_plan_share',{p_wedding:weddingId})
  if(err||!data)setError('Could not create your plan link: '+(err?.message||'Unknown error'))
  else setShareLink(window.location.origin+'/plans/shared/'+data)
  setBusy(false)
 }
 async function copy(){
  if(shareLink)await navigator.clipboard.writeText(shareLink).then(()=>setMessage('Copied plan link.')).catch(()=>setMessage('Select and copy the link below.'))
 }
 return <div className="space-y-6">
   {!sharedToken&&<>
    <div className="grid gap-4 md:grid-cols-3">{seeds.map(seed=><button type="button" key={seed.slug} onClick={()=>openTemplate(seed.slug)} className={'rounded-2xl border bg-white p-5 text-left transition-colors hover:border-primary '+(active===seed.slug?'border-primary':'border-border-soft')}>
      <BookOpen className="mb-3 h-6 w-6 text-primary"/>
      <h2 className="font-[family-name:var(--font-heading)] text-xl text-plum">{seed.title}</h2>
      <p className="mt-2 text-sm text-muted">{seed.description}</p>
      <p className="mt-4 text-sm font-semibold text-primary">Preview plan →</p>
    </button>)}</div>
   </>}
   {loading&&<p className="text-sm text-muted">Loading template…</p>}
   {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
   {preview&&<section className="rounded-2xl border border-border-soft bg-white p-5 sm:p-7">
     <h2 className="font-[family-name:var(--font-heading)] text-2xl text-plum">{preview.title}</h2>
     <p className="mt-2 text-sm text-muted">{preview.description}</p>
     {weddingType&&weddingType!==preview.type&&<p className="mt-3 rounded-xl bg-primary-soft/40 p-3 text-xs text-plum">This template is designed for a different wedding tradition. You can still use it and customize everything.</p>}
     <div className="mt-5 grid gap-5 sm:grid-cols-2">
       <div><h3 className="font-semibold text-plum">Event suggestions ({preview.events.length})</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">{preview.events.map((e,i)=><li key={i}>{e.replaceAll('_',' ')}</li>)}</ul></div>
       <div><h3 className="font-semibold text-plum">Budget categories ({preview.budgets.length})</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">{preview.budgets.map((b,i)=><li key={i}>{b.category.replaceAll('_',' ')}: {new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(b.budgeted)}</li>)}</ul></div>
     </div>
     <h3 className="mt-5 font-semibold text-plum">Checklist ({preview.tasks.length})</h3>
     <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-ink">{preview.tasks.map((task,i)=><li key={i}>{task}</li>)}</ul>
     <p className="mt-5 text-xs text-muted">Applying adds missing events, tasks and categories. It never replaces your existing plan. Dates, guests, vendor bookings and payments are not copied.</p>
     {weddingId?<button type="button" disabled={busy} onClick={apply} className="mt-4 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">Add this plan to our wedding</button>:
      <Link href="/auth/login?redirect=/plans" className="mt-4 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white">Sign in to use a plan</Link>}
   </section>}
   {message&&<p role="status" className="flex items-center gap-2 rounded-xl bg-primary-soft/40 p-4 text-sm text-plum"><CheckCircle2 className="h-5 w-5"/>{message}</p>}
   {!sharedToken&&weddingId&&<section className="rounded-2xl border border-border-soft bg-white p-5 sm:p-7">
    <div className="flex items-start gap-3"><ShieldCheck className="h-6 w-6 shrink-0 text-primary"/><div><h2 className="font-[family-name:var(--font-heading)] text-xl text-plum">Share a reusable version of your plan</h2><p className="mt-2 text-sm text-muted">Create a snapshot others can copy. It contains only event types, task titles and category budget estimates; no guest list, contact details, vendor selections, payments or private notes.</p></div></div>
    <p className="mt-3 text-xs text-muted">Task titles may contain names or personal details you entered. Check your checklist before creating a link. Anyone who has the link can see that snapshot.</p>
    <button type="button" disabled={busy} onClick={share} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-primary px-5 py-3 text-sm font-medium text-primary disabled:opacity-50"><Heart className="h-4 w-4"/>Create a shareable plan</button>
    {shareLink&&<div className="mt-4"><label className="text-xs text-muted">Your private, unlisted template URL<input readOnly value={shareLink} onFocus={e=>e.target.select()} className="mt-1 block w-full rounded-xl border border-border-soft p-3 text-sm"/></label><button type="button" onClick={copy} className="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm text-white"><Copy className="h-4 w-4"/>Copy link</button></div>}
   </section>}
 </div>
}
