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
import VendorAnalytics from '@/components/analytics/VendorAnalytics'
import PublicReviews, { type PublicReview } from '@/components/vendors/PublicReviews'
import { billingAdmin } from '@/lib/billing/stripe'
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

  const socialLinks = [
    { key: 'instagram', label: 'Instagram', url: vendor.instagram_url },
    { key: 'tiktok', label: 'TikTok', url: vendor.tiktok_url },
    { key: 'facebook', label: 'Facebook', url: vendor.facebook_url },
    { key: 'youtube', label: 'YouTube', url: vendor.youtube_url },
    { key: 'pinterest', label: 'Pinterest', url: vendor.pinterest_url },
    { key: 'snapchat', label: 'Snapchat', url: vendor.snapchat_url },
    { key: 'linkedin', label: 'LinkedIn', url: vendor.linkedin_url },
    { key: 'whatsapp', label: 'WhatsApp', url: vendor.whatsapp_url },
  ].filter((link) => link.url && /^https:\/\//i.test(link.url))

  const directoryPhoto = photos?.find(photo => photo.sort_order === 0)
  const logoPhoto = photos?.find(photo => photo.sort_order === 1)
  const bannerPhoto = photos?.find(photo => photo.sort_order === 2) ?? directoryPhoto
  const galleryPhotos = photos?.filter(photo => photo.sort_order > 2) ?? []
  const hasPhotos = !!bannerPhoto

  // Public pages use server-only access: the reviews table (including proof
  // of service, reviewer identity and moderation notes) has no browser grants.
  // Select only explicitly approved display fields; never leak evidence.
  let publicReviews: PublicReview[] = []
  let approvedReviewCount = 0
  let publicRatingAverage: number | null = null
  const { data: approved, count, error: reviewError } = await billingAdmin().from('reviews')
    .select('id,rating,body,service_date,created_at,customer_verified,communication_rating,quality_rating,value_rating,reliability_rating,vendor_response,response_status', { count: 'exact' })
    .eq('vendor_id', vendor.id).eq('moderation_status', 'approved').eq('is_approved', true)
    .order('created_at', { ascending: false }).limit(1000)
  if (reviewError) {
    console.error('Could not load public reviews:', reviewError.message)
  } else {
    approvedReviewCount = count ?? 0
    publicReviews = (approved ?? []).slice(0,20) as PublicReview[]
    // Never publish an aggregate star score from only 1–2 reviews.
    // If more than 1000 exist, fail closed rather than computing a partial mean.
    if (approvedReviewCount >= 3 && approvedReviewCount <= 1000 && approved?.length === approvedReviewCount) {
      publicRatingAverage = approved.reduce((sum, review) => sum + review.rating, 0) / approvedReviewCount
    }
  }

  return (
    <>
      <Navbar />
      <VendorAnalytics vendorId={vendor.id} />
      <main className="flex-1">
        {/* Hero banner */}
        <div className="relative">
          <div
            className={`h-64 sm:h-80 ${
              hasPhotos
                ? 'bg-plum/10'
                : 'bg-gradient-to-br from-primary-soft via-lilac/70 to-ivory'
            } overflow-hidden`}
          >
            {bannerPhoto ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={getPhotoUrl(bannerPhoto.storage_path)}
                alt={bannerPhoto.alt_text ?? vendor.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-[family-name:var(--font-logo)] text-8xl sm:text-9xl italic font-light text-primary/15">
                  {vendor.name.charAt(0)}
                </span>
              </div>
            )}
            {hasPhotos && <div className="absolute inset-0 bg-plum/30" />}
          </div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
            <Card className="p-6 sm:p-8 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  {logoPhoto && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={getPhotoUrl(logoPhoto.storage_path)} alt={`${vendor.name} logo`}
                      className="mb-4 h-20 w-20 rounded-2xl border border-border-soft bg-white object-contain p-1" />
                  )}
                  <Link
                    href={`/vendors/${category.slug}`}
                    className="inline-flex items-center gap-1 text-xs text-muted hover:text-plum transition-colors mb-3"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    <VendorCategoryIcon icon={category.icon} className="h-3 w-3" />
                    {category.name}
                  </Link>
                  <h1 className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl text-ink mb-2">
                    {vendor.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1 text-sm text-muted">
                      <MapPin className="h-4 w-4 text-primary" />
                      {vendor.city}
                      {vendor.area && `, ${vendor.area}`}
                    </span>
                    {vendor.pricing_range && (
                      <span className="text-sm text-muted bg-primary-soft px-3 py-0.5 rounded-full font-medium">
                        {vendor.pricing_range}
                      </span>
                    )}
                    {vendor.is_featured && (
                      <span className="text-xs text-white bg-primary px-2.5 py-0.5 rounded-full font-medium">
                        Featured
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-3">
                  <SaveVendorButton vendorId={vendor.id} initialSaved={isSaved} userId={user?.id} />
                  {user && vendor.claimed_by !== user.id && (
                    <Link href={`/vendor/${vendor.slug}/review`}
                      className="inline-flex items-center justify-center rounded-xl border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary-soft/30 transition-colors">
                      Leave a Review
                    </Link>
                  )}
                  {!vendor.is_claimed && !vendor.claimed_by && (
                    <Link
                      href={`/vendor/claim/${vendor.slug}`}
                      className="inline-flex items-center justify-center rounded-xl border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary-soft/30 transition-colors"
                    >
                      Claim This Business
                    </Link>
                  )}
                </div>
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
                  <h2 className="font-[family-name:var(--font-heading)] text-xl text-ink mb-4">
                    About
                  </h2>
                  <p className="text-muted leading-relaxed whitespace-pre-line">
                    {vendor.description}
                  </p>
                </Card>
              )}

              {/* Gallery */}
              {galleryPhotos.length > 0 && (
                <Card className="p-6 sm:p-8">
                  <h2 className="font-[family-name:var(--font-heading)] text-xl text-ink mb-5">
                    Gallery
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {galleryPhotos.map((photo, idx) => (
                      <div
                        key={photo.id}
                        className={`bg-primary-soft/40 rounded-xl overflow-hidden ${
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

              {/* Only PlanWedly-moderated reviews; no public ratings for fewer than three. */}
              <PublicReviews reviews={publicReviews} count={approvedReviewCount} average={publicRatingAverage} slug={vendor.slug} />

              {/* Inquiry Form */}
              <Card className="p-6 sm:p-8">
                <h2 className="font-[family-name:var(--font-heading)] text-xl text-ink mb-2">
                  Send an Inquiry
                </h2>
                <p className="text-sm text-muted mb-5">
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
                <h3 className="font-[family-name:var(--font-heading)] text-base text-ink mb-4">
                  Contact
                </h3>
                <div className="space-y-3">
                  {vendor.website_url && (
                    <a
                      href={vendor.website_url}
                      data-analytics-outbound="website"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm text-muted hover:text-plum transition-colors group"
                    >
                      <Globe className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="truncate flex-1">Website</span>
                      <ExternalLink className="h-3 w-3 opacity-40 group-hover:opacity-100 flex-shrink-0" />
                    </a>
                  )}
                  {vendor.phone && (
                    <a
                      href={`tel:${vendor.phone}`}
                      className="flex items-center gap-2.5 text-sm text-muted hover:text-plum transition-colors"
                    >
                      <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                      {vendor.phone}
                    </a>
                  )}
                  {vendor.email && (
                    <a
                      href={`mailto:${vendor.email}`}
                      className="flex items-center gap-2.5 text-sm text-muted hover:text-plum transition-colors"
                    >
                      <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="truncate">{vendor.email}</span>
                    </a>
                  )}
                  {socialLinks.map(link => (
                    <a
                      key={link.key}
                      href={link.url!}
                      data-analytics-outbound={link.key}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm text-muted hover:text-plum transition-colors group"
                    >
                      <AtSign className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="flex-1">{link.label}</span>
                      <ExternalLink className="h-3 w-3 opacity-40 group-hover:opacity-100 flex-shrink-0" />
                    </a>
                  ))}
                  {!vendor.website_url && !vendor.phone && !vendor.email && socialLinks.length === 0 && (
                    <p className="text-sm text-muted">
                      Use the inquiry form below to get in touch.
                    </p>
                  )}
                </div>
              </Card>

              {/* Location */}
              <Card className="p-6">
                <h3 className="font-[family-name:var(--font-heading)] text-base text-ink mb-3">
                  Location
                </h3>
                <div className="flex items-start gap-2.5 text-sm text-muted">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>
                    {vendor.area && `${vendor.area}, `}{vendor.city}
                  </span>
                </div>
              </Card>

              {/* Pricing */}
              {vendor.pricing_range && (
                <Card className="p-6">
                  <h3 className="font-[family-name:var(--font-heading)] text-base text-ink mb-3">
                    Pricing
                  </h3>
                  <p className="text-sm text-muted">{vendor.pricing_range}</p>
                </Card>
              )}

              {/* Back to category */}
              <div className="pt-2">
                <Link
                  href={`/vendors/${category.slug}`}
                  className="flex items-center gap-1.5 text-sm text-muted hover:text-plum transition-colors"
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
