import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ClaimedVendorMap from '@/components/vendors/ClaimedVendorMap'

export const metadata = { title: 'Wedding Vendor Map' }

export default async function VendorMapPage() {
  const supabase = await createClient()
  // Only venues with verified street addresses and coordinates can be placed accurately; other categories must be claimed.
  const { data, error } = await supabase.from('vendors')
    .select('id,name,slug,city,area,street_address,latitude,longitude,service_areas,is_claimed,claimed_by,vendor_categories!vendors_category_id_fkey(name,slug)')
    .eq('is_published', true)
    .order('name')
    .limit(1000)
  if (error) console.error('Claimed vendor map query failed:', error.code, error.message)
  const vendors = (data ?? [])
    .filter(v => v.city?.trim() && (
      (v.vendor_categories?.slug === 'venues'
        ? Boolean(v.street_address?.trim())
        : (v.is_claimed && v.claimed_by !== null))
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
    streetAddress: v.street_address,
    latitude: v.latitude,
    longitude: v.longitude,
  }))
  return <><Navbar/><main className="flex-1 bg-ivory">
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-7">
        <Link href="/vendors" className="text-sm font-medium text-primary hover:underline">← Back to all vendors</Link>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl sm:text-4xl text-plum">Explore wedding venues and claimed vendors</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">Only venues with a researched street address are included, alongside claimed vendors. Google Maps locates venue addresses when you open the map; other vendor pins show approximate base cities.</p>
      </div>
      {error?<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">The map directory could not be loaded right now.</div>:<ClaimedVendorMap vendors={vendors} apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}/>}
    </div>
  </main><Footer/></>
}
