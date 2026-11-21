import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import BillingActions from '@/components/vendors/BillingActions'
import { billingAdmin } from '@/lib/billing/stripe'
import ListingBadges from '@/components/vendors/ListingBadges'

export const metadata = { title: 'Vendor Dashboard — PlanWedly' }

export default async function VendorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/vendor/dashboard')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'vendor') redirect('/dashboard')

  const [{ data: listings, error: listingError }, { data: claims }, { data: submissions }] = await Promise.all([
    supabase.from('vendors').select('id,slug,name,city,description,is_published,is_claimed')
      .eq('claimed_by', user.id).eq('is_claimed', true).order('name'),
    supabase.from('vendor_claims')
      .select('id,vendor_id,status,created_at,review_note,vendor:vendors(name,slug)')
      .eq('requester_id', user.id).order('created_at', { ascending: false }).limit(30),
    supabase.from('vendor_listing_requests').select('id,name,city,status,created_at,review_note,resulting_vendor_id')
      .eq('requester_id', user.id).order('created_at', { ascending: false }).limit(30),
  ])

  const billingEnabled = !!(process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') &&
    process.env.STRIPE_PRICE_MONTHLY?.startsWith('price_') &&
    process.env.STRIPE_PRICE_YEARLY?.startsWith('price_') &&
    process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_') &&
    process.env.SUPABASE_SERVICE_ROLE_KEY)
  const subscriptions = new Map<string, string>()
  if (billingEnabled && listings?.length) {
    const { data, error } = await billingAdmin().from('vendor_subscriptions')
      .select('vendor_id,status').eq('owner_id', user.id)
      .in('vendor_id', listings.map(vendor => vendor.id))
    if (error) console.error('Could not load billing status:', error.message)
    else for (const subscription of data ?? []) subscriptions.set(subscription.vendor_id, subscription.status)
  }

  const pendingClaims = (claims ?? []).filter(c => c.status === 'pending' || c.status === 'more_info')
  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] bg-ivory px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">PlanWedly for business</p>
          <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl sm:text-4xl text-plum">Your vendor dashboard</h1>
          <p className="mt-3 text-muted">Manage your verified business listing and keep track of ownership requests.</p>

          <div className="mt-9 flex items-center justify-between gap-4">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl text-plum">My listings</h2>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/vendors" className="text-sm font-medium text-primary hover:underline">Browse vendors</Link>
              <Link href="/vendor/new" className="rounded-xl bg-plum px-4 py-2.5 text-sm font-medium text-white hover:opacity-90">Add my business</Link>
            </div>
          </div>
          {listingError ? (
            <p role="alert" className="mt-4 rounded-xl bg-white border border-border-soft p-5 text-red-700">Could not load your listings.</p>
          ) : !listings?.length ? (
            <div className="mt-4 rounded-2xl border border-border-soft bg-white p-7">
              <p className="font-medium text-ink">No approved listings yet</p>
              <p className="mt-2 text-sm text-muted">Find your business in the directory and select Claim This Business to request access.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/vendors" className="rounded-xl border border-border-soft px-5 py-3 text-sm font-semibold text-plum">Find my business</Link>
                <Link href="/vendor/new" className="rounded-xl bg-plum px-5 py-3 text-sm font-semibold text-white">My business is not listed</Link>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {listings.map(vendor => (
                <div key={vendor.id} className="rounded-2xl border border-border-soft bg-white p-6 shadow-sm">
                  <ListingBadges verified={vendor.is_claimed} premiumPreview={subscriptions.get(vendor.id) === 'active'} />
                  <h3 className="mt-2 font-[family-name:var(--font-heading)] text-xl text-plum">{vendor.name}</h3>
                  <p className="mt-1 text-sm text-muted">{vendor.city} · {vendor.is_published ? 'Published' : 'Unpublished'}</p>
                  <p className="mt-3 text-sm text-muted line-clamp-2">{vendor.description || 'Add a description to introduce your business.'}</p>
                  <BillingActions vendorId={vendor.id} status={subscriptions.get(vendor.id) ?? null} enabled={billingEnabled} />
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href={`/vendor/dashboard/${vendor.id}`} className="rounded-xl bg-plum px-4 py-2.5 text-sm font-medium text-white">Manage listing</Link>
                    <Link href={`/vendor/dashboard/${vendor.id}/reviews`} className="rounded-xl border border-border-soft px-4 py-2.5 text-sm font-medium text-plum">Customer reviews</Link>
                    <Link href={`/vendor/dashboard/${vendor.id}/inquiries`} className="rounded-xl border border-border-soft px-4 py-2.5 text-sm font-medium text-plum">Wedding inquiries</Link>
                    {vendor.is_published && <Link href={`/vendor/${vendor.slug}`} className="rounded-xl border border-border-soft px-4 py-2.5 text-sm font-medium text-plum">View public page</Link>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="mt-12 font-[family-name:var(--font-heading)] text-2xl text-plum">Ownership requests</h2>
          {pendingClaims.length ? (
            <div className="mt-4 space-y-3">
              {pendingClaims.map(claim => {
                const vendor = claim.vendor as { name: string; slug: string } | null
                return (
                  <div key={claim.id} className="rounded-xl border border-border-soft bg-white p-5">
                    <p className="font-medium text-ink">{vendor?.name || 'Your claim'}</p>
                    <p className="mt-1 text-sm text-muted">Status: {claim.status === 'more_info' ? 'More information requested' : 'Pending verification'}</p>
                    {claim.review_note && <p className="mt-2 text-sm text-muted">Reviewer note: {claim.review_note}</p>}
                  </div>
                )
              })}
            </div>
          ) : <p className="mt-3 text-sm text-muted">No pending ownership requests.</p>}
          <h2 className="mt-12 font-[family-name:var(--font-heading)] text-2xl text-plum">New business submissions</h2>
          {(submissions ?? []).length ? (
            <div className="mt-4 space-y-3">
              {submissions!.map(item => (
                <div key={item.id} className="rounded-xl border border-border-soft bg-white p-5">
                  <p className="font-medium text-ink">{item.name} · {item.city}</p>
                  <p className="mt-1 text-sm text-muted">Status: {item.status === 'pending' ? 'Awaiting admin review' : item.status === 'approved' ? 'Approved' : 'Rejected'}</p>
                  {item.review_note && <p className="mt-2 text-sm text-muted">Admin note: {item.review_note}</p>}
                  {item.status === 'approved' && item.resulting_vendor_id && (
                    <Link href={`/vendor/dashboard/${item.resulting_vendor_id}`} className="mt-2 inline-block text-sm text-primary underline">Manage approved listing</Link>
                  )}
                </div>
              ))}
            </div>
          ) : <p className="mt-3 text-sm text-muted">No new business submissions.</p>}
          <p className="mt-10 text-xs text-muted">The free plan includes a directory cover, business logo, and profile banner. Premium billing is in test mode. Premium Preview badges reflect testing only; live paid benefits are not yet available.</p>
        </div>
      </main>
      <Footer />
    </>
  )
}
