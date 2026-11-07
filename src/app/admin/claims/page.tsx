import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { reviewClaim } from './actions'

export const metadata = { title: 'Vendor Verification — Wedly Admin' }

type Claim = {
  id: string; business_email: string; explanation: string; evidence_url: string | null;
  status: string; created_at: string; review_note: string | null;
  vendor: { name: string; slug: string } | null;
}

export default async function ClaimsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('vendor_claims' as never)
    .select('id,business_email,explanation,evidence_url,status,created_at,review_note,vendor:vendors(name,slug)')
    .order('created_at', { ascending: false }).limit(100)
  const claims = (data ?? []) as unknown as Claim[]
  return <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
    <Link href="/admin" className="text-primary text-sm">← Admin dashboard</Link>
    <div>
      <h1 className="font-[family-name:var(--font-heading)] text-3xl text-ink">Vendor verification</h1>
      <p className="text-muted mt-2">Verify ownership evidence before approving a claim. Approval gives the requester control of the listing.</p>
    </div>
    {error && <p role="alert" className="text-red-700">Could not load claims: {error.message}. Check that the migration has been applied.</p>}
    {!error && claims.length === 0 && <p className="rounded-xl border p-6 text-muted">No claims submitted yet.</p>}
    {claims.map(claim => <section key={claim.id} className="rounded-2xl border border-border-soft bg-white p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-ink">{claim.vendor?.name ?? 'Unknown vendor'}</h2>
        <span className="text-sm text-muted capitalize">{claim.status.replace('_',' ')}</span>
      </div>
      <p className="text-sm text-muted">Applicant contact: {claim.business_email}</p>
      <p className="whitespace-pre-wrap text-sm text-ink">{claim.explanation}</p>
      {claim.evidence_url && <a href={claim.evidence_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">Review supporting link</a>}
      {claim.vendor && <p><Link href={`/vendor/${claim.vendor.slug}`} className="text-primary underline text-sm">View public listing</Link></p>}
      {claim.status === 'pending' ? <form action={reviewClaim} className="space-y-3 border-t pt-4">
        <input type="hidden" name="claim_id" value={claim.id} />
        <label className="block text-sm font-medium text-ink" htmlFor={`note-${claim.id}`}>Review notes (required for rejection or more information)</label>
        <textarea id={`note-${claim.id}`} name="note" rows={2} maxLength={2000} className="w-full rounded-lg border border-border-soft p-3 text-ink" placeholder="What was verified, or what information is missing?" />
        <div className="flex flex-wrap gap-2">
          <button name="decision" value="approved" className="rounded-lg bg-primary px-4 py-2 text-white">Approve ownership</button>
          <button name="decision" value="more_info" className="rounded-lg border px-4 py-2 text-ink">Request more information</button>
          <button name="decision" value="rejected" className="rounded-lg border px-4 py-2 text-ink">Reject</button>
        </div>
      </form> : claim.review_note && <p className="text-sm text-muted">Decision note: {claim.review_note}</p>}
    </section>)}
  </main>
}
