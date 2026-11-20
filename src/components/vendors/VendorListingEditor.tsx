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

type Photo = { id: string; storage_path: string; alt_text: string | null }

const editable = [
  ['name', 'Business name'],
  ['city', 'City'],
  ['area', 'Service area / neighbourhood'],
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

export default function VendorListingEditor({ vendor, initialPhoto }: { vendor: Vendor; initialPhoto: Photo | null }) {
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
  const [photo, setPhoto] = useState(initialPhoto)
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

  async function upload(file: File | undefined) {
    if (!file) return
    setError('')
    setMessage('')
    if (photo) { setError('Your free listing already has one photo. Remove it before adding another.'); return }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a JPG, PNG or WebP image smaller than 5 MB.')
      return
    }
    setPhotoBusy(true)
    const supabase = createClient()
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `${vendor.id}/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('vendor-photos').upload(path, file, { contentType: file.type, upsert: false })
    if (uploadError) {
      setError('Photo upload failed: ' + uploadError.message)
      setPhotoBusy(false)
      return
    }
    const { data, error: insertError } = await supabase.from('vendor_photos')
      .insert({ vendor_id: vendor.id, storage_path: path, alt_text: vendor.name, sort_order: 0 })
      .select('id,storage_path,alt_text').single()
    if (insertError || !data) {
      await supabase.storage.from('vendor-photos').remove([path])
      setError('Could not attach photo to listing. ' + (insertError?.message ?? 'Try again.'))
      setPhotoBusy(false)
      return
    }
    setPhoto(data)
    setMessage('Photo uploaded successfully.')
    setPhotoBusy(false)
    router.refresh()
  }

  async function removePhoto() {
    if (!photo) return
    setError('')
    setMessage('')
    setPhotoBusy(true)
    const supabase = createClient()
    const { error: removeError } = await supabase.storage.from('vendor-photos').remove([photo.storage_path])
    if (removeError) {
      setError('Could not remove photo: ' + removeError.message)
      setPhotoBusy(false)
      return
    }
    const { error: deleteError } = await supabase.from('vendor_photos').delete()
      .eq('id', photo.id).eq('vendor_id', vendor.id)
    setPhotoBusy(false)
    if (deleteError) { setError('Photo record could not be removed. Contact PlanWedly support.'); return }
    setPhoto(null)
    setMessage('Photo removed. You can upload a new photo.')
    router.refresh()
  }

  const publicUrl = photo ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vendor-photos/${photo.storage_path}` : ''
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
        <h2 className="font-[family-name:var(--font-heading)] text-xl text-plum">Listing photo</h2>
        <p className="mt-2 text-sm text-muted">One photo is included free. JPG, PNG or WebP, up to 5 MB.</p>
        {photo ? (
          <div className="mt-5 space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={publicUrl} alt={photo.alt_text || vendor.name} className="h-56 w-full max-w-md rounded-xl object-cover" />
            <button disabled={photoBusy} onClick={removePhoto} className="rounded-xl border border-border-soft px-4 py-2.5 text-sm font-medium text-plum disabled:opacity-50">
              {photoBusy ? 'Removing…' : 'Remove photo'}
            </button>
          </div>
        ) : (
          <label className="mt-5 block max-w-md cursor-pointer rounded-xl border border-dashed border-primary px-5 py-6 text-center text-sm font-medium text-primary hover:bg-primary-soft/30">
            {photoBusy ? 'Uploading…' : 'Choose a listing photo'}
            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={photoBusy} className="sr-only" onChange={e => {
              void upload(e.target.files?.[0])
              e.target.value = ''
            }} />
          </label>
        )}
      </section>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-xl bg-primary-soft p-4 text-sm text-plum">{message}</p>}
      <Link href={`/vendor/${vendor.slug}`} className="inline-block text-sm font-medium text-primary hover:underline">View your public listing</Link>
    </div>
  )
}
