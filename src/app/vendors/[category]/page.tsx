import VendorTraditionFilter from '@/components/vendors/VendorTraditionFilter'
import { directoryHref, directoryPattern, directorySearch, traditionFilter } from '@/lib/vendors/traditions'
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
import { vendorEntitlements } from '@/lib/vendors/entitlements'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ category: string }>
  searchParams: Promise<{ q?: string; city?: string; service?: string; tradition?: string }>
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

  const {data:memberships}=await supabase.from('vendor_category_memberships').select('vendor_id').eq('category_id',cat.id)
  const memberIds=(memberships??[]).map(m=>m.vendor_id)
  const {data:services}=await supabase.from('vendor_services').select('id,name,slug').eq('category_id',cat.id).order('display_order')
  let serviceIds:string[]|null=null
  if(sp.service){
    const service=services?.find(s=>s.slug===sp.service)
    if(service){
      const {data:matches}=await supabase.from('vendor_service_memberships').select('vendor_id').eq('service_id',service.id)
      serviceIds=(matches??[]).map(m=>m.vendor_id)
    }else serviceIds=[]
  }
  const matchingIds=serviceIds===null?memberIds:memberIds.filter(id=>serviceIds.includes(id))
  const tradition = traditionFilter(sp.tradition)
  const q = directorySearch(sp.q)
  const cityPattern = directoryPattern(sp.city)
  const source = () => tradition
    ? supabase.rpc('vendors_with_tradition', { p_tradition: tradition })
    : supabase.from('vendors')
  let vendorQuery = source()
    .select('*, vendor_categories!vendors_category_id_fkey(name), vendor_photos(storage_path,sort_order)')
    .in('id',matchingIds.length ? matchingIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('is_published', true)
    .order('is_featured', { ascending: false })
    .order('priority')
    .order('name')

  if (q) vendorQuery = vendorQuery.or(q)
  if (cityPattern) vendorQuery = vendorQuery.ilike('city', cityPattern)

  const { data: queriedVendors, error: vendorError } = await vendorQuery
  // Keep listings discoverable if a nested photo/category relationship fails.
  // Never turn a database error into a misleading "0 vendors found" result.
  if (vendorError) {
    console.error('Vendor directory query failed:', vendorError.code, vendorError.message)
  }
  let vendors = queriedVendors
  let loadFailed = false
  if (vendorError) {
    let fallbackQuery = source().select('*')
      .eq('is_published', true)
      .order('is_featured', { ascending: false })
      .order('priority')
      .order('name')
      .in('id', matchingIds.length ? matchingIds : ['00000000-0000-0000-0000-000000000000'])
    if (q) fallbackQuery = fallbackQuery.or(q)
    if (cityPattern) fallbackQuery = fallbackQuery.ilike('city', cityPattern)
    const fallback = await fallbackQuery
    if (fallback.error) console.error('Vendor directory fallback failed:', fallback.error.code, fallback.error.message)
    loadFailed = !!fallback.error
    vendors = fallback.data as typeof queriedVendors
  }

  const cities = [...new Set(vendors?.map((v) => v.city) ?? [])].sort()

  const badgeMap = await vendorEntitlements((vendors ?? []).map(vendor => ({ id: vendor.id, claimed_by: vendor.claimed_by, is_claimed: vendor.is_claimed })))

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="bg-gradient-to-b from-primary-soft/60 to-ivory py-10 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href={directoryHref('/vendors', { q: sp.q, city: sp.city, tradition })}
              className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink mb-4"
            >
              <ChevronLeft className="h-4 w-4" />
              All Vendors
            </Link>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center">
                <VendorCategoryIcon icon={cat.icon} className="h-12 w-12 text-primary" />
              </div>
              <h1 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl text-ink">
                {cat.name}
              </h1>
            </div>
            {cat.description && (
              <p className="text-muted mb-6 max-w-lg">{cat.description}</p>
            )}
            <div className="max-w-xl">
              <VendorSearch basePath={`/vendors/${category}`} initialQuery={typeof sp.q === 'string' ? sp.q : ''} filters={{ city: sp.city, service: sp.service, tradition }} />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {(services??[]).length>0&&<div className="mb-6 flex flex-wrap gap-2">
            <Link href={directoryHref(`/vendors/${category}`, { q: sp.q, city: sp.city, tradition })} className={`rounded-full px-3 py-2 text-sm ${!sp.service?'bg-primary text-white':'bg-white text-muted'}`}>All services</Link>
            {services?.map(service=><Link key={service.id} href={directoryHref(`/vendors/${category}`, { q: sp.q, city: sp.city, tradition, service: service.slug })} className={`rounded-full px-3 py-2 text-sm ${sp.service===service.slug?'bg-primary text-white':'bg-white text-muted'}`}>{service.name}</Link>)}
          </div>}
          <VendorTraditionFilter key={tradition ?? 'all'} path={`/vendors/${category}`} tradition={tradition} filters={{ q: sp.q, city: sp.city, service: sp.service }} />

          {/* City filter */}
          {cities.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <Link
                href={directoryHref(`/vendors/${category}`, { q: sp.q, service: sp.service, tradition })}
                className={cn(
                  'px-3 py-1 rounded-full text-xs transition-colors',
                  !sp.city
                    ? 'bg-primary text-white'
                    : 'bg-primary-soft/60 text-muted hover:bg-primary-soft'
                )}
              >
                All Cities
              </Link>
              {cities.map((city) => (
                <Link
                  key={city}
                  href={directoryHref(`/vendors/${category}`, { q: sp.q, city, service: sp.service, tradition })}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs transition-colors',
                    sp.city === city
                      ? 'bg-primary text-white'
                      : 'bg-primary-soft/60 text-muted hover:bg-primary-soft'
                  )}
                >
                  {city}
                </Link>
              ))}
            </div>
          )}

          {loadFailed ? <p role="alert" className="mb-6 text-sm text-red-700">The vendor directory is unavailable. Please try again.</p> : <p className="text-sm text-muted mb-6">
            {vendors?.length ?? 0} vendor{(vendors?.length ?? 0) !== 1 ? 's' : ''} found
          </p>}

          {loadFailed ? null : vendors && vendors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor) => (
                <VendorCard key={vendor.id} vendor={{ ...vendor, ...badgeMap.get(vendor.id) }} imagePath={vendor.vendor_photos?.find(photo => photo.sort_order === 0)?.storage_path} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted">
                {sp.q || sp.city || sp.service || tradition
                  ? 'No vendors match your search. Try adjusting your filters.'
                  : 'No vendors found in this category.'}
              </p>
              {(sp.q || sp.city || sp.service || tradition) && (
                <Link
                  href={`/vendors/${category}`}
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
