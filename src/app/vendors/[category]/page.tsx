import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import VendorCard from '@/components/vendors/VendorCard'
import VendorSearch from '@/components/vendors/VendorSearch'
import VendorCategoryIcon from '@/components/vendors/VendorCategoryIcon'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ category: string }>
  searchParams: Promise<{ q?: string; city?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const supabase = await createClient()
  const { data: cat } = await supabase
    .from('vendor_categories')
    .select('name')
    .eq('slug', category)
    .single()
  return { title: cat ? `${cat.name} — Wedding Vendors` : 'Vendors' }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await params
  const sp = await searchParams
  const supabase = await createClient()

  const { data: cat } = await supabase
    .from('vendor_categories')
    .select('*')
    .eq('slug', category)
    .single()

  if (!cat) notFound()

  let vendorQuery = supabase
    .from('vendors')
    .select('*')
    .eq('category_id', cat.id)
    .eq('is_published', true)
    .order('is_featured', { ascending: false })
    .order('priority')
    .order('name')

  if (sp.q) {
    vendorQuery = vendorQuery.or(
      `name.ilike.%${sp.q}%,description.ilike.%${sp.q}%,city.ilike.%${sp.q}%`
    )
  }
  if (sp.city) {
    vendorQuery = vendorQuery.ilike('city', `%${sp.city}%`)
  }

  const { data: vendors } = await vendorQuery

  const cities = [...new Set(vendors?.map((v) => v.city) ?? [])].sort()

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="bg-gradient-to-b from-peach-light/30 to-ivory py-10 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/vendors"
              className="inline-flex items-center gap-1 text-sm text-charcoal/50 hover:text-charcoal mb-4"
            >
              <ChevronLeft className="h-4 w-4" />
              All Vendors
            </Link>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                <VendorCategoryIcon icon={cat.icon} className="h-5 w-5 text-rose-gold" />
              </div>
              <h1 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl text-charcoal">
                {cat.name}
              </h1>
            </div>
            {cat.description && (
              <p className="text-charcoal/60 mb-6 max-w-lg">{cat.description}</p>
            )}
            <div className="max-w-xl">
              <VendorSearch basePath={`/vendors/${category}`} initialQuery={sp.q} />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* City filter */}
          {cities.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <Link
                href={`/vendors/${category}`}
                className={cn(
                  'px-3 py-1 rounded-full text-xs transition-colors',
                  !sp.city
                    ? 'bg-rose-gold text-white'
                    : 'bg-peach-light/50 text-charcoal/60 hover:bg-peach-light'
                )}
              >
                All Cities
              </Link>
              {cities.map((city) => (
                <Link
                  key={city}
                  href={`/vendors/${category}?city=${encodeURIComponent(city)}`}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs transition-colors',
                    sp.city === city
                      ? 'bg-rose-gold text-white'
                      : 'bg-peach-light/50 text-charcoal/60 hover:bg-peach-light'
                  )}
                >
                  {city}
                </Link>
              ))}
            </div>
          )}

          <p className="text-sm text-charcoal/50 mb-6">
            {vendors?.length ?? 0} vendor{(vendors?.length ?? 0) !== 1 ? 's' : ''} found
          </p>

          {vendors && vendors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} categorySlug={category} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-charcoal/50">No vendors found in this category.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
