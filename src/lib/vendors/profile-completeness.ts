import { httpsLink } from './portfolio'

export function profileCompleteness({
  description, serviceAreas, contact, social, hasCover, hasExperience,
}: {
  description: string | null
  serviceAreas: string[]
  contact: { email: string | null; phone: string | null; website: string | null }
  social: (string | null)[]
  hasCover: boolean
  hasExperience: boolean
}) {
  const checks = [
    { done: !!description?.trim(), label: 'Describe your business', section: 'description' },
    { done: serviceAreas.some(area => !!area.trim()), label: 'List the cities or regions you serve', section: 'service-areas' },
    { done: !!(contact.email?.trim() || contact.phone?.trim() || httpsLink(contact.website)), label: 'Add a contact method', section: 'business-info' },
    { done: social.some(link => !!httpsLink(link)), label: 'Add a social profile', section: 'social-links' },
    { done: hasCover, label: 'Upload a directory cover', section: 'listing-images' },
    { done: hasExperience, label: 'Add your wedding experience', section: 'experience' },
  ]
  const suggestions = checks.filter(check => !check.done)
  return { completed: checks.length - suggestions.length, total: checks.length, suggestions }
}
