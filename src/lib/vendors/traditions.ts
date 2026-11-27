export const weddingTraditions = [
  ['tamil-hindu', 'Tamil Hindu'],
  ['tamil-catholic', 'Tamil Catholic'],
  ['tamil-christian', 'Tamil Christian (other denominations)'],
  ['tamil-muslim', 'Tamil Muslim'],
  ['punjabi-sikh', 'Punjabi Sikh'],
  ['gujarati-hindu', 'Gujarati Hindu'],
  ['bengali-hindu', 'Bengali Hindu'],
  ['south-asian-muslim', 'South Asian Muslim'],
  ['east-asian-tea-ceremony', 'East Asian tea ceremony'],
  ['filipino-catholic', 'Filipino Catholic'],
  ['caribbean-weddings', 'Caribbean weddings'],
  ['west-african-traditional', 'West African traditional'],
  ['jewish', 'Jewish'],
  ['interfaith', 'Interfaith'],
] as const

export function traditionFilter(value: unknown) {
  return weddingTraditions.find(([key]) => key === value)?.[0]
}

export function selectedTraditions(values: readonly string[]) {
  return weddingTraditions.filter(([key]) => values.includes(key))
}

export function directoryHref(path: string, filters: Record<string, unknown>) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (typeof value === 'string' && value) query.set(key, value)
  }
  return query.size ? `${path}?${query}` : path
}

export function directoryPattern(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return undefined
  return `%${value.trim().slice(0, 120).replace(/[\\%_]/g, '\\$&')}%`
}

export function directorySearch(value: unknown) {
  const pattern = directoryPattern(value)
  if (!pattern) return undefined
  const argument = JSON.stringify(pattern)
  return ['name', 'description', 'city'].map(field => `${field}.ilike.${argument}`).join(',')
}
