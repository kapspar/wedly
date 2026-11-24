import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ClaimedVendorMap from '@/components/vendors/ClaimedVendorMap'

export const metadata = { title: 'Claimed Vendor Map' }

export default async function VendorMapPage() {
  const supabase = await createClient()
  // A map pin must never be shown for unclaimed or unpublished directory entries.
  const { data, error } = await supabase.from('vendors')
    .select('id,name,slug,city,area,service_areas,vendor_categories(name)')
    .eq('is_published', true)
    .eq('is_claimed', true)
    .not('claimed_by', 'is', null)
    .order('name')
    .limit(500)
  if (error) console.error('Claimed vendor map query failed:', error.code, error.message)
  const vendors = (data ?? []).filter(v => v.city.trim()).map(v => ({
    id: v.id,
    name: v.name,
    slug: v.slug,
    city: v.city,
    area: v.area,
    serviceAreas: v.service_areas ?? [],
    category: v.vendor_categories?.name ?? 'Wedding vendor',
  }))
  return <><Navbar/><main className="flex-1 bg-ivory">
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-7">
        <Link href="/vendors" className="text-sm font-medium text-primary hover:underline">← Back to all vendors</Link>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl sm:text-4xl text-plum">Explore claimed wedding vendors</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">Find verified claimed listings on a map. Pins identify the vendor's base city, not an exact shop or home address. Use service-area filtering to find vendors who travel to you.</p>
      </div>
      {error?<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">The map directory could not be loaded right now.</div>:<ClaimedVendorMap vendors={vendors} apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}/>}
    </div>
  </main><Footer/></>
}
