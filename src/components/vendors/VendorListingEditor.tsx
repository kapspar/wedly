'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Vendor = {
  id: string
  name: string
  slug: string
  description: string | null
  city: string
  area: string | null
  service_areas: string[]
  pricing_range: string | null
  website_url: string | null
  phone: string | null
  email: string | null
  instagram_url: string | null
  tiktok_url: string | null
  facebook_url: string | null
  youtube_url: string | null
  pinterest_url: string | null
  snapchat_url: string | null
  linkedin_url: string | null
  whatsapp_url: string | null
}

type PhotoWithSlot = { id: string; storage_path: string; alt_text: string | null; sort_order: number }

const imageSlots = [
  { slot: 0, title: 'Directory cover', dimensions: '1200 × 600 px', ratio: '2:1', description: 'Shown on Browse Vendors and saved vendor cards. Choose a horizontal image, with the subject near the centre.' },
  { slot: 1, title: 'Business logo', dimensions: '600 × 600 px', ratio: '1:1', description: 'Shown alongside your business name. Upload a square logo with some padding so lettering is not cut off.' },
  { slot: 2, title: 'Profile banner', dimensions: '1600 × 640 px', ratio: '5:2', description: 'Wide image at the top of your profile. Keep important details away from the edges, which may be cropped on phones.' },
] as const

const editable = [
  ['name', 'Business name'],
  ['city', 'Base city'],
  ['area', 'Local neighbourhood (optional)'],
  ['pricing_range', 'Pricing guidance'],
  ['website_url', 'Website'],
  ['phone', 'Phone'],
  ['email', 'Business email'],
  ['instagram_url', 'Instagram URL'],
  ['tiktok_url', 'TikTok URL'],
  ['facebook_url', 'Facebook URL'],
  ['youtube_url', 'YouTube URL'],
  ['pinterest_url', 'Pinterest URL'],
  ['snapchat_url', 'Snapchat URL'],
  ['linkedin_url', 'LinkedIn URL'],
  ['whatsapp_url', 'WhatsApp URL'],
] as const

export default function VendorListingEditor({ vendor, initialPhotos, premiumPreview }: { vendor: Vendor; initialPhotos: PhotoWithSlot[]; premiumPreview: boolean }) {
  const router = useRouter()
  const [fields, setFields] = useState({
    name: vendor.name,
    city: vendor.city,
    area: vendor.area ?? '',
    description: vendor.description ?? '',
    pricing_range: vendor.pricing_range ?? '',
    website_url: vendor.website_url ?? '',
    phone: vendor.phone ?? '',
    email: vendor.email ?? '',
    instagram_url: vendor.instagram_url ?? '',
    tiktok_url: vendor.tiktok_url ?? '',
    facebook_url: vendor.facebook_url ?? '',
    youtube_url: vendor.youtube_url ?? '',
    pinterest_url: vendor.pinterest_url ?? '',
    snapchat_url: vendor.snapchat_url ?? '',
    linkedin_url: vendor.linkedin_url ?? '',
    whatsapp_url: vendor.whatsapp_url ?? '',
  })
  const [serviceAreas, setServiceAreas] = useState((vendor.service_areas ?? []).join(', '))
  const [photos, setPhotos] = useState(initialPhotos)
  const [busy, setBusy] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const set = (key: keyof typeof fields, value: string) => setFields(previous => ({ ...previous, [key]: value }))

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!fields.name.trim() || !fields.city.trim()) {
      setError('Business name and city are required.')
      return
    }
    for (const key of ['website_url', 'instagram_url', 'tiktok_url', 'facebook_url', 'youtube_url', 'pinterest_url', 'snapchat_url', 'linkedin_url', 'whatsapp_url'] as const) {
      const value = fields[key].trim()
      if (value && !/^https:\/\//i.test(value)) {
        setError('Website and social links must start with https://')
        return
      }
    }
    const parsedAreas = [...new Map(serviceAreas.split(/[,\n]/).map(s=>s.trim()).filter(Boolean).map(s=>[s.toLocaleLowerCase('en-CA'),s])).values()]
    if(parsedAreas.length>20 || parsedAreas.some(s=>s.length>80)){setError('Enter up to 20 service areas (80 characters each).');return}
    setBusy(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Session expired. Please sign in again.')
      setBusy(false)
      return
    }
    const { error: updateError } = await supabase.from('vendors')
      .update({
        name: fields.name.trim(),
        city: fields.city.trim(),
        area: fields.area.trim() || null,
        service_areas: parsedAreas,
        description: fields.description.trim() || null,
        pricing_range: fields.pricing_range.trim() || null,
        website_url: fields.website_url.trim() || null,
        phone: fields.phone.trim() || null,
        email: fields.email.trim() || null,
        instagram_url: fields.instagram_url.trim() || null,
        tiktok_url: fields.tiktok_url.trim() || null,
        facebook_url: fields.facebook_url.trim() || null,
        youtube_url: fields.youtube_url.trim() || null,
        pinterest_url: fields.pinterest_url.trim() || null,
        snapchat_url: fields.snapchat_url.trim() || null,
        linkedin_url: fields.linkedin_url.trim() || null,
        whatsapp_url: fields.whatsapp_url.trim() || null,
      })
      .eq('id', vendor.id).eq('claimed_by', user.id).eq('is_claimed', true)
      .select('id').single()
    setBusy(false)
    if (updateError) { setError('Could not save changes: ' + updateError.message); return }
    setMessage('Your listing has been updated.')
    router.refresh()
  }

  async function upload(file: File | undefined, slot: number) {
    if (!file || photoBusy) return
    setError('')
    setMessage('')
    if (photos.some(p=>p.sort_order===slot)) {
      setError('Remove the existing image before uploading to this position.')
      return
    }
    if (slot>=3 && !premiumPreview) {
      setError('Premium Preview is required to upload gallery photos.')
      return
    }
    setPhotoBusy(true)
    try {
      const body=new FormData()
      body.set('vendorId',vendor.id)
      body.set('slot',String(slot))
      body.set('file',file)
      const response=await fetch('/api/vendor/photos',{method:'POST',body})
      const payload=await response.json() as {error?:string;photo?:PhotoWithSlot}
      if(!response.ok||!payload.photo)throw new Error(payload.error??'Photo upload failed.')
      setPhotos(previous=>[...previous,payload.photo!])
      setMessage('Image uploaded.')
      router.refresh()
    }catch(error){
      setError(error instanceof Error?error.message:'Photo upload failed.')
    }finally{setPhotoBusy(false)}
  }

  async function removePhoto(photo:PhotoWithSlot) {
    if(photoBusy)return
    setError('')
    setMessage('')
    setPhotoBusy(true)
    try {
      const response=await fetch('/api/vendor/photos',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({vendorId:vendor.id,photoId:photo.id})})
      const payload=await response.json() as {error?:string}
      if(!response.ok)throw new Error(payload.error??'Unable to remove image.')
      setPhotos(previous=>previous.filter(p=>p.id!==photo.id))
      setMessage('Image removed.')
      router.refresh()
    }catch(error){
      setError(error instanceof Error?error.message:'Unable to remove image.')
    }finally{setPhotoBusy(false)}
  }

  return (
    <div className="mt-8 space-y-8">
      <form onSubmit={save} className="rounded-2xl border border-border-soft bg-white p-6 sm:p-8 space-y-5">
        <h2 className="font-[family-name:var(--font-heading)] text-xl text-plum">Business information</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {editable.map(([key, label]) => (
            <div key={key}>
              <label htmlFor={key} className="mb-2 block text-sm font-medium text-ink">{label}</label>
              <input id={key} type={key === 'email' ? 'email' : key.includes('url') ? 'url' : 'text'}
                maxLength={key === 'name' ? 180 : 500} required={key === 'name' || key === 'city'}
                value={fields[key]} onChange={e => set(key, e.target.value)}
                className="w-full rounded-xl border border-border-soft px-4 py-3 text-sm text-ink" />
            </div>
          ))}
        </div>
        <div>
          <label htmlFor="service-areas" className="mb-2 block text-sm font-medium text-ink">Where you provide services</label>
          <textarea id="service-areas" rows={2} maxLength={1600} value={serviceAreas} onChange={e=>setServiceAreas(e.target.value)} placeholder="Ajax, Whitby, Toronto, Durham Region" className="w-full rounded-xl border border-border-soft px-4 py-3 text-sm text-ink" />
          <p className="mt-1 text-xs text-muted">Enter cities or regions separated by commas. Your base city above is separate. Add only locations you actually serve.</p>
        </div>
        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-medium text-ink">About your business</label>
          <textarea id="description" rows={6} maxLength={5000}
            value={fields.description} onChange={e => set('description', e.target.value)}
            className="w-full rounded-xl border border-border-soft px-4 py-3 text-sm text-ink" />
        </div>
        <button type="submit" disabled={busy} className="rounded-xl bg-plum px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? 'Saving…' : 'Save listing details'}
        </button>
      </form>

      <section className="rounded-2xl border border-border-soft bg-white p-6 sm:p-8">
        <h2 className="font-[family-name:var(--font-heading)] text-xl text-plum">Free listing images</h2>
        <p className="mt-2 text-sm text-muted">Your free listing includes a directory cover, logo and header image. Upload each separately; you can replace them at any time.</p>
        <div className="mt-4 rounded-xl bg-primary-soft/40 p-4 text-sm text-ink">
          <p className="font-semibold">Image upload guide</p>
          <p className="mt-1">Crop your images to the recommended dimensions below before uploading for the best results. JPG, PNG and WebP files up to 5 MB each are accepted. Exact pixel sizes are recommended, not required.</p>
          <p className="mt-2 text-muted">Images fill their designated spaces and may be cropped on different screen sizes. Keep faces, text and important details in the centre; avoid placing writing near the edges.</p>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {imageSlots.map(({ slot, title, description, dimensions, ratio }) => {
            const photo = photos.find(p => p.sort_order === slot)
            const publicUrl = photo ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vendor-photos/${photo.storage_path}` : ''
            return (
              <div key={slot} className="rounded-xl border border-border-soft p-4">
                <h3 className="font-semibold text-plum">{title}</h3>
                <p className="mt-1 text-xs font-semibold text-primary">Recommended: {dimensions} · {ratio} aspect ratio</p>
                <p className="mt-1 mb-4 text-xs text-muted">{description}</p>
                {photo ? (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={publicUrl} alt={photo.alt_text || title} className={`w-full rounded-lg object-cover bg-primary-soft/30 ${slot === 1 ? 'h-40 object-contain' : 'h-40'}`} />
                    <button type="button" disabled={photoBusy} onClick={() => void removePhoto(photo)}
                      className="rounded-xl border border-border-soft px-4 py-2 text-sm font-medium text-plum disabled:opacity-50">
                      {photoBusy ? 'Working…' : 'Remove image'}
                    </button>
                  </div>
                ) : (
                  <label className="block cursor-pointer rounded-xl border border-dashed border-primary px-5 py-6 text-center text-sm font-medium text-primary hover:bg-primary-soft/30">
                    {photoBusy ? 'Working…' : 'Choose image'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" disabled={photoBusy}
                      className="sr-only" onChange={e => {
                        void upload(e.target.files?.[0], slot)
                        e.target.value = ''
                      }} />
                  </label>
                )}
              </div>
            )
          })}
        </div>
      </section>
      <section className="rounded-2xl border border-border-soft bg-white p-6 sm:p-8">
        <h2 className="font-[family-name:var(--font-heading)] text-xl text-plum">Premium photo portfolio</h2>
        <p className="mt-2 text-sm text-muted">Showcase up to 15 additional wedding photos. These appear publicly only while your Premium Preview subscription is active. Photos are preserved if Premium expires.</p>
        {!premiumPreview&&<p className="mt-3 rounded-xl bg-primary-soft/40 p-3 text-sm text-plum">Upgrade to Premium Preview to unlock portfolio uploads. You can still remove photos previously uploaded.</p>}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {Array.from({length:15},(_,index)=>index+3).map(slot=>{
            const photo=photos.find(p=>p.sort_order===slot)
            const url=photo?`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vendor-photos/${photo.storage_path}`:''
            return <div key={slot} className="rounded-xl border border-border-soft p-3">
              <p className="mb-2 text-xs font-semibold text-plum">Portfolio photo {slot-2} of 15</p>
              {photo?<div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={photo.alt_text??'Portfolio photo'} className="h-36 w-full rounded-lg object-cover"/>
                <button type="button" disabled={photoBusy} onClick={()=>void removePhoto(photo)} className="text-xs text-red-700 underline disabled:opacity-50">Remove image</button>
              </div>:premiumPreview?<label className="block cursor-pointer rounded-lg border border-dashed border-primary px-3 py-6 text-center text-xs font-medium text-primary">
                {photoBusy?'Working…':'Choose photo'}
                <input type="file" accept="image/jpeg,image/png,image/webp" disabled={photoBusy} className="sr-only" onChange={e=>{void upload(e.target.files?.[0],slot);e.target.value=''}}/>
              </label>:<p className="rounded-lg bg-ivory p-6 text-center text-xs text-muted">Premium only</p>}
            </div>
          })}
        </div>
      </section>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-xl bg-primary-soft p-4 text-sm text-plum">{message}</p>}
      <Link href={`/vendor/${vendor.slug}`} className="inline-block text-sm font-medium text-primary hover:underline">View your public listing</Link>
    </div>
  )
}
