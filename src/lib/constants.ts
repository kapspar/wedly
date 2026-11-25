export const SITE_NAME = 'PlanWedly'
export const SITE_TAGLINE = 'Love. Plan. Celebrate.'
export const SITE_DESCRIPTION =
  'PlanWedly helps couples plan meaningful weddings with confidence by connecting them with trusted vendors, personalized planning tools, and cultural traditions that matter.'
export const SITE_URL = 'https://planwedly.com'

export const WEDDING_TYPES = [
  { value: 'hindu' as const, label: 'Hindu' },
  { value: 'christian_catholic' as const, label: 'Christian / Catholic' },
  { value: 'interfaith' as const, label: 'Interfaith' },
]

export const EVENT_TYPES = [
  { value: 'engagement' as const, label: 'Engagement' },
  { value: 'temple_ceremony' as const, label: 'Temple Ceremony' },
  { value: 'church_ceremony' as const, label: 'Church Ceremony' },
  { value: 'reception' as const, label: 'Reception' },
  { value: 'home_ceremony' as const, label: 'Home Ceremony' },
  { value: 'sangeet' as const, label: 'Sangeet' },
  { value: 'mehndi' as const, label: 'Mehndi' },
  { value: 'other' as const, label: 'Other' },
]

export const HINDU_DEFAULT_EVENTS = ['engagement', 'temple_ceremony', 'reception', 'home_ceremony']
export const CHRISTIAN_DEFAULT_EVENTS = ['engagement', 'church_ceremony', 'reception']
export const INTERFAITH_DEFAULT_EVENTS = ['engagement', 'reception']

export const BUDGET_CATEGORIES = [
  { key: 'venue', label: 'Venue', default: 15000 },
  { key: 'photography', label: 'Photography', default: 3000 },
  { key: 'videography', label: 'Videography', default: 3000 },
  { key: 'decor', label: 'Decor', default: 5000 },
  { key: 'catering', label: 'Catering', default: 10000 },
  { key: 'dj', label: 'DJ / Entertainment', default: 1500 },
  { key: 'florist', label: 'Florist', default: 2000 },
  { key: 'priest', label: 'Priest', default: 500 },
  { key: 'makeup', label: 'Makeup & Hair', default: 1500 },
  { key: 'transportation', label: 'Transportation', default: 1000 },
  { key: 'jewellery', label: 'Jewellery', default: 5000 },
  { key: 'attire', label: 'Wedding Attire', default: 3000 },
  { key: 'invitations', label: 'Invitations', default: 500 },
  { key: 'honeymoon', label: 'Honeymoon', default: 5000 },
]

export const VENDOR_CATEGORY_ICONS: Record<string, string> = {
  venues: 'Building2',
  photographers: 'Camera',
  videographers: 'Video',
  decorators: 'Palette',
  djs: 'Music',
  priests: 'Flame',
  'makeup-artists': 'Sparkles',
  florists: 'Flower2',
  jewelers: 'Gem',
  'travel-agents': 'Plane',
  caterers: 'UtensilsCrossed',
  transportation: 'Car',
}

export const COLORS = {
  peach: '#F6B8A8',
  ivory: '#FFF8F3',
  roseGold: '#D89A8A',
  charcoal: '#2F2F2F',
  sage: '#A8C3A0',
}


/** Starter tasks for a new couple. These are suggestions, not religious requirements. */
export const SHARED_STARTER_TASKS = [
  'Decide which wedding events you want to host',
  'Agree on your budget and priorities',
  'Create an initial guest list',
  'Shortlist venues that fit your guest count',
  'Discuss your wedding plans with both families',
  'Compare photographers and videographers',
  'Record deposits and important payment dates',
] as const

export const HINDU_STARTER_TASKS = [
  'Discuss ceremony traditions and preferred rituals with your families',
  'Contact a priest about ceremony requirements and availability',
  'Plan attire and jewellery for each chosen event',
] as const

export const CHRISTIAN_STARTER_TASKS = [
  'Confirm church or ceremony location and booking requirements',
  'Discuss ceremony preparation and documents with your officiant',
  'Plan readings, music and ceremony participants',
] as const

export const INTERFAITH_STARTER_TASKS = [
  'Discuss which family traditions you want to include',
  'Confirm ceremony and officiant requirements for each tradition',
  'Coordinate the sequence of ceremonies and celebrations',
] as const

export function starterTasksForWedding(type: 'hindu' | 'christian_catholic' | 'interfaith') {
  const tailored = type === 'hindu' ? HINDU_STARTER_TASKS : type === 'christian_catholic' ? CHRISTIAN_STARTER_TASKS : INTERFAITH_STARTER_TASKS
  return [...SHARED_STARTER_TASKS, ...tailored]
}
