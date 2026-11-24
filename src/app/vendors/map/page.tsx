import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ClaimedVendorMap from '@/components/vendors/ClaimedVendorMap'

export const metadata = { title: 'Wedding Vendor Map' }

export default async function VendorMapPage() {
  const supabase = await createClient()
  // Published venues are included even without a claim; other listings must be claimed.
  const { data, error } = await supabase.from('vendors')
    .select('id,name,slug,city,area,service_areas,is_claimed,claimed_by,vendor_categories!vendors_category_id_fkey(name,slug)')
    .eq('is_published', true)
    .order('name')
    .limit(1000)
  if (error) console.error('Claimed vendor map query failed:', error.code, error.message)
  const vendors = (data ?? [])
    .filter(v => v.city?.trim() && (
      v.vendor_categories?.slug === 'venues' ||
      (v.is_claimed && v.claimed_by !== null)
    ))
    .map(v => ({
    id: v.id,
    name: v.name,
    slug: v.slug,
    city: v.city,
    area: v.area,
    serviceAreas: v.service_areas ?? [],
    category: v.vendor_categories?.name ?? 'Wedding vendor',
    claimed: Boolean(v.is_claimed && v.claimed_by),
    isVenue: v.vendor_categories?.slug === 'venues',
  }))
  return <><Navbar/><main className="flex-1 bg-ivory">
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-7">
        <Link href="/vendors" className="text-sm font-medium text-primary hover:underline">← Back to all vendors</Link>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl sm:text-4xl text-plum">Explore wedding venues and claimed vendors</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">Browse published venues (including unclaimed listings) and claimed vendors. Pins show approximate base cities, not exact venue addresses. Venue locations must be verified before exact pins can be added.</p>
      </div>
      {error?<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">The map directory could not be loaded right now.</div>:<ClaimedVendorMap vendors={vendors} apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}/>}
    </div>
  </main><Footer/></>
}
