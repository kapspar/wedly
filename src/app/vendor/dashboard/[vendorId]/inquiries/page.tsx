import Link from 'next/link'
import { notFound,redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { billingAdmin } from '@/lib/billing/stripe'
import { vendorEntitlements } from '@/lib/vendors/entitlements'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import LeadTracker,{type LeadState} from '@/components/vendors/LeadTracker'

export const metadata={title:'Wedding Inquiries — Vendor Dashboard'}
export default async function VendorLeadInbox({params}:{params:Promise<{vendorId:string}>}){
  const {vendorId}=await params
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)redirect('/auth/login?redirect=/vendor/dashboard')
  const admin=billingAdmin()
  const {data:vendor,error:vendorError}=await admin.from('vendors')
    .select('id,name,claimed_by,is_claimed').eq('id',vendorId).maybeSingle()
  if(vendorError||!vendor?.is_claimed||vendor.claimed_by!==user.id)notFound()
  const premium=(await vendorEntitlements([vendor])).get(vendor.id)?.premiumPreview??false
  const {data:inquiries,error}=await admin.from('inquiries')
    .select('id,couple_id,message,event_date,guest_count,budget_cad,created_at,status')
    .eq('vendor_id',vendor.id).order('created_at',{ascending:false}).limit(100)
  const ids=[...new Set((inquiries??[]).map(item=>item.couple_id))]
  const {data:contacts}=ids.length?await admin.from('profiles').select('id,full_name,email').in('id',ids):
    {data:[] as {id:string;full_name:string|null;email:string}[]}
  const people=new Map((contacts??[]).map(p=>[p.id,p]))
  const inquiryIds=(inquiries??[]).map(item=>item.id)
  const {data:pipeline}=premium&&inquiryIds.length?await admin.from('vendor_lead_pipeline')
    .select('inquiry_id,stage,notes,follow_up_date').eq('vendor_id',vendor.id).in('inquiry_id',inquiryIds):
    {data:[] as {inquiry_id:string;stage:string;notes:string|null;follow_up_date:string|null}[]}
  const byInquiry=new Map((pipeline??[]).map(item=>[item.inquiry_id,item as LeadState]))
  const budget=(amount:number)=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(amount)
  return <><Navbar/><main className="min-h-[70vh] bg-ivory px-4 py-10"><div className="mx-auto max-w-4xl">
    <Link href="/vendor/dashboard" className="text-sm text-primary underline">← Vendor dashboard</Link>
    <h1 className="mt-4 font-[family-name:var(--font-heading)] text-3xl text-plum">Inquiries for {vendor.name}</h1>
    <p className="mt-2 text-sm text-muted">All vendors receive the couple's submitted contact information and optional service budget. Premium Preview adds private tracking, notes and reminders.</p>
    {error?<p className="mt-7 text-red-700">Could not load inquiries.</p>:<div className="mt-6 space-y-5">
      {(inquiries??[]).map(item=>{
        const person=people.get(item.couple_id)
        return <article key={item.id} className="rounded-2xl border border-border-soft bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-plum">{person?.full_name||'Couple inquiry'}</h2>
            <p className="text-xs text-muted">Sent {new Date(item.created_at).toLocaleDateString('en-CA')}</p>
          </div>
          {person?.email&&<p className="mt-2 text-sm text-primary">{person.email}</p>}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
            {item.event_date&&<span>Wedding date: {item.event_date}</span>}
            {item.guest_count&&<span>Guests: {item.guest_count}</span>}
            {item.budget_cad&&<span>Service budget (couple estimate): {budget(item.budget_cad)}</span>}
          </div>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-ink">{item.message}</p>
          {premium?<LeadTracker vendorId={vendor.id} inquiryId={item.id} initial={byInquiry.get(item.id)??null}/>:
            <p className="mt-4 rounded-lg bg-ivory p-3 text-xs text-muted">Premium Preview unlocks lead stages, private notes and follow-up reminders. Inquiry details remain free.</p>}
        </article>
      })}
      {!inquiries?.length&&<p className="rounded-xl bg-white p-6 text-sm text-muted">No inquiries received yet.</p>}
    </div>}
  </div></main><Footer/></>
}
