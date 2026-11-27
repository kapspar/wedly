export const leadStages = [
  ['new', 'New'], ['contacted', 'Contacted'], ['quoted', 'Quoted'], ['booked', 'Booked'], ['lost', 'Lost'],
] as const
export type LeadStage = typeof leadStages[number][0]
export const isLeadStage = (value: string): value is LeadStage => leadStages.some(([key]) => key === value)

export function inboxFilter(value: string | undefined, premium: boolean) {
  if (value === 'unread' || value === 'read') return value
  return value && premium && isLeadStage(value) ? value : 'all'
}

export function inboxPage(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return 1
  const page = Number(value)
  return Number.isSafeInteger(page) && page >= 1 && page <= 10000 ? page : 1
}

export function weddingDateLabel(value: string) {
  return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value + 'T00:00:00Z'))
}

export type InboxMetrics = {
  vendor_id: string
  total: number
  unread: number
  open_leads: number
  booked: number
  due: number
}

export function inboxMetricCards(metrics: InboxMetrics | undefined, premium: boolean) {
  const items = [['Inquiries', metrics?.total ?? 0], ['Unread', metrics?.unread ?? 0]] as const
  return premium ? [...items, ['Open leads', metrics?.open_leads ?? 0], ['Follow-ups due', metrics?.due ?? 0], ['Booked', metrics?.booked ?? 0]] as const : items
}
