'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Category = { id: string; name: string }
type Fields = {
  category_id: string
  name: string
  city: string
  area: string
  business_email: string
  phone: string
  website_url: string
  instagram_url: string
  description: string
  pricing_range: string
}

export default function NewVendorForm({ requesterId, categories }: { requesterId: string; categories: Category[] }) {
  const router = useRouter()
  const [fields, setFields] = useState<Fields>({
    category_id: '', name: '', city: '', area: '', business_email: '',
    phone: '', website_url: '', instagram_url: '', description: '', pricing_range: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const update = (key: keyof Fields, value: string) => setFields(previous => ({ ...previous, [key]: value }))

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setError('')
    if (!fields.category_id || !fields.name.trim() || !fields.city.trim() || !fields.business_email.trim()) {
      setError('Category, name, city and business email are required.')
      return
    }
    for (const key of ['website_url', 'instagram_url'] as const) {
      if (fields[key] && !/^https:\/\//i.test(fields[key].trim())) {
        setError('Website and Instagram links must begin with https://')
        return
      }
    }
    setBusy(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== requesterId) {
      setBusy(false)
      setError('Your session expired. Please sign in again.')
      return
    }
    const { error: saveError } = await supabase.from('vendor_listing_requests').insert({
      requester_id: user.id,
      category_id: fields.category_id,
      name: fields.name.trim(),
      city: fields.city.trim(),
      area: fields.area.trim() || null,
      business_email: fields.business_email.trim(),
      phone: fields.phone.trim() || null,
      website_url: fields.website_url.trim() || null,
      instagram_url: fields.instagram_url.trim() || null,
      description: fields.description.trim() || null,
      pricing_range: fields.pricing_range.trim() || null,
    })
    setBusy(false)
    if (saveError) {
      setError(saveError.code === '23505'
        ? 'You already have a pending submission for this business and city.'
        : 'Could not submit this business: ' + saveError.message)
      return
    }
    setSubmitted(true)
    router.refresh()
  }

  if (submitted) return (
    <div className="rounded-2xl border border-border-soft bg-white p-8">
      <h2 className="font-[family-name:var(--font-heading)] text-2xl text-plum">Business submitted for review</h2>
      <p className="mt-4 text-muted">
        Thanks! Your submission is pending verification and is not public yet. You can track its status on your vendor dashboard.
      </p>
      <Link href="/vendor/dashboard" className="mt-6 inline-block rounded-xl bg-plum px-5 py-3 text-sm font-medium text-white">
        Return to dashboard
      </Link>
    </div>
  )

  const textFields = [
    ['name', 'Business name', true],
    ['city', 'Base city', true],
    ['area', 'Service area', false],
    ['business_email', 'Business email address', true],
    ['phone', 'Business phone', false],
    ['website_url', 'Website (https://)', false],
    ['instagram_url', 'Instagram URL (https://)', false],
    ['pricing_range', 'Pricing guidance', false],
  ] as const

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border-soft bg-white p-6 sm:p-8 shadow-sm">
      <div>
        <label htmlFor="new-category" className="mb-2 block text-sm font-medium text-ink">Business category *</label>
        <select id="new-category" required value={fields.category_id} onChange={e => update('category_id', e.target.value)}
          className="w-full rounded-xl border border-border-soft bg-white px-4 py-3 text-sm text-ink">
          <option value="">Select a category</option>
          {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {textFields.map(([key, label, required]) => (
          <div key={key}>
            <label htmlFor={`new-${key}`} className="mb-2 block text-sm font-medium text-ink">{label}{required && ' *'}</label>
            <input id={`new-${key}`} required={required}
              type={key === 'business_email' ? 'email' : key.endsWith('_url') ? 'url' : 'text'}
              minLength={key === 'name' || key === 'city' ? 2 : undefined}
              maxLength={key === 'name' ? 180 : key === 'city' ? 120 : key === 'business_email' ? 254 : 500}
              value={fields[key]} onChange={e => update(key, e.target.value)}
              className="w-full rounded-xl border border-border-soft px-4 py-3 text-sm text-ink" />
          </div>
        ))}
      </div>
      <div>
        <label htmlFor="new-description" className="mb-2 block text-sm font-medium text-ink">About your business</label>
        <textarea id="new-description" value={fields.description} maxLength={5000} rows={5}
          onChange={e => update('description', e.target.value)}
          className="w-full rounded-xl border border-border-soft px-4 py-3 text-sm text-ink"
          placeholder="What services do you provide for weddings?" />
      </div>
      <p className="text-sm text-muted">We review submissions to prevent duplicates and verify business ownership before publication. A free listing includes one image after approval.</p>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={busy || categories.length === 0}
        className="rounded-xl bg-plum px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">
        {busy ? 'Submitting…' : 'Submit business for review'}
      </button>
    </form>
  )
}
