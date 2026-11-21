import Link from 'next/link'
import { notFound,redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { billingAdmin } from '@/lib/billing/stripe'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import VendorReviewReply from '@/components/vendors/VendorReviewReply'
export const metadata={title:'Customer Reviews — Vendor Dashboard'}
function serviceMonth(date:string) {
  const [y,m]=date.split('-').map(Number)
  return new Intl.DateTimeFormat('en-CA',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,1)))
}
export default async function VendorReviewsPage({params}:{params:Promise<{vendorId:string}>}){
  const {vendorId}=await params
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)redirect('/auth/login?redirect=/vendor/dashboard')
  const {data:vendor}=await supabase.from('vendors').select('id,name,claimed_by,is_claimed').eq('id',vendorId)
    .eq('claimed_by',user.id).eq('is_claimed',true).maybeSingle()
  if(!vendor)notFound()
  const {data:reviews,error}=await billingAdmin().from('reviews')
    .select('id,rating,body,service_date,customer_verified,vendor_response,response_status')
    .eq('vendor_id',vendor.id).eq('moderation_status','approved').eq('is_approved',true)
    .order('created_at',{ascending:false}).limit(100)
  return <><Navbar/><main className="min-h-[70vh] bg-ivory px-4 py-12"><div className="mx-auto max-w-3xl">
    <Link href="/vendor/dashboard" className="text-sm text-primary hover:underline">← Vendor dashboard</Link>
    <h1 className="mt-4 font-[family-name:var(--font-heading)] text-3xl text-plum">Reviews for {vendor.name}</h1>
    <p className="mt-2 text-sm text-muted">You may reply to each approved review once. Responses are checked by PlanWedly before they appear publicly. To dispute a review or amend a response, contact PlanWedly support.</p>
    {error?<p className="mt-6 text-sm text-red-700">Unable to load reviews.</p>:<div className="mt-6 space-y-4">
      {(reviews??[]).map(r=><article key={r.id} className="rounded-xl border border-border-soft bg-white p-5">
        <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold text-plum">{r.rating}/5 stars</span><span className="text-xs text-muted">Service: {serviceMonth(r.service_date)}</span></div>
        <p className="mt-3 whitespace-pre-line text-sm text-ink">{r.body}</p>
        {r.customer_verified&&<p className="mt-2 text-xs text-green-700">Verified Customer</p>}
        {r.response_status==='none'?<VendorReviewReply reviewId={r.id}/>:<>
          <p className="mt-3 text-xs font-medium text-plum">Your response · {r.response_status==='approved'?'Published':r.response_status==='pending'?'Awaiting moderator approval':'Not approved'}</p>
          <p className="mt-1 whitespace-pre-line text-sm text-muted">{r.vendor_response}</p>
        </>}
      </article>)}
      {!reviews?.length&&<p className="rounded-xl bg-white p-5 text-sm text-muted">No approved reviews yet.</p>}
    </div>}
  </div></main><Footer/></>
}
