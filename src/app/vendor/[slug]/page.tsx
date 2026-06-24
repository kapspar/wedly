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

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <div className="relative">
          <div className="h-56 sm:h-72 bg-gradient-to-br from-peach-light via-peach/30 to-rose-gold/10 flex items-center justify-center">
            {photos && photos.length > 0 ? (
              <div className="absolute inset-0 bg-charcoal/20" />
            ) : (
              <span className="font-[family-name:var(--font-script)] text-6xl sm:text-8xl text-rose-gold/20">
                {vendor.name.charAt(0)}
              </span>
            )}
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
            <Card className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <Link
                    href={`/vendors/${category.slug}`}
                    className="inline-flex items-center gap-1 text-xs text-charcoal/50 hover:text-charcoal mb-2"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    <VendorCategoryIcon icon={category.icon} className="h-3 w-3" />
                    {category.name}
                  </Link>
                  <h1 className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl text-charcoal">
                    {vendor.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-sm text-charcoal/60">
                      <MapPin className="h-4 w-4" />
                      {vendor.city}
                      {vendor.area && `, ${vendor.area}`}
                    </span>
                    {vendor.pricing_range && (
                      <span className="text-sm text-charcoal/50 bg-peach-light/50 px-2 py-0.5 rounded-full">
                        {vendor.pricing_range}
                      </span>
                    )}
                    {vendor.is_featured && (
                      <span className="text-xs text-white bg-rose-gold px-2 py-0.5 rounded-full">
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

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              {vendor.description && (
                <Card className="p-6">
                  <h2 className="font-[family-name:var(--font-heading)] text-lg text-charcoal mb-3">
                    About
                  </h2>
                  <p className="text-sm text-charcoal/70 leading-relaxed whitespace-pre-line">
                    {vendor.description}
                  </p>
                </Card>
              )}

              {/* Gallery */}
              {photos && photos.length > 0 && (
                <Card className="p-6">
                  <h2 className="font-[family-name:var(--font-heading)] text-lg text-charcoal mb-4">
                    Gallery
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="aspect-[4/3] bg-peach-light/30 rounded-xl overflow-hidden"
                      >
                        <div className="w-full h-full flex items-center justify-center text-xs text-charcoal/30">
                          {photo.alt_text || 'Photo'}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Inquiry Form */}
              <Card className="p-6">
                <h2 className="font-[family-name:var(--font-heading)] text-lg text-charcoal mb-4">
                  Send an Inquiry
                </h2>
                <InquiryForm vendorId={vendor.id} vendorName={vendor.name} userId={user?.id} />
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Info */}
              <Card className="p-6">
                <h3 className="font-[family-name:var(--font-heading)] text-base text-charcoal mb-4">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  {vendor.website_url && (
                    <a
                      href={vendor.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-charcoal/70 hover:text-rose-gold transition-colors"
                    >
                      <Globe className="h-4 w-4 text-rose-gold" />
                      <span className="truncate">Website</span>
                      <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                    </a>
                  )}
                  {vendor.phone && (
                    <a
                      href={`tel:${vendor.phone}`}
                      className="flex items-center gap-2 text-sm text-charcoal/70 hover:text-rose-gold transition-colors"
                    >
                      <Phone className="h-4 w-4 text-rose-gold" />
                      {vendor.phone}
                    </a>
                  )}
                  {vendor.email && (
                    <a
                      href={`mailto:${vendor.email}`}
                      className="flex items-center gap-2 text-sm text-charcoal/70 hover:text-rose-gold transition-colors"
                    >
                      <Mail className="h-4 w-4 text-rose-gold" />
                      <span className="truncate">{vendor.email}</span>
                    </a>
                  )}
                  {vendor.instagram_url && (
                    <a
                      href={vendor.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-charcoal/70 hover:text-rose-gold transition-colors"
                    >
                      <AtSign className="h-4 w-4 text-rose-gold" />
                      Instagram
                      <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                    </a>
                  )}
                  {!vendor.website_url && !vendor.phone && !vendor.email && !vendor.instagram_url && (
                    <p className="text-sm text-charcoal/40">
                      Use the inquiry form to get in touch
                    </p>
                  )}
                </div>
              </Card>

              {/* Location */}
              <Card className="p-6">
                <h3 className="font-[family-name:var(--font-heading)] text-base text-charcoal mb-3">
                  Location
                </h3>
                <div className="flex items-center gap-2 text-sm text-charcoal/70">
                  <MapPin className="h-4 w-4 text-rose-gold" />
                  {vendor.city}
                  {vendor.area && `, ${vendor.area}`}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
