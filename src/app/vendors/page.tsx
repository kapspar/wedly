import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import VendorCard from '@/components/vendors/VendorCard'
import VendorSearch from '@/components/vendors/VendorSearch'
import VendorCategoryIcon from '@/components/vendors/VendorCategoryIcon'
import { cn } from '@/lib/utils'
import { vendorEntitlements } from '@/lib/vendors/entitlements'

export const metadata = { title: 'Browse Vendors' }

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; serves?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const [{ data: categories }, { data: allCities }, { data: regionVendors }] = await Promise.all([
    supabase.from('vendor_categories').select('*').order('display_order'),
    supabase
      .from('vendors')
      .select('city')
      .eq('is_published', true)
      .order('city'),
    supabase.from('vendors').select('service_areas').eq('is_published',true).eq('is_claimed',true),
  ])

  const cities = [...new Set((allCities ?? []).map((v) => v.city))].sort()
  const regions = [...new Set((regionVendors??[]).flatMap(v=>v.service_areas??[]))].sort((a,b)=>a.localeCompare(b))

  let vendorQuery = supabase
    .from('vendors')
    .select('*, vendor_categories!vendors_category_id_fkey(name), vendor_photos(storage_path,sort_order)')
    .eq('is_published', true)
    .order('is_featured', { ascending: false })
    .order('priority')
    .order('name')

  if (params.q) {
    const q = params.q.replace(/[%_]/g, '\\$&')
    vendorQuery = vendorQuery.or(
      `name.ilike.%${q}%,description.ilike.%${q}%,city.ilike.%${q}%`
    )
  }
  if (params.city) {
    vendorQuery = vendorQuery.ilike('city', `%${params.city}%`)
  }

  if (params.serves) vendorQuery = vendorQuery.contains('service_areas',[params.serves])

  const { data: queriedVendors, error: vendorError } = await vendorQuery
  // Keep listings discoverable if a nested photo/category relationship fails.
  // Never turn a database error into a misleading "0 vendors found" result.
  if (vendorError) {
    console.error('Vendor directory query failed:', vendorError.code, vendorError.message)
  }
  let vendors = queriedVendors
  if (vendorError) {
    let fallbackQuery = supabase.from('vendors').select('*')
      .eq('is_published', true)
      .order('is_featured', { ascending: false })
      .order('priority')
      .order('name')

    if (params.q) { const q = params.q.replace(/[%_]/g, '\\  const { data: vendors } = await vendorQuery'); fallbackQuery = fallbackQuery.or(`name.ilike.%${q}%,description.ilike.%${q}%,city.ilike.%${q}%`) }
    if (params.city) fallbackQuery = fallbackQuery.ilike('city', `%${params.city}%`)
    if (params.serves) fallbackQuery = fallbackQuery.contains('service_areas',[params.serves])
    const fallback = await fallbackQuery
    if (fallback.error) console.error('Vendor directory fallback failed:', fallback.error.code, fallback.error.message)
    vendors = fallback.data as typeof queriedVendors
  }

  const badgeMap = await vendorEntitlements((vendors ?? []).map(vendor => ({ id: vendor.id, claimed_by: vendor.claimed_by, is_claimed: vendor.is_claimed })))

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="bg-gradient-to-b from-primary-soft/60 to-ivory py-10 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl text-ink text-center mb-3">
              Wedding Vendors
            </h1>
            <p className="text-center text-muted mb-8 max-w-lg mx-auto">
              Discover trusted vendors for your Tamil wedding in the Greater Toronto Area
            </p>
            <div className="max-w-xl mx-auto">
              <VendorSearch basePath="/vendors" initialQuery={params.q} />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary-soft/30 px-5 py-4"><div><p className="font-semibold text-plum">Explore vendors on a map</p><p className="text-xs text-muted">Only published, claimed vendors appear as pins.</p></div><Link href="/vendors/map" className="rounded-xl bg-plum px-5 py-3 text-sm font-medium text-white">View claimed vendor map</Link></div>
          {/* Category pills */}
          {categories && (
            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/vendors/${cat.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border-soft bg-white text-sm text-muted hover:border-primary hover:text-plum transition-colors"
                >
                  <VendorCategoryIcon icon={cat.icon} className="h-3.5 w-3.5" />
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          {/* City filter */}
          {cities.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <Link
                href={params.q ? `/vendors?q=${encodeURIComponent(params.q)}` : '/vendors'}
                className={cn(
                  'px-3 py-1 rounded-full text-xs transition-colors',
                  !params.city
                    ? 'bg-primary text-white'
                    : 'bg-primary-soft/60 text-muted hover:bg-primary-soft'
                )}
              >
                All Cities
              </Link>
              {cities.map((city) => (
                <Link
                  key={city}
                  href={`/vendors?${params.q ? `q=${encodeURIComponent(params.q)}&` : ''}city=${encodeURIComponent(city)}`}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs transition-colors',
                    params.city === city
                      ? 'bg-primary text-white'
                      : 'bg-primary-soft/60 text-muted hover:bg-primary-soft'
                  )}
                >
                  {city}
                </Link>
              ))}
            </div>
          )}

          {regions.length>0 && <div className="mb-6"><p className="mb-2 text-xs font-semibold text-muted">Serves this area (claimed vendors)</p><div className="flex flex-wrap gap-2"><Link href={`/vendors?${new URLSearchParams(Object.entries({q:params.q||'',city:params.city||''}).filter(([,v])=>v))}`} className={`rounded-full px-3 py-1 text-xs ${!params.serves?'bg-primary text-white':'bg-primary-soft text-muted'}`}>All service areas</Link>{regions.map(region=><Link key={region} href={`/vendors?${new URLSearchParams(Object.entries({q:params.q||'',city:params.city||'',serves:region}).filter(([,v])=>v))}`} className={`rounded-full px-3 py-1 text-xs ${params.serves===region?'bg-primary text-white':'bg-primary-soft text-muted'}`}>{region}</Link>)}</div></div>}

          {/* Results */}
          <p className="text-sm text-muted mb-6">
            {vendors?.length ?? 0} vendor{(vendors?.length ?? 0) !== 1 ? 's' : ''} found
          </p>

          {vendors && vendors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor) => (
                <VendorCard key={vendor.id} vendor={{ ...vendor, ...badgeMap.get(vendor.id) }} imagePath={vendor.vendor_photos?.find(photo => photo.sort_order === 0)?.storage_path} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted">
                No vendors found. Try adjusting your search or filters.
              </p>
              {(params.q || params.city || params.serves) && (
                <Link
                  href="/vendors"
                  className="mt-4 inline-block text-sm text-primary hover:underline"
                >
                  Clear filters
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
