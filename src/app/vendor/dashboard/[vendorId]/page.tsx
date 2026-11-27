import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import VendorListingEditor from '@/components/vendors/VendorListingEditor'
import VendorPortfolioEditor from '@/components/vendors/VendorPortfolioEditor'
import { profileCompleteness } from '@/lib/vendors/profile-completeness'
import { categoryExperienceEntries } from '@/lib/vendors/wedding-experience'
import VendorExperienceEditor from '@/components/vendors/VendorExperienceEditor'
import VendorTaxonomyEditor from '@/components/vendors/VendorTaxonomyEditor'
import { vendorEntitlements } from '@/lib/vendors/entitlements'
import { billingAdmin } from '@/lib/billing/stripe'
import VendorAvailabilityCalendar from '@/components/vendors/VendorAvailabilityCalendar'
import PremiumProfileEditor, { type PremiumProfileData } from '@/components/vendors/PremiumProfileEditor'

export const metadata = { title: 'Manage Business Listing — PlanWedly' }

export default async function EditVendorPage({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/vendor/dashboard')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'vendor') redirect('/dashboard')

  const { data: vendor } = await supabase.from('vendors')
    .select('id,name,slug,description,city,area,service_areas,street_address,pricing_range,website_url,phone,email,category_id,instagram_url,tiktok_url,facebook_url,youtube_url,pinterest_url,snapchat_url,linkedin_url,whatsapp_url,claimed_by,is_claimed')
    .eq('id', vendorId).eq('claimed_by', user.id).eq('is_claimed', true).maybeSingle()
  if (!vendor) notFound()
  const { data: photos, error: photoError } = await supabase.from('vendor_photos').select('id,storage_path,storage_bucket,alt_text,sort_order')
    .eq('vendor_id', vendor.id).order('sort_order').limit(18)
  const [categories, services, memberships, serviceMemberships, experience] = await Promise.all([
    supabase.from('vendor_categories').select('id,name,slug').order('display_order'),
    supabase.from('vendor_services').select('id,category_id,name').order('display_order'),
    supabase.from('vendor_category_memberships').select('category_id').eq('vendor_id',vendor.id),
    supabase.from('vendor_service_memberships').select('service_id').eq('vendor_id',vendor.id),
    supabase.from('vendor_wedding_experience').select('cultures,ceremonies,notes,category_details').eq('vendor_id',vendor.id).maybeSingle(),
  ])
  const categoryIds = new Set([vendor.category_id, ...(memberships.data ?? []).map(row => row.category_id)])
  const experienceCategories = (categories.data ?? []).filter(category => categoryIds.has(category.id))
  const savedExperience = experience.data
  const score = profileCompleteness({
    description: vendor.description, serviceAreas: vendor.service_areas ?? [],
    contact: { email: vendor.email, phone: vendor.phone, website: vendor.website_url },
    social: [vendor.instagram_url, vendor.tiktok_url, vendor.facebook_url, vendor.youtube_url, vendor.pinterest_url,
      vendor.snapchat_url, vendor.linkedin_url, vendor.whatsapp_url],
    hasCover: !!photos?.some(photo => photo.sort_order === 0),
    hasExperience: !!savedExperience && (!!(savedExperience.cultures.length || savedExperience.ceremonies.length || savedExperience.notes.trim()) ||
      experienceCategories.some(category => categoryExperienceEntries(category, savedExperience.category_details).length > 0)),
  })
  const badge = (await vendorEntitlements([{ id:vendor.id, claimed_by:vendor.claimed_by, is_claimed:vendor.is_claimed }])).get(vendor.id)
  const today=new Date().toISOString().slice(0,10)
  const {data:availability}=badge?.premiumPreview?await billingAdmin().from('vendor_availability')
    .select('available_date,status').eq('vendor_id',vendor.id)
    .gte('available_date',today).order('available_date').limit(366):{data:[] as {available_date:string;status:string}[]}
  const {data:premiumProfile}=badge?.premiumPreview?await billingAdmin().from('vendor_premium_profiles')
    .select('packages,faqs,highlights,video_urls').eq('vendor_id',vendor.id).maybeSingle():
    {data:null}
  return (
    <>
      <Navbar />
      <main className="bg-ivory min-h-[70vh] px-4 py-6 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <Link href="/vendor/dashboard" className="text-sm font-medium text-primary hover:underline">Back to vendor dashboard</Link>
          <h1 className="mt-5 font-[family-name:var(--font-heading)] text-3xl text-plum">Manage {vendor.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link href={`/vendor/${vendor.slug}?preview=1`} className="inline-flex min-h-11 items-center rounded-xl bg-plum px-4 text-sm font-semibold text-white">Preview public listing</Link>
            <p className="text-sm text-muted">The preview uses your saved changes.</p>
          </div>
          <section className="mt-5 rounded-2xl border border-border-soft bg-white p-4 sm:p-6" aria-labelledby="completeness">
            <h2 id="completeness" className="text-lg font-medium text-plum">Profile completeness</h2>
            <p className="mt-1 text-sm text-muted">{score.completed} of {score.total} steps complete</p>
            <progress aria-labelledby="completeness" className="mt-2 h-2.5 w-full accent-plum" value={score.completed} max={score.total} />
            {score.suggestions.length > 0 && <ul className="mt-2 flex flex-wrap gap-x-4 text-sm">
              {score.suggestions.map(item => <li key={item.section}>
                <a href={`#${item.section}`} className="inline-flex min-h-11 items-center font-medium text-primary underline">{item.label}</a>
              </li>)}
            </ul>}
          </section>
          <nav aria-label="Business profile sections" className="mt-4 flex flex-wrap gap-2 text-sm font-medium text-plum">
            {[['business-info', 'Business info'], ['listing-images', 'Photos'], ['social-links', 'Social links'], ['categories', 'Categories'], ['experience', 'Wedding experience'], ['premium', 'Premium']].map(([id, label]) => (
              <a key={id} href={`#${id}`} className="inline-flex min-h-11 items-center rounded-xl border border-border-soft bg-white px-3 hover:bg-primary-soft/40">{label}</a>
            ))}
          </nav>
          <VendorListingEditor vendor={vendor} />
          {photoError
            ? <p id="listing-images" role="alert" className="mt-6 scroll-mt-24 text-sm text-red-700">Photos are unavailable. Refresh the page to try again.</p>
            : <VendorPortfolioEditor vendorId={vendor.id} initialPhotos={photos ?? []} premium={badge?.premiumPreview ?? false} />}
          <VendorTaxonomyEditor vendorId={vendor.id} primaryCategoryId={vendor.category_id} categories={categories.data ?? []}
            services={services.data ?? []} initialCategories={(memberships.data ?? []).map(row => row.category_id)}
            initialServices={(serviceMemberships.data ?? []).map(row => row.service_id)} />
          {experience.error || memberships.error || categories.error
            ? <p id="experience" role="alert" className="mt-6 scroll-mt-24 rounded-xl bg-white p-4 text-sm text-red-700">Wedding experience is unavailable. Refresh the page to try again.</p>
            : <VendorExperienceEditor vendorId={vendor.id} categories={experienceCategories} initial={experience.data} />}
          <div id="premium" className="mt-8 scroll-mt-24">{badge?.premiumPreview?<VendorAvailabilityCalendar vendorId={vendor.id} initialEntries={availability??[]} editable/>:<p className="rounded-xl bg-white p-6 text-sm text-muted">The availability calendar is a Premium Preview benefit. Subscribe to unlock date publishing.</p>}</div>
          <div className="mt-8">{badge?.premiumPreview?
            <PremiumProfileEditor vendorId={vendor.id} initial={premiumProfile as PremiumProfileData|null}/>:
            <p className="rounded-xl bg-white p-6 text-sm text-muted">Enhanced packages, FAQs, highlights and videos are Premium Preview benefits.</p>
          }</div>
        </div>
      </main>
      <Footer />
    </>
  )
}
