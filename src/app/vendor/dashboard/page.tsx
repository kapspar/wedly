import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata = { title: 'Vendor Dashboard — PlanWedly' }

export default async function VendorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/vendor/dashboard')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'vendor') redirect('/dashboard')

  const [{ data: listings, error: listingError }, { data: claims }] = await Promise.all([
    supabase.from('vendors').select('id,slug,name,city,description,is_published,is_claimed')
      .eq('claimed_by', user.id).eq('is_claimed', true).order('name'),
    supabase.from('vendor_claims')
      .select('id,vendor_id,status,created_at,review_note,vendor:vendors(name,slug)')
      .eq('requester_id', user.id).order('created_at', { ascending: false }).limit(30),
  ])

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
            <Link href="/vendors" className="text-sm font-medium text-primary hover:underline">Browse vendors</Link>
          </div>
          {listingError ? (
            <p role="alert" className="mt-4 rounded-xl bg-white border border-border-soft p-5 text-red-700">Could not load your listings.</p>
          ) : !listings?.length ? (
            <div className="mt-4 rounded-2xl border border-border-soft bg-white p-7">
              <p className="font-medium text-ink">No approved listings yet</p>
              <p className="mt-2 text-sm text-muted">Find your business in the directory and select Claim This Business to request access.</p>
              <Link href="/vendors" className="mt-4 inline-block rounded-xl bg-plum px-5 py-3 text-sm font-semibold text-white">Find my business</Link>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {listings.map(vendor => (
                <div key={vendor.id} className="rounded-2xl border border-border-soft bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Verified business</p>
                  <h3 className="mt-2 font-[family-name:var(--font-heading)] text-xl text-plum">{vendor.name}</h3>
                  <p className="mt-1 text-sm text-muted">{vendor.city} · {vendor.is_published ? 'Published' : 'Unpublished'}</p>
                  <p className="mt-3 text-sm text-muted line-clamp-2">{vendor.description || 'Add a description to introduce your business.'}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href={`/vendor/dashboard/${vendor.id}`} className="rounded-xl bg-plum px-4 py-2.5 text-sm font-medium text-white">Manage listing</Link>
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
          <p className="mt-10 text-xs text-muted">The free plan currently includes one listing photo. Additional customization and featured placements will be offered separately.</p>
        </div>
      </main>
      <Footer />
    </>
  )
}
