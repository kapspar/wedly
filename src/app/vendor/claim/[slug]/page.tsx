import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ClaimRequestForm from '@/components/vendors/ClaimRequestForm'

export default async function ClaimListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: vendor } = await supabase.from('vendors')
    .select('id,name,slug,is_claimed,claimed_by')
    .eq('slug', slug).eq('is_published', true).maybeSingle()
  if (!vendor) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?redirect=${encodeURIComponent(`/vendor/claim/${slug}`)}`)

  const { data: profile } = await supabase.from('profiles')
    .select('role').eq('id', user.id).maybeSingle()
  const { data: previous } = await supabase.from('vendor_claims')
    .select('status,created_at').eq('vendor_id', vendor.id)
    .eq('requester_id', user.id).in('status', ['pending', 'more_info'])
    .order('created_at', { ascending: false }).limit(1).maybeSingle()

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-ivory px-4 py-14">
        <div className="mx-auto max-w-xl">
          <Link href={`/vendor/${vendor.slug}`} className="text-sm font-medium text-primary hover:underline">Back to listing</Link>
          <h1 className="mt-6 font-[family-name:var(--font-heading)] text-3xl text-plum">
            Claim {vendor.name}
          </h1>
          <p className="mt-3 mb-7 text-muted">Request to manage this business listing on PlanWedly.</p>
          {vendor.is_claimed || vendor.claimed_by ? (
            <p className="rounded-xl bg-white border border-border-soft p-6 text-ink">
              This listing has already been claimed. Contact PlanWedly if you believe there is a mistake.
            </p>
          ) : profile?.role !== 'vendor' ? (
            <div className="rounded-xl bg-white border border-border-soft p-6 space-y-3">
              <p className="text-ink">Business claims require a vendor account. Your current account is not registered as a vendor.</p>
              <p className="text-sm text-muted">If you use PlanWedly to plan a wedding, keep that account and register your business with a separate email address.</p>
              <Link href="/auth/signup/vendor" className="inline-block text-primary font-medium underline">Create a vendor account</Link>
            </div>
          ) : previous ? (
            <div className="rounded-xl bg-white border border-border-soft p-6">
              <h2 className="text-xl font-medium text-plum">You already submitted a request</h2>
              <p className="mt-3 text-muted">Status: {previous.status === 'more_info' ? 'More information requested' : 'Pending review'}. We haven't transferred ownership.</p>
            </div>
          ) : (
            <ClaimRequestForm vendorId={vendor.id} vendorSlug={vendor.slug} requesterId={user.id} />
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
