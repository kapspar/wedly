import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { billingAdmin } from '@/lib/billing/stripe'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ReviewModerationCard, { type ReviewAdminItem } from '@/components/admin/ReviewModerationCard'
import AdminReviewResponseCard from '@/components/admin/AdminReviewResponseCard'

export const metadata={title:'Review Moderation — PlanWedly'}
export default async function AdminReviewsPage() {
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)redirect('/auth/login?redirect=/admin/reviews')
  const {data:isAdmin,error:roleError}=await supabase.rpc('is_admin')
  if(roleError||!isAdmin)redirect('/dashboard')
  const admin=billingAdmin()
  const {data:reviews,error}=await admin.from('reviews')
    .select('id,vendor_id,couple_id,rating,body,created_at,service_date,communication_rating,quality_rating,value_rating,reliability_rating,evidence_path,moderation_status,customer_verified,moderation_note')
    .order('created_at',{ascending:false}).limit(100)
  const vendorIds=[...new Set((reviews??[]).map(r=>r.vendor_id))]
  const reviewerIds=[...new Set((reviews??[]).map(r=>r.couple_id))]
  const [vendors,people]=await Promise.all([
    vendorIds.length?admin.from('vendors').select('id,name').in('id',vendorIds):Promise.resolve({data:[] as {id:string;name:string}[]}),
    reviewerIds.length?admin.from('profiles').select('id,full_name').in('id',reviewerIds):Promise.resolve({data:[] as {id:string;full_name:string|null}[]}),
  ])
  const names=new Map((vendors.data??[]).map(v=>[v.id,v.name]))
  const reviewers=new Map((people.data??[]).map(v=>[v.id,v.full_name??'PlanWedly member']))
  // Responses are a separate moderation queue, even on previously approved
  // customer reviews. Only approved responses appear on public pages.
  const {data:pendingReplies,error:replyError}=await admin.from('reviews')
    .select('id,vendor_id,rating,body,vendor_response')
    .eq('moderation_status','approved').eq('response_status','pending')
    .order('response_submitted_at',{ascending:true}).limit(100)
  const replyVendorIds=[...new Set((pendingReplies??[]).map(r=>r.vendor_id))]
  const missingVendorIds=replyVendorIds.filter(id=>!names.has(id))
  if(missingVendorIds.length){
    const {data:missingVendors}=await admin.from('vendors').select('id,name').in('id',missingVendorIds)
    for(const vendor of missingVendors??[])names.set(vendor.id,vendor.name)
  }
  const items:ReviewAdminItem[]=(reviews??[]).map(r=>({
    ...r, vendor_name:names.get(r.vendor_id)??'Vendor unavailable',
    reviewer_name:reviewers.get(r.couple_id)??'Member'
  }))
  return <><Navbar/><main className="min-h-[70vh] bg-ivory px-4 py-10"><div className="mx-auto max-w-5xl">
    <Link href="/admin" className="text-sm text-primary hover:underline">← Admin dashboard</Link>
    <h1 className="mt-4 font-[family-name:var(--font-heading)] text-3xl text-plum">Customer Review Moderation</h1>
    <Link href="/admin/review-reports" className="mt-3 inline-block text-sm text-primary underline">Review reports & disputes</Link>
    <p className="mt-2 text-sm text-muted">Read each review and inspect genuine-service evidence before awarding Verified Customer. Only approved reviews and separately approved business responses appear publicly.</p>
    {error?<p className="mt-8 text-red-700">Unable to load review queue.</p>:<>
      <h2 className="mb-4 mt-8 text-xl font-semibold">Pending ({items.filter(i=>i.moderation_status==='pending').length})</h2>
      <div className="space-y-4">{items.filter(i=>i.moderation_status==='pending').map(i=><ReviewModerationCard key={i.id} review={i}/>)}{!items.some(i=>i.moderation_status==='pending')&&<p className="rounded-lg bg-white p-6 text-muted">No reviews awaiting moderation.</p>}</div>
      <h2 className="mb-4 mt-10 text-xl font-semibold">Business responses awaiting approval ({pendingReplies?.length??0})</h2>
      {replyError?<p className="text-sm text-red-700">Could not load business response queue.</p>:<div className="space-y-4">
        {(pendingReplies??[]).filter(r=>!!r.vendor_response).map(r=>
          <AdminReviewResponseCard key={r.id} review={{id:r.id,vendorName:names.get(r.vendor_id)??'Vendor',rating:r.rating,body:r.body,vendor_response:r.vendor_response!}} />
        )}
        {!pendingReplies?.length&&<p className="rounded-xl bg-white p-5 text-sm text-muted">No responses awaiting moderation.</p>}
      </div>}
      <h2 className="mb-4 mt-10 text-xl font-semibold">Previously moderated</h2>
      <div className="space-y-4">{items.filter(i=>i.moderation_status!=='pending').map(i=><ReviewModerationCard key={i.id} review={i}/>)}</div>
    </>}
  </div></main><Footer/></>
}
