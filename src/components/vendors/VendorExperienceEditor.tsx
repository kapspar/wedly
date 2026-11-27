'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  categoryExperienceEntries, experienceFields, experienceOptions, weddingExperienceOptions,
  type ExperienceCategory, type WeddingExperience,
} from '@/lib/vendors/wedding-experience'

const emptyExperience: WeddingExperience = { cultures: [], ceremonies: [], notes: '', category_details: {} }
const fieldClass = 'w-full rounded-xl border border-border-soft px-3 py-2.5 text-base text-ink'

export default function VendorExperienceEditor({ vendorId, categories, initial }: {
  vendorId: string
  categories: ExperienceCategory[]
  initial: WeddingExperience | null
}) {
  const [experience, setExperience] = useState(initial ?? emptyExperience)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  function toggle(group: 'cultures' | 'ceremonies', value: string) {
    setExperience(previous => ({
      ...previous,
      [group]: previous[group].includes(value)
        ? previous[group].filter(item => item !== value)
        : [...previous[group], value],
    }))
    setStatus('idle')
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('saving')
    try {
      const db = createClient()
      const category_details = Object.fromEntries(categories.flatMap(category => {
        const entries = categoryExperienceEntries(category, experience.category_details)
        return entries.length ? [[category.id, Object.fromEntries(entries.map(({ field, value }) => [field, value]))]] : []
      }))
      const { error } = await db.from('vendor_wedding_experience').upsert({
        vendor_id: vendorId,
        cultures: experienceOptions('cultures', experience.cultures),
        ceremonies: experienceOptions('ceremonies', experience.ceremonies),
        notes: experience.notes.trim(),
        category_details,
      }, { onConflict: 'vendor_id' })
      setStatus(error ? 'error' : 'saved')
    } catch {
      setStatus('error')
    }
  }

  return (
    <form id="experience" onSubmit={save} className="mt-6 scroll-mt-24 rounded-2xl border border-border-soft bg-white p-4 sm:p-8">
      <h2 className="font-[family-name:var(--font-heading)] text-xl text-plum">Wedding experience</h2>
      <p className="mt-2 text-sm text-muted">Select the cultures and ceremonies you’ve worked with. Couples will see this on your published listing.</p>
      <fieldset disabled={status === 'saving'} className="mt-5 min-w-0 space-y-6">
        {(Object.keys(weddingExperienceOptions) as ('cultures' | 'ceremonies')[]).map(group => (
          <fieldset key={group}>
            <legend className="mb-2 font-medium text-ink">{group === 'cultures' ? 'Cultural traditions' : 'Religious and ceremony traditions'}</legend>
            <div className="flex flex-wrap gap-2">
              {weddingExperienceOptions[group].map(option => (
                <label key={option} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-border-soft px-3 text-sm text-ink has-checked:bg-primary-soft/50">
                  <input type="checkbox" checked={experience[group].includes(option)} onChange={() => toggle(group, option)} />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <label className="block space-y-2 text-sm font-medium text-ink">
          <span>Other traditions, rituals or languages</span>
          <textarea rows={3} maxLength={600} value={experience.notes} onChange={event => {
            setExperience({ ...experience, notes: event.target.value })
            setStatus('idle')
          }} className={fieldClass} />
        </label>
        {categories.map(category => (
          <details key={category.id} className="rounded-xl border border-border-soft px-3">
            <summary className="min-h-11 cursor-pointer py-3 font-medium text-plum">{category.name} details</summary>
            <div className="grid gap-4 pb-4 sm:grid-cols-2">
              {experienceFields(category.slug).map(([field, label]) => (
                <label key={field} className="min-w-0 space-y-2 text-sm font-medium text-ink">
                  <span>{label}</span>
                  <textarea rows={2} maxLength={300} value={experience.category_details[category.id]?.[field] ?? ''} onChange={event => {
                    const value = event.target.value
                    setExperience(previous => ({
                      ...previous,
                      category_details: {
                        ...previous.category_details,
                        [category.id]: { ...previous.category_details[category.id], [field]: value },
                      },
                    }))
                    setStatus('idle')
                  }} className={fieldClass} />
                </label>
              ))}
            </div>
          </details>
        ))}
        <div className="space-y-2">
          <button type="submit" className="min-h-11 w-full rounded-xl bg-plum px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto">
            {status === 'saving' ? 'Saving…' : 'Save wedding experience'}
          </button>
          {status === 'saved' && <p role="status" className="text-sm text-green-700">Wedding experience saved.</p>}
          {status === 'error' && <p role="alert" className="text-sm text-red-700">Couldn’t save your wedding experience. Check your connection and try again.</p>}
        </div>
      </fieldset>
    </form>
  )
}
