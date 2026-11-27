import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { billingAdmin } from '@/lib/billing/stripe'
import { vendorEntitlements } from '@/lib/vendors/entitlements'
import { inboxFilter, inboxMetricCards, inboxPage, leadStages, weddingDateLabel, type InboxMetrics, type LeadStage } from '@/lib/vendors/inbox'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import LeadTracker, { type LeadState } from '@/components/vendors/LeadTracker'
import InquiryReadToggle from '@/components/vendors/InquiryReadToggle'

export const metadata = { title: 'Wedding Inquiry Inbox — PlanWedly' }
const pageSize = 25
const budget = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })
const receivedDate = new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium', timeZone: 'America/Toronto' })
const baseFilters = [['all', 'All'], ['unread', 'Unread'], ['read', 'Read']] as const
type Entry = {
  id: string
  couple_id: string
  message: string
  event_date: string | null
  event_location: string | null
  guest_count: number | null
  budget_cad: number | null
  created_at: string
  unread: boolean
}

export default async function VendorLeadInbox({ params, searchParams }: {
  params: Promise<{ vendorId: string }>
  searchParams: Promise<{ filter?: string; page?: string }>
}) {
  const { vendorId } = await params
  const path = `/vendor/dashboard/${vendorId}/inquiries`
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?redirect=${encodeURIComponent(path)}`)
  const { data: vendor } = await supabase.from('vendors')
    .select('id,name,claimed_by,is_claimed').eq('id', vendorId).eq('claimed_by', user.id).eq('is_claimed', true).maybeSingle()
  if (!vendor) notFound()

  const premium = (await vendorEntitlements([vendor])).get(vendor.id)?.premiumPreview ?? false
  const search = await searchParams
  const filter = inboxFilter(search.filter, premium)
  const page = inboxPage(search.page)
  const admin = billingAdmin()
  let query = admin.from('vendor_inbox_entries')
    .select('id,couple_id,message,event_date,event_location,guest_count,budget_cad,created_at,unread', { count: 'exact' })
    .eq('vendor_id', vendor.id).eq('owner_id', user.id)
  if (filter === 'unread' || filter === 'read') query = query.eq('unread', filter === 'unread')
  else if (filter !== 'all') query = query.eq('stage', filter)
  const [inbox, metrics] = await Promise.all([
    query.order('created_at', { ascending: false }).order('id', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1),
    admin.rpc('vendor_inbox_metrics', { p_owner: user.id, p_vendors: [vendor.id] }),
  ])
  const entries = (inbox.data ?? []) as Entry[]
  const maxPage = Math.max(1, Math.ceil((inbox.count ?? 0) / pageSize))
  if (inbox.error?.code === 'PGRST103' && page > 1) redirect(`${path}?filter=${filter}`)
  if (!inbox.error && page > maxPage) redirect(`${path}?filter=${filter}&page=${maxPage}`)
  const coupleIds = [...new Set(entries.map(entry => entry.couple_id))]
  const inquiryIds = entries.map(entry => entry.id)
  const [contacts, leads] = await Promise.all([
    coupleIds.length ? admin.from('profiles').select('id,full_name,email').in('id', coupleIds) : { data: [], error: null },
    premium && inquiryIds.length
      ? admin.from('vendor_lead_pipeline').select('inquiry_id,stage,notes,follow_up_date')
        .eq('vendor_id', vendor.id).eq('owner_id', user.id).in('inquiry_id', inquiryIds)
      : { data: [], error: null },
  ])
  const people = new Map((contacts.data ?? []).map(person => [person.id, person]))
  const leadState = new Map((leads.data ?? []).map(lead => [lead.inquiry_id, lead as LeadState]))
  const stageLabels = new Map<LeadStage, string>(leadStages)
  const summary = inboxMetricCards((metrics.data as InboxMetrics[] | null)?.[0], premium)
  const filters = premium ? [...baseFilters, ...leadStages] : baseFilters
  const href = (selected: string, offset = 1) => `${path}?filter=${selected}&page=${offset}`

  return <><Navbar /><main className="min-h-[70vh] bg-ivory px-4 py-6 sm:py-10"><div className="mx-auto max-w-4xl [overflow-wrap:anywhere]">
    <Link href="/vendor/dashboard" className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline">← Vendor dashboard</Link>
    <h1 className="font-[family-name:var(--font-heading)] text-3xl text-plum">Inquiry inbox</h1>
    <p className="mt-1 text-sm text-muted">{vendor.name}</p>

    <section aria-label="Inquiry metrics" className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
      {summary.map(([label, value]) => <div key={label} className="rounded-xl border border-border-soft bg-white p-3">
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-1 text-lg font-semibold text-plum">{metrics.error ? '—' : value}</p>
      </div>)}
    </section>
    <nav aria-label="Filter inquiries" className="mt-5 flex flex-wrap gap-2">
      {filters.map(([key, label]) => <Link key={key} href={href(key)} aria-current={filter === key ? 'page' : undefined}
        className={`inline-flex min-h-11 items-center rounded-xl border border-border-soft px-3 text-sm font-medium ${filter === key ? 'bg-plum text-white' : 'bg-white text-plum'}`}>
        {label}
      </Link>)}
    </nav>
    {!premium && <p className="mt-4 text-sm text-muted">Premium Preview adds lead stages, private notes, and follow-up dates.</p>}
    {(contacts.error || leads.error || metrics.error) && <p role="alert" className="mt-4 text-sm text-red-700">Some inbox information is unavailable. Refresh to try again.</p>}
    {inbox.error ? <p role="alert" className="mt-5 text-sm text-red-700">Could not load inquiries.</p> : <div className="mt-5 space-y-3">
      {entries.map(item => {
        const person = people.get(item.couple_id)
        const lead = leadState.get(item.id)
        return <details key={item.id} className="rounded-2xl border border-border-soft bg-white">
          <summary className="cursor-pointer rounded-2xl px-4 py-4 text-plum sm:px-5">
            <span className="ml-1 font-semibold">{person?.full_name || 'Couple inquiry'}</span>
            <span className="ml-2 inline-flex flex-wrap items-center gap-2 align-middle text-xs">
              {item.unread && <span className="rounded-full bg-primary-soft px-2 py-1 font-semibold text-plum">Unread</span>}
              {premium && !leads.error && <span className="rounded-full bg-ivory px-2 py-1 font-medium text-plum">{stageLabels.get((lead?.stage ?? 'new') as LeadStage)}</span>}
              <time dateTime={item.created_at} className="text-muted">{receivedDate.format(new Date(item.created_at))}</time>
            </span>
            <span className="mt-2 block break-words text-sm text-muted">{item.message.length > 125 ? item.message.slice(0, 125) + '…' : item.message}</span>
          </summary>
          <div className="space-y-4 border-t border-border-soft p-4 sm:p-5">
            <p className="whitespace-pre-line text-sm leading-6 text-ink">{item.message}</p>
            <dl className="grid gap-2 rounded-xl bg-ivory p-3 text-sm sm:grid-cols-2">
              <div><dt className="font-medium text-plum">Wedding date</dt><dd className="text-muted">{item.event_date ? weddingDateLabel(item.event_date) : 'Not provided'}</dd></div>
              <div><dt className="font-medium text-plum">Wedding location</dt><dd className="text-muted">{item.event_location || 'Not provided'}</dd></div>
              <div><dt className="font-medium text-plum">Guest count</dt><dd className="text-muted">{item.guest_count ?? 'Not provided'}</dd></div>
              <div><dt className="font-medium text-plum">Estimated service budget</dt><dd className="text-muted">{item.budget_cad ? budget.format(item.budget_cad) : 'Not provided'}</dd></div>
            </dl>
            {person?.email && <div>
              <p className="text-sm text-muted">{person.email}</p>
              <a href={`mailto:${encodeURIComponent(person.email)}`} className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline">Reply by email</a>
            </div>}
            <InquiryReadToggle vendorId={vendor.id} inquiryId={item.id} unread={item.unread} />
            {premium && !leads.error && <LeadTracker vendorId={vendor.id} inquiryId={item.id} initial={lead} />}
          </div>
        </details>
      })}
      {entries.length === 0 && <p className="rounded-xl bg-white p-5 text-sm text-muted">{filter === 'all' ? 'No inquiries received yet.' : 'No inquiries match this filter.'}</p>}
    </div>}
    {!inbox.error && maxPage > 1 && <nav aria-label="Inquiry pages" className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted">
      {page > 1 && <Link className="inline-flex min-h-11 items-center text-primary underline" href={href(filter, page - 1)}>Previous page</Link>}
      <span>Page {page} of {maxPage}</span>
      {page < maxPage && <Link className="inline-flex min-h-11 items-center text-primary underline" href={href(filter, page + 1)}>Next page</Link>}
    </nav>}
  </div></main><Footer /></>
}
