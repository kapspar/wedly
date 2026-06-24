import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import VendorCard from '@/components/vendors/VendorCard'
import VendorSearch from '@/components/vendors/VendorSearch'
import VendorCategoryIcon from '@/components/vendors/VendorCategoryIcon'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Browse Vendors' }

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('vendor_categories')
    .select('*')
    .order('display_order')

  let vendorQuery = supabase
    .from('vendors')
    .select('*')
    .eq('is_published', true)
    .order('is_featured', { ascending: false })
    .order('priority')
    .order('name')

  if (params.q) {
    vendorQuery = vendorQuery.or(
      `name.ilike.%${params.q}%,description.ilike.%${params.q}%,city.ilike.%${params.q}%`
    )
  }
  if (params.city) {
    vendorQuery = vendorQuery.ilike('city', `%${params.city}%`)
  }

  const { data: vendors } = await vendorQuery.limit(100)

  const cities = [...new Set(vendors?.map((v) => v.city) ?? [])].sort()

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="bg-gradient-to-b from-peach-light/30 to-ivory py-10 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl text-charcoal text-center mb-3">
              Wedding Vendors
            </h1>
            <p className="text-center text-charcoal/60 mb-8 max-w-lg mx-auto">
              Discover trusted vendors for your Tamil wedding in the Greater Toronto Area
            </p>
            <div className="max-w-xl mx-auto">
              <VendorSearch basePath="/vendors" initialQuery={params.q} />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Category pills */}
          {categories && (
            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/vendors/${cat.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-peach-light bg-white text-sm text-charcoal/70 hover:border-rose-gold hover:text-rose-gold transition-colors"
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
                href="/vendors"
                className={cn(
                  'px-3 py-1 rounded-full text-xs transition-colors',
                  !params.city
                    ? 'bg-rose-gold text-white'
                    : 'bg-peach-light/50 text-charcoal/60 hover:bg-peach-light'
                )}
              >
                All Cities
              </Link>
              {cities.map((city) => (
                <Link
                  key={city}
                  href={`/vendors?city=${encodeURIComponent(city)}`}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs transition-colors',
                    params.city === city
                      ? 'bg-rose-gold text-white'
                      : 'bg-peach-light/50 text-charcoal/60 hover:bg-peach-light'
                  )}
                >
                  {city}
                </Link>
              ))}
            </div>
          )}

          {/* Results */}
          {vendors && vendors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-charcoal/50">
                No vendors found. Try adjusting your search or filters.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
