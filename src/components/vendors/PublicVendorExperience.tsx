import { selectedTraditions } from '@/lib/vendors/traditions'
import { categoryExperienceEntries, experienceOptions, type ExperienceCategory, type WeddingExperience } from '@/lib/vendors/wedding-experience'

export default function PublicVendorExperience({ experience, categories }: {
  experience: WeddingExperience
  categories: ExperienceCategory[]
}) {
  const traditions = selectedTraditions(experience.traditions)
  const cultures = experienceOptions('cultures', experience.cultures)
  const ceremonies = experienceOptions('ceremonies', experience.ceremonies)
  const groups = categories.map(category => ({
    category,
    entries: categoryExperienceEntries(category, experience.category_details),
  })).filter(group => group.entries.length)
  if (!traditions.length && !cultures.length && !ceremonies.length && !experience.notes.trim() && !groups.length) return null

  return (
    <section className="space-y-4 rounded-2xl border border-border-soft bg-white p-5 [overflow-wrap:anywhere] sm:p-8">
      <h2 className="font-[family-name:var(--font-heading)] text-xl text-ink">Wedding experience</h2>
      <p className="text-sm text-muted">Reported by the vendor</p>
      {traditions.length > 0 && <ul aria-label="Specific wedding traditions" className="flex flex-wrap gap-2">
        {traditions.map(([key, label]) => <li key={key} className="rounded-full bg-primary-soft px-3 py-1 text-sm font-medium text-plum">{label}</li>)}
      </ul>}
      {cultures.length > 0 && <p className="text-sm text-ink"><strong>Cultural traditions</strong><br />{cultures.join(' · ')}</p>}
      {ceremonies.length > 0 && <p className="text-sm text-ink"><strong>Religious and ceremony traditions</strong><br />{ceremonies.join(' · ')}</p>}
      {experience.notes && <p className="whitespace-pre-line text-sm text-ink">{experience.notes}</p>}
      {groups.map(({ category, entries }) => (
        <div key={category.id} className="border-t border-border-soft pt-4">
          <h3 className="font-semibold text-plum">{category.name}</h3>
          <dl className="mt-2 grid gap-3 sm:grid-cols-2">
            {entries.map(({ field, label, value }) => (
              <div key={field} className="text-sm text-ink">
                <dt className="font-medium">{label}</dt>
                <dd className="whitespace-pre-line">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </section>
  )
}
