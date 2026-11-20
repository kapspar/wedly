import Link from 'next/link'
import { notFound,redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ReviewSubmissionForm from '@/components/vendors/ReviewSubmissionForm'
export const metadata={ title:'Leave a Vendor Review — PlanWedly' }
export default async function VendorReviewPage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params
  const supabase=await createClient()
  const { data:{ user } }=await supabase.auth.getUser()
  if(!user) redirect('/auth/login?redirect='+encodeURIComponent('/vendor/'+slug+'/review'))
  const {data:vendor}=await supabase.from('vendors').select('id,name,slug,claimed_by').eq('slug',slug).eq('is_published',true).maybeSingle()
  if(!vendor) notFound()
  if(vendor.claimed_by===user.id) redirect('/vendor/'+slug)
  return <><Navbar/><main className="min-h-[70vh] bg-ivory px-4 py-12"><div className="mx-auto max-w-2xl">
    <Link href={'/vendor/'+slug} className="text-sm text-primary hover:underline">← Back to vendor</Link>
    <h1 className="mt-5 font-[family-name:var(--font-heading)] text-3xl text-plum">Review {vendor.name}</h1>
    <p className="mb-6 mt-2 text-muted">Reviews are not published automatically. PlanWedly checks submissions for authenticity and policy compliance.</p>
    <ReviewSubmissionForm vendorId={vendor.id}/>
  </div></main><Footer/></>
}
