import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, MapPin, Globe, Phone, Mail, ExternalLink, AtSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Card from '@/components/ui/Card'
import VendorCategoryIcon from '@/components/vendors/VendorCategoryIcon'
import InquiryForm from '@/components/vendors/InquiryForm'
import SaveVendorButton from '@/components/vendors/SaveVendorButton'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: vendor } = await supabase
    .from('vendors')
    .select('name, description, city')
    .eq('slug', slug)
    .single()
  if (!vendor) return { title: 'Vendor Not Found' }
  return {
    title: `${vendor.name} — ${vendor.city}`,
    description: vendor.description ?? `${vendor.name} — Wedding vendor in ${vendor.city}`,
  }
}

export default async function VendorPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: vendor } = await supabase
    .from('vendors')
    .select('*, category:vendor_categories(*)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!vendor) notFound()

  const { data: photos } = await supabase
    .from('vendor_photos')
    .select('*')
    .eq('vendor_id', vendor.id)
    .order('sort_order')

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isSaved = false
  if (user) {
    const { data: saved } = await supabase
      .from('saved_vendors')
      .select('vendor_id')
      .eq('couple_id', user.id)
      .eq('vendor_id', vendor.id)
      .maybeSingle()
    isSaved = !!saved
  }

  const category = vendor.category as {
    id: string
    name: string
    slug: string
    icon: string | null
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  function getPhotoUrl(storagePath: string) {
    return `${supabaseUrl}/storage/v1/object/public/vendor-photos/${storagePath}`
  }

  const hasPhotos = photos && photos.length > 0

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero banner */}
        <div className="relative">
          <div
            className={`h-64 sm:h-80 ${
              hasPhotos
                ? 'bg-charcoal/10'
                : 'bg-gradient-to-br from-peach-light via-peach/30 to-rose-gold/10'
            } overflow-hidden`}
          >
            {hasPhotos && photos[0] ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={getPhotoUrl(photos[0].storage_path)}
                alt={photos[0].alt_text ?? vendor.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-[family-name:var(--font-logo)] text-8xl sm:text-9xl italic font-light text-rose-gold/15">
                  {vendor.name.charAt(0)}
                </span>
              </div>
            )}
            {hasPhotos && <div className="absolute inset-0 bg-charcoal/30" />}
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
            <Card className="p-6 sm:p-8 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <Link
                    href={`/vendors/${category.slug}`}
                    className="inline-flex items-center gap-1 text-xs text-charcoal/50 hover:text-rose-gold transition-colors mb-3"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    <VendorCategoryIcon icon={category.icon} className="h-3 w-3" />
                    {category.name}
                  </Link>
                  <h1 className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl text-charcoal mb-2">
                    {vendor.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1 text-sm text-charcoal/60">
                      <MapPin className="h-4 w-4 text-rose-gold" />
                      {vendor.city}
                      {vendor.area && `, ${vendor.area}`}
                    </span>
                    {vendor.pricing_range && (
                      <span className="text-sm text-charcoal/70 bg-peach-light/60 px-3 py-0.5 rounded-full font-medium">
                        {vendor.pricing_range}
                      </span>
                    )}
                    {vendor.is_featured && (
                      <span className="text-xs text-white bg-rose-gold px-2.5 py-0.5 rounded-full font-medium">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
                <SaveVendorButton vendorId={vendor.id} initialSaved={isSaved} userId={user?.id} />
              </div>
            </Card>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              {vendor.description && (
                <Card className="p-6 sm:p-8">
                  <h2 className="font-[family-name:var(--font-heading)] text-xl text-charcoal mb-4">
                    About
                  </h2>
                  <p className="text-charcoal/70 leading-relaxed whitespace-pre-line">
                    {vendor.description}
                  </p>
                </Card>
              )}

              {/* Gallery */}
              {hasPhotos && (
                <Card className="p-6 sm:p-8">
                  <h2 className="font-[family-name:var(--font-heading)] text-xl text-charcoal mb-5">
                    Gallery
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photos.map((photo, idx) => (
                      <div
                        key={photo.id}
                        className={`bg-peach-light/30 rounded-xl overflow-hidden ${
                          idx === 0 ? 'col-span-2 sm:col-span-2 aspect-video' : 'aspect-square'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getPhotoUrl(photo.storage_path)}
                          alt={photo.alt_text ?? `${vendor.name} photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                          loading={idx === 0 ? 'eager' : 'lazy'}
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Inquiry Form */}
              <Card className="p-6 sm:p-8">
                <h2 className="font-[family-name:var(--font-heading)] text-xl text-charcoal mb-2">
                  Send an Inquiry
                </h2>
                <p className="text-sm text-charcoal/50 mb-5">
                  Tell {vendor.name} about your wedding and what you&apos;re looking for.
                </p>
                <InquiryForm
                  vendorId={vendor.id}
                  vendorName={vendor.name}
                  vendorSlug={vendor.slug}
                  userId={user?.id}
                />
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Contact Info */}
              <Card className="p-6">
                <h3 className="font-[family-name:var(--font-heading)] text-base text-charcoal mb-4">
                  Contact
                </h3>
                <div className="space-y-3">
                  {vendor.website_url && (
                    <a
                      href={vendor.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm text-charcoal/70 hover:text-rose-gold transition-colors group"
                    >
                      <Globe className="h-4 w-4 text-rose-gold flex-shrink-0" />
                      <span className="truncate flex-1">Website</span>
                      <ExternalLink className="h-3 w-3 opacity-40 group-hover:opacity-100 flex-shrink-0" />
                    </a>
                  )}
                  {vendor.phone && (
                    <a
                      href={`tel:${vendor.phone}`}
                      className="flex items-center gap-2.5 text-sm text-charcoal/70 hover:text-rose-gold transition-colors"
                    >
                      <Phone className="h-4 w-4 text-rose-gold flex-shrink-0" />
                      {vendor.phone}
                    </a>
                  )}
                  {vendor.email && (
                    <a
                      href={`mailto:${vendor.email}`}
                      className="flex items-center gap-2.5 text-sm text-charcoal/70 hover:text-rose-gold transition-colors"
                    >
                      <Mail className="h-4 w-4 text-rose-gold flex-shrink-0" />
                      <span className="truncate">{vendor.email}</span>
                    </a>
                  )}
                  {vendor.instagram_url && (
                    <a
                      href={vendor.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm text-charcoal/70 hover:text-rose-gold transition-colors group"
                    >
                      <AtSign className="h-4 w-4 text-rose-gold flex-shrink-0" />
                      <span className="flex-1">Instagram</span>
                      <ExternalLink className="h-3 w-3 opacity-40 group-hover:opacity-100 flex-shrink-0" />
                    </a>
                  )}
                  {!vendor.website_url && !vendor.phone && !vendor.email && !vendor.instagram_url && (
                    <p className="text-sm text-charcoal/40">
                      Use the inquiry form below to get in touch.
                    </p>
                  )}
                </div>
              </Card>

              {/* Location */}
              <Card className="p-6">
                <h3 className="font-[family-name:var(--font-heading)] text-base text-charcoal mb-3">
                  Location
                </h3>
                <div className="flex items-start gap-2.5 text-sm text-charcoal/70">
                  <MapPin className="h-4 w-4 text-rose-gold flex-shrink-0 mt-0.5" />
                  <span>
                    {vendor.area && `${vendor.area}, `}{vendor.city}
                  </span>
                </div>
              </Card>

              {/* Pricing */}
              {vendor.pricing_range && (
                <Card className="p-6">
                  <h3 className="font-[family-name:var(--font-heading)] text-base text-charcoal mb-3">
                    Pricing
                  </h3>
                  <p className="text-sm text-charcoal/70">{vendor.pricing_range}</p>
                </Card>
              )}

              {/* Back to category */}
              <div className="pt-2">
                <Link
                  href={`/vendors/${category.slug}`}
                  className="flex items-center gap-1.5 text-sm text-charcoal/50 hover:text-rose-gold transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  All {category.name}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
