'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
export type Package={title:string;description:string;starting_price_cad:number|null}
export type FAQ={question:string;answer:string}
export type PremiumProfileData={packages:Package[];faqs:FAQ[];highlights:string[];video_urls:string[]}
export default function PremiumProfileEditor({vendorId,initial}:{vendorId:string;initial:PremiumProfileData|null}){
  const router=useRouter()
  const [packages,setPackages]=useState<Package[]>(initial?.packages??[])
  const [faqs,setFaqs]=useState<FAQ[]>(initial?.faqs??[])
  const [highlights,setHighlights]=useState<string[]>(initial?.highlights??[])
  const [videos,setVideos]=useState<string[]>(initial?.video_urls??[])
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [message,setMessage]=useState('')
  async function save(){
    setBusy(true);setError('');setMessage('')
    try{
      const response=await fetch('/api/vendor/premium-profile',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({vendorId,packages,faqs,highlights,videoUrls:videos})
      })
      const result=await response.json() as {error?:string}
      if(!response.ok)throw new Error(result.error??'Unable to save Premium profile.')
      setMessage('Enhanced profile saved.')
      router.refresh()
    }catch(error){setError(error instanceof Error?error.message:'Unable to save profile.')}
    finally{setBusy(false)}
  }
  return <section className="rounded-2xl border border-border-soft bg-white p-6 sm:p-8 space-y-6">
    <div><h2 className="font-[family-name:var(--font-heading)] text-xl text-plum">Enhanced Premium profile</h2>
      <p className="mt-2 text-sm text-muted">Add up to 5 packages, 5 common questions, 5 highlights and 3 YouTube/Vimeo videos. Your content is kept if Premium lapses, but only shown publicly while Premium is active.</p>
    </div>
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-plum">Service packages</h3>
        <button type="button" disabled={packages.length>=5} onClick={()=>setPackages(p=>[...p,{title:'',description:'',starting_price_cad:null}])} className="text-xs font-semibold text-primary disabled:opacity-40">+ Add package</button></div>
      {packages.map((p,i)=><div key={i} className="rounded-xl border border-border-soft p-3 space-y-2">
        <input value={p.title} maxLength={100} placeholder="Package name" aria-label={`Package ${i+1} name`} onChange={e=>setPackages(a=>a.map((x,j)=>j===i?{...x,title:e.target.value}:x))} className="w-full rounded-lg border border-border-soft p-2 text-sm"/>
        <textarea value={p.description} maxLength={500} rows={2} placeholder="What the package includes" aria-label={`Package ${i+1} details`} onChange={e=>setPackages(a=>a.map((x,j)=>j===i?{...x,description:e.target.value}:x))} className="w-full rounded-lg border border-border-soft p-2 text-sm"/>
        <label className="block text-xs text-muted">Starting price (CAD, optional)
          <input type="number" min={1} max={1000000} value={p.starting_price_cad??''} onChange={e=>setPackages(a=>a.map((x,j)=>j===i?{...x,starting_price_cad:e.target.value===''?null:Number(e.target.value)}:x))} className="mt-1 w-full rounded-lg border border-border-soft p-2 text-sm"/>
        </label>
        <button type="button" className="text-xs text-red-700 underline" onClick={()=>setPackages(a=>a.filter((_,j)=>j!==i))}>Remove package</button>
      </div>)}
    </div>
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-plum">Frequently asked questions</h3>
        <button type="button" disabled={faqs.length>=5} onClick={()=>setFaqs(a=>[...a,{question:'',answer:''}])} className="text-xs font-semibold text-primary disabled:opacity-40">+ Add FAQ</button></div>
      {faqs.map((faq,i)=><div key={i} className="rounded-xl border border-border-soft p-3 space-y-2">
        <input value={faq.question} maxLength={160} placeholder="Question" aria-label={`Question ${i+1}`} onChange={e=>setFaqs(a=>a.map((x,j)=>j===i?{...x,question:e.target.value}:x))} className="w-full rounded-lg border border-border-soft p-2 text-sm"/>
        <textarea value={faq.answer} maxLength={600} rows={2} placeholder="Answer" aria-label={`Answer ${i+1}`} onChange={e=>setFaqs(a=>a.map((x,j)=>j===i?{...x,answer:e.target.value}:x))} className="w-full rounded-lg border border-border-soft p-2 text-sm"/>
        <button type="button" onClick={()=>setFaqs(a=>a.filter((_,j)=>j!==i))} className="text-xs text-red-700 underline">Remove FAQ</button>
      </div>)}
    </div>
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-plum">Business highlights</h3>
        <button type="button" disabled={highlights.length>=5} onClick={()=>setHighlights(a=>[...a,''])} className="text-xs font-semibold text-primary disabled:opacity-40">+ Add highlight</button></div>
      {highlights.map((value,i)=><div key={i} className="flex gap-2">
        <input value={value} maxLength={120} placeholder="For example, Tamil Hindu ceremony experience" onChange={e=>setHighlights(a=>a.map((x,j)=>j===i?e.target.value:x))} className="min-w-0 flex-1 rounded-lg border border-border-soft p-2 text-sm"/>
        <button type="button" onClick={()=>setHighlights(a=>a.filter((_,j)=>j!==i))} className="text-xs text-red-700 underline">Remove</button>
      </div>)}
    </div>
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-plum">Video showcase</h3>
        <button type="button" disabled={videos.length>=3} onClick={()=>setVideos(a=>[...a,''])} className="text-xs font-semibold text-primary disabled:opacity-40">+ Add video</button></div>
      <p className="text-xs text-muted">Paste a public YouTube or Vimeo video link. Videos are embedded on your profile and may set cookies from the video provider when viewed.</p>
      {videos.map((value,i)=><div key={i} className="flex gap-2">
        <input type="url" value={value} placeholder="https://www.youtube.com/watch?v=..." onChange={e=>setVideos(a=>a.map((x,j)=>j===i?e.target.value:x))} className="min-w-0 flex-1 rounded-lg border border-border-soft p-2 text-sm"/>
        <button type="button" onClick={()=>setVideos(a=>a.filter((_,j)=>j!==i))} className="text-xs text-red-700 underline">Remove</button>
      </div>)}
    </div>
    {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {message&&<p role="status" className="rounded-lg bg-primary-soft p-3 text-sm text-plum">{message}</p>}
    <button type="button" onClick={()=>void save()} disabled={busy} className="rounded-xl bg-plum px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy?'Saving…':'Save Premium profile'}</button>
  </section>
}
