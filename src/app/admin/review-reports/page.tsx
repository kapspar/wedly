import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { billingAdmin } from '@/lib/billing/stripe'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ReviewReportCard from '@/components/admin/ReviewReportCard'

export const metadata={title:'Review Reports — PlanWedly Admin'}
export default async function AdminReviewReports(){
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)redirect('/auth/login?redirect=/admin/review-reports')
  const {data:isStaff,error:roleError}=await supabase.rpc('is_admin')
  if(roleError||!isStaff)redirect('/dashboard')
  const admin=billingAdmin()
  const {data:reports,error}=await admin.from('review_reports')
    .select('id,review_id,reporter_id,reason,details,status,created_at')
    .eq('status','pending').order('created_at',{ascending:true}).limit(100)
  const reviewIds=[...new Set((reports??[]).map(r=>r.review_id))]
  const {data:reviews}=reviewIds.length?
    await admin.from('reviews').select('id,vendor_id,couple_id,rating,body').in('id',reviewIds):
    {data:[] as {id:string;vendor_id:string;couple_id:string;rating:number;body:string|null}[]}
  const vendorsIds=[...new Set((reviews??[]).map(r=>r.vendor_id))]
  const {data:vendors}=vendorsIds.length?
    await admin.from('vendors').select('id,name,claimed_by').in('id',vendorsIds):
    {data:[] as {id:string;name:string;claimed_by:string|null}[]}
  const vendorMap=new Map((vendors??[]).map(v=>[v.id,v]))
  const reviewMap=new Map((reviews??[]).map(r=>[r.id,r]))
  return <><Navbar/><main className="min-h-[70vh] bg-ivory px-4 py-10"><div className="mx-auto max-w-5xl">
    <Link href="/admin/reviews" className="text-sm text-primary underline">← Review moderation</Link>
    <h1 className="mt-4 font-[family-name:var(--font-heading)] text-3xl text-plum">Review Reports & Disputes</h1>
    <p className="mt-2 text-sm text-muted">A report does not automatically remove a review. Evaluate evidence, document the decision and unpublish only if a rule was violated.</p>
    {error?<p className="mt-6 text-red-700">Could not load reports.</p>:<div className="mt-7 space-y-4">
      {(reports??[]).map(report=>{
        const review=reviewMap.get(report.review_id)
        const vendor=review?vendorMap.get(review.vendor_id):undefined
        return <ReviewReportCard key={report.id} report={{
          id:report.id,reviewId:report.review_id,vendor:vendor?.name??'Unknown business',
          reviewRating:review?.rating??0,reviewBody:review?.body??null,
          reason:report.reason,details:report.details,createdAt:report.created_at,
          reporterKind:vendor?.claimed_by===report.reporter_id?'Listing owner':'Community member'
        }}/>
      })}
      {!reports?.length&&<p className="rounded-xl bg-white p-6 text-muted">No pending review reports.</p>}
    </div>}
  </div></main><Footer/></>
}
