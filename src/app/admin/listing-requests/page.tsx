import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ListingRequestReviewCard from '@/components/admin/ListingRequestReviewCard'

export const metadata = { title: 'New Business Reviews — PlanWedly Admin' }

export default async function AdminNewListingRequestsPage() {
  const supabase = await createClient()
  const { data: requests, error } = await supabase.from('vendor_listing_requests')
    .select('id,requester_id,name,city,business_email,phone,website_url,instagram_url,tiktok_url,facebook_url,youtube_url,pinterest_url,snapchat_url,linkedin_url,whatsapp_url,description,status,review_note,resulting_vendor_id,created_at,category:vendor_categories(name)')
    .order('created_at', { ascending: false }).limit(100)
  const ids = [...new Set((requests ?? []).map(r => r.requester_id))]
  const { data: requesters } = ids.length
    ? await supabase.from('profiles').select('id,email').in('id', ids)
    : { data: [] as { id: string; email: string }[] }
  const emails = new Map((requesters ?? []).map(p => [p.id, p.email]))

  const render = (r: NonNullable<typeof requests>[number]) => {
    const category = r.category as { name: string } | null
    return <ListingRequestReviewCard key={r.id} request={{
      id: r.id,
      name: r.name,
      city: r.city,
      category: category?.name ?? 'Uncategorized',
      requesterEmail: emails.get(r.requester_id) ?? 'Unknown',
      businessEmail: r.business_email,
      phone: r.phone,
      websiteUrl: r.website_url,
      instagramUrl: r.instagram_url,
      tiktokUrl: r.tiktok_url,
      facebookUrl: r.facebook_url,
      youtubeUrl: r.youtube_url,
      pinterestUrl: r.pinterest_url,
      snapchatUrl: r.snapchat_url,
      linkedinUrl: r.linkedin_url,
      whatsappUrl: r.whatsapp_url,
      description: r.description,
      status: r.status,
      reviewNote: r.review_note,
      resultingVendorId: r.resulting_vendor_id,
      createdAt: r.created_at,
    }} />
  }
  const pending = (requests ?? []).filter(r => r.status === 'pending')
  const past = (requests ?? []).filter(r => r.status !== 'pending')

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] bg-ivory px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <Link href="/admin" className="text-sm font-medium text-primary hover:underline">Back to admin dashboard</Link>
          <h1 className="mt-5 font-[family-name:var(--font-heading)] text-3xl text-plum">New business reviews</h1>
          <p className="mt-3 text-muted">Verify business identity and prevent duplicates before publishing vendor-submitted listings.</p>
          {error ? <p role="alert" className="mt-6 rounded-xl bg-red-50 p-5 text-red-700">Could not load submissions.</p> : (
            <>
              <h2 className="mb-4 mt-10 text-xl font-semibold text-plum">Pending ({pending.length})</h2>
              <div className="space-y-4">{pending.length ? pending.map(render) : <p className="rounded-xl bg-white p-6 text-muted">No pending submissions.</p>}</div>
              <h2 className="mb-4 mt-12 text-xl font-semibold text-plum">Reviewed ({past.length})</h2>
              <div className="space-y-4">{past.length ? past.map(render) : <p className="rounded-xl bg-white p-6 text-muted">No reviewed submissions yet.</p>}</div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
