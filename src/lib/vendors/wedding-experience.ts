export const weddingExperienceOptions = {
  cultures: ['Tamil', 'Punjabi', 'Gujarati', 'Bengali', 'Other South Asian', 'East Asian', 'Filipino', 'Caribbean', 'African', 'Middle Eastern', 'European', 'Multicultural'],
  ceremonies: ['Hindu', 'Catholic', 'Christian', 'Muslim / Nikah', 'Sikh / Anand Karaj', 'Buddhist', 'Jewish', 'Civil / secular', 'Interfaith'],
} as const

export const categoryExperienceFields: Record<string, readonly [string, string][]> = {
  venues: [['ceremony_spaces', 'Ceremony spaces and setups'], ['catering_policy', 'Outside catering and ceremony policies']],
  photographers: [['coverage', 'Ceremony coverage'], ['deliverables', 'Photography deliverables']],
  videographers: [['coverage', 'Ceremony coverage'], ['deliverables', 'Films and livestream options']],
  'photography-media': [['coverage', 'Ceremony coverage'], ['deliverables', 'Photo, video and social deliverables']],
  decorators: [['installations', 'Ceremony installations'], ['rentals', 'Décor and rentals']],
  djs: [['music', 'Music styles and languages'], ['production', 'MC, sound and lighting']],
  priests: [['ceremonies', 'Ceremonies offered'], ['languages', 'Languages and preparation']],
  'makeup-artists': [['styling', 'Hair and makeup services'], ['draping', 'Draping, pleating and other services']],
  florists: [['florals', 'Ceremony flowers and garlands'], ['setup', 'Delivery and installation']],
  jewelers: [['collections', 'Wedding collections'], ['customization', 'Customization and sizing']],
  'travel-agents': [['destinations', 'Destinations served'], ['groups', 'Group travel and guest support']],
  caterers: [['menus', 'Cuisines and wedding menus'], ['dietary', 'Dietary accommodations and service styles']],
  transportation: [['vehicles', 'Vehicles and capacity'], ['logistics', 'Routes and guest transport']],
  'clothing-fashion': [['attire', 'Wedding attire and styles'], ['fittings', 'Fittings, tailoring and alterations']],
}

const fallbackFields: readonly [string, string][] = [['services', 'Wedding services'], ['options', 'Options and accommodations']]

export function experienceFields(slug: string) {
  return Object.hasOwn(categoryExperienceFields, slug) ? categoryExperienceFields[slug] : fallbackFields
}

export type ExperienceCategory = { id: string; name: string; slug: string }
export type WeddingExperience = {
  cultures: string[]
  ceremonies: string[]
  notes: string
  category_details: Record<string, Record<string, string>>
}

export function experienceOptions(group: keyof typeof weddingExperienceOptions, values: readonly string[]) {
  return weddingExperienceOptions[group].filter(value => values.includes(value))
}

export function categoryExperienceEntries(
  category: ExperienceCategory,
  details: WeddingExperience['category_details'],
) {
  return experienceFields(category.slug).flatMap(([field, label]) => {
    const value = details[category.id]?.[field]
    return typeof value === 'string' && value.trim() ? [{ field, label, value: value.trim() }] : []
  })
}
