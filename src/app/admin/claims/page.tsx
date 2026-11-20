import Link from 'next/link'
import { ClipboardCheck, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ClaimReviewCard from '@/components/admin/ClaimReviewCard'

export const metadata = { title: 'Vendor Claim Reviews — Admin' }

export default async function AdminClaimsPage() {
  const supabase = await createClient()
  const { data: claims, error } = await supabase.from('vendor_claims')
    .select('id,vendor_id,requester_id,business_email,evidence_url,explanation,status,review_note,created_at,vendor:vendors(name,slug,city)')
    .order('created_at', { ascending: false }).limit(100)

  const ids = [...new Set((claims ?? []).map(c => c.requester_id))]
  const { data: requesters } = ids.length
    ? await supabase.from('profiles').select('id,full_name,email').in('id', ids)
    : { data: [] as { id: string; full_name: string | null; email: string }[] }
  const profiles = new Map((requesters ?? []).map(p => [p.id, p]))
  const pending = (claims ?? []).filter(c => c.status === 'pending')
  const reviewed = (claims ?? []).filter(c => c.status !== 'pending')
  const renderClaim = (claim: NonNullable<typeof claims>[number]) => {
    const vendor = claim.vendor as { name: string; slug: string; city: string } | null
    const requester = profiles.get(claim.requester_id)
    return <ClaimReviewCard key={claim.id} claim={{
      id: claim.id,
      vendorName: vendor?.name ?? 'Unknown business',
      vendorSlug: vendor?.slug ?? '',
      vendorCity: vendor?.city ?? '',
      requesterName: requester?.full_name ?? 'Unknown requester',
      requesterEmail: requester?.email ?? '',
      businessEmail: claim.business_email,
      evidenceUrl: claim.evidence_url,
      explanation: claim.explanation,
      createdAt: claim.created_at,
      status: claim.status,
      reviewNote: claim.review_note,
    }} />
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-ivory">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted hover:text-plum">
            <ChevronLeft className="h-4 w-4" /> Admin dashboard
          </Link>
          <h1 className="mt-4 flex items-center gap-2 font-[family-name:var(--font-heading)] text-3xl text-plum">
            <ClipboardCheck className="h-7 w-7 text-primary" /> Vendor Claim Reviews
          </h1>
          <p className="mt-2 text-muted">Verify vendor ownership before granting control of a listing.</p>
          {error ? (
            <p role="alert" className="mt-7 rounded-xl bg-red-50 p-5 text-red-700">Could not load claims. Please try again.</p>
          ) : (
            <>
              <h2 className="mb-4 mt-10 text-xl font-medium text-plum">Pending review ({pending.length})</h2>
              <div className="space-y-5">
                {pending.length ? pending.map(renderClaim) : (
                  <p className="rounded-xl bg-white border border-border-soft p-6 text-muted">No pending claims.</p>
                )}
              </div>
              <h2 className="mb-4 mt-12 text-xl font-medium text-plum">Other requests ({reviewed.length})</h2>
              <div className="space-y-5">
                {reviewed.length ? reviewed.map(renderClaim) : (
                  <p className="rounded-xl bg-white border border-border-soft p-6 text-muted">No other requests yet.</p>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
