import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import VendorListingEditor from '@/components/vendors/VendorListingEditor'
import { vendorEntitlements } from '@/lib/vendors/entitlements'
import { billingAdmin } from '@/lib/billing/stripe'
import VendorAvailabilityCalendar from '@/components/vendors/VendorAvailabilityCalendar'

export const metadata = { title: 'Manage Business Listing — PlanWedly' }

export default async function EditVendorPage({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/vendor/dashboard')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'vendor') redirect('/dashboard')

  const { data: vendor } = await supabase.from('vendors')
    .select('id,name,slug,description,city,area,pricing_range,website_url,phone,email,instagram_url,tiktok_url,facebook_url,youtube_url,pinterest_url,snapchat_url,linkedin_url,whatsapp_url,claimed_by,is_claimed')
    .eq('id', vendorId).eq('claimed_by', user.id).eq('is_claimed', true).maybeSingle()
  if (!vendor) notFound()
  const { data: photos } = await supabase.from('vendor_photos').select('id,storage_path,alt_text,sort_order')
    .eq('vendor_id', vendor.id).order('sort_order').limit(18)
  const badge = (await vendorEntitlements([{ id:vendor.id, claimed_by:vendor.claimed_by, is_claimed:vendor.is_claimed }])).get(vendor.id)
  const today=new Date().toISOString().slice(0,10)
  const {data:availability}=badge?.premiumPreview?await billingAdmin().from('vendor_availability')
    .select('available_date,status').eq('vendor_id',vendor.id)
    .gte('available_date',today).order('available_date').limit(366):{data:[] as {available_date:string;status:string}[]}
  return (
    <>
      <Navbar />
      <main className="bg-ivory min-h-[70vh] px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <Link href="/vendor/dashboard" className="text-sm font-medium text-primary hover:underline">Back to vendor dashboard</Link>
          <h1 className="mt-5 font-[family-name:var(--font-heading)] text-3xl text-plum">Manage {vendor.name}</h1>
          <p className="mt-2 text-muted">Update your free business listing. Changes to these fields appear publicly.</p>
          <VendorListingEditor vendor={vendor} initialPhotos={photos ?? []} premiumPreview={badge?.premiumPreview??false} />
          <div className="mt-8">{badge?.premiumPreview?<VendorAvailabilityCalendar vendorId={vendor.id} initialEntries={availability??[]} editable/>:<p className="rounded-xl bg-white p-6 text-sm text-muted">The availability calendar is a Premium Preview benefit. Subscribe to unlock date publishing.</p>}</div>
        </div>
      </main>
      <Footer />
    </>
  )
}
