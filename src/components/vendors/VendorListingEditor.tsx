'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { httpsLink } from '@/lib/vendors/portfolio'

type Vendor = {
  id: string
  name: string
  description: string | null
  city: string
  area: string | null
  service_areas: string[]
  street_address: string | null
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

const editable = [
  ['name', 'Business name'],
  ['city', 'Base city'],
  ['area', 'Local neighbourhood (optional)'],
  ['street_address', 'Public venue street address (venues only)'],
  ['pricing_range', 'Pricing guidance'],
  ['website_url', 'Website'],
  ['phone', 'Phone'],
  ['email', 'Business email'],
] as const

const socials = [
  ['instagram_url', 'Instagram URL'],
  ['tiktok_url', 'TikTok URL'],
  ['facebook_url', 'Facebook URL'],
  ['youtube_url', 'YouTube URL'],
  ['pinterest_url', 'Pinterest URL'],
  ['snapchat_url', 'Snapchat URL'],
  ['linkedin_url', 'LinkedIn URL'],
  ['whatsapp_url', 'WhatsApp URL'],
] as const

export default function VendorListingEditor({ vendor }: { vendor: Vendor }) {
  const router = useRouter()
  const [fields, setFields] = useState({
    name: vendor.name,
    city: vendor.city,
    area: vendor.area ?? '',
    street_address: vendor.street_address ?? '',
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
  const [busy, setBusy] = useState(false)
  const [listingMessage, setListingMessage] = useState('')
  const [listingError, setListingError] = useState('')

  const set = (key: keyof typeof fields, value: string) => setFields(previous => ({ ...previous, [key]: value }))

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setListingError('')
    setListingMessage('')
    if (!fields.name.trim() || !fields.city.trim()) {
      setListingError('Business name and city are required.')
      return
    }
    for (const [key, label] of [['website_url', 'Website'] as const, ...socials]) {
      const value = fields[key].trim()
      if (value && value !== vendor[key] && !httpsLink(value)) {
        setListingError(`Enter a valid HTTPS link for ${label}.`)
        return
      }
    }
    const email = e.currentTarget.querySelector<HTMLInputElement>('#email')
    if (email?.validity.typeMismatch && fields.email.trim() !== vendor.email) {
      setListingError('Enter a valid business email.')
      return
    }
    const parsedAreas = [...new Map(serviceAreas.split(/[,\n]/).map(s=>s.trim()).filter(Boolean).map(s=>[s.toLocaleLowerCase('en-CA'),s])).values()]
    if(parsedAreas.length>20 || parsedAreas.some(s=>s.length>80)){setListingError('Enter up to 20 service areas (80 characters each).');return}
    setBusy(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setListingError('Session expired. Please sign in again.')
      setBusy(false)
      return
    }
    const { error: updateError } = await supabase.from('vendors')
      .update({
        name: fields.name.trim(),
        city: fields.city.trim(),
        area: fields.area.trim() || null,
        service_areas: parsedAreas,
        street_address: fields.street_address.trim() || null,
        ...(fields.street_address.trim() !== (vendor.street_address ?? '').trim() ? { latitude: null, longitude: null, coordinates_expires_at: null } : {}),
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
    if (updateError) { setListingError('Could not save changes: ' + updateError.message); return }
    setListingMessage('Your listing has been updated.')
    router.refresh()
  }

  return (
    <div className="mt-8 space-y-8">
      <form id="business-info" onSubmit={save} noValidate className="scroll-mt-24 space-y-5 rounded-2xl border border-border-soft bg-white p-4 sm:p-8">
        <h2 className="font-[family-name:var(--font-heading)] text-xl text-plum">Business information</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {editable.map(([key, label]) => (
            <div key={key}>
              <label htmlFor={key} className="mb-2 block text-sm font-medium text-ink">{label}</label>
              <input id={key} type={key === 'email' ? 'email' : key.includes('url') ? 'url' : key === 'phone' ? 'tel' : 'text'}
                maxLength={key === 'name' ? 180 : 500} required={key === 'name' || key === 'city'}
                value={fields[key]} onChange={e => set(key, e.target.value)}
                className="w-full rounded-xl border border-border-soft px-3 py-3 text-base text-ink" />
            </div>
          ))}
        </div>
        <div>
          <label htmlFor="service-areas" className="mb-2 block text-sm font-medium text-ink">Where you provide services</label>
          <textarea id="service-areas" rows={2} maxLength={1600} value={serviceAreas} onChange={e=>setServiceAreas(e.target.value)} placeholder="Ajax, Whitby, Toronto, Durham Region" className="w-full scroll-mt-28 rounded-xl border border-border-soft px-3 py-3 text-base text-ink" />
          <p className="mt-1 text-xs text-muted">Enter cities or regions separated by commas. Your base city above is separate. Add only locations you actually serve.</p>
        </div>
        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-medium text-ink">About your business</label>
          <textarea id="description" rows={6} maxLength={5000}
            value={fields.description} onChange={e => set('description', e.target.value)}
            className="w-full scroll-mt-28 rounded-xl border border-border-soft px-3 py-3 text-base text-ink" />
        </div>
        <fieldset id="social-links" className="min-w-0 scroll-mt-24 rounded-xl border border-border-soft p-3 sm:p-4">
          <legend className="px-1 font-semibold text-plum">Social links</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {socials.map(([key, label]) => (
              <label key={key} className="min-w-0 space-y-2 text-sm font-medium text-ink">
                <span>{label}</span>
                <input type="url" inputMode="url" maxLength={500} value={fields[key]} onChange={event => set(key, event.target.value)}
                  placeholder="https://" className="w-full rounded-xl border border-border-soft px-3 py-3 text-base text-ink" />
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" disabled={busy} className="min-h-11 w-full rounded-xl bg-plum px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto">
          {busy ? 'Saving…' : 'Save listing details'}
        </button>
        {listingError && <p role="alert" className="text-sm text-red-700">{listingError}</p>}
        {listingMessage && <p role="status" className="text-sm text-plum">{listingMessage}</p>}
      </form>

    </div>
  )
}
