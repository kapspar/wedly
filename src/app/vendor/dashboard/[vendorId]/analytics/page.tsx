import Link from 'next/link'
import { notFound,redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { billingAdmin } from '@/lib/billing/stripe'
import { vendorEntitlements } from '@/lib/vendors/entitlements'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata={title:'Vendor Analytics — PlanWedly'}
export default async function VendorAnalyticsDashboard({params}:{params:Promise<{vendorId:string}>}){
  const {vendorId}=await params
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)redirect('/auth/login?redirect=/vendor/dashboard')
  const admin=billingAdmin()
  const {data:vendor,error:vendorError}=await admin.from('vendors')
    .select('id,name,claimed_by,is_claimed').eq('id',vendorId).maybeSingle()
  if(vendorError||!vendor?.is_claimed||vendor.claimed_by!==user.id)notFound()
  const premium=(await vendorEntitlements([vendor])).get(vendor.id)?.premiumPreview??false
  if(!premium)return <><Navbar/><main className="min-h-[70vh] bg-ivory px-4 py-12"><div className="mx-auto max-w-4xl">
    <Link href="/vendor/dashboard" className="text-sm text-primary underline">← Vendor dashboard</Link>
    <h1 className="mt-5 font-[family-name:var(--font-heading)] text-3xl text-plum">Vendor analytics</h1>
    <p className="mt-3 rounded-xl bg-white p-6 text-sm text-muted">Analytics is available with Premium Preview. Your engagement events will be collected without storing visitor identities; analytics becomes visible when the subscription is active.</p>
  </div></main><Footer/></>
  const createdSince = new Date(new Date().getTime() - 30 * 86400000).toISOString()
  const since = createdSince.slice(0, 10)
  const [views,website,instagram,inquiries,allInquiries,booked,quoted]=await Promise.all([
    admin.from('vendor_metric_events').select('vendor_id',{count:'exact',head:true}).eq('vendor_id',vendor.id).gte('event_date',since).eq('kind','view'),
    admin.from('vendor_metric_events').select('vendor_id',{count:'exact',head:true}).eq('vendor_id',vendor.id).gte('event_date',since).eq('kind','website'),
    admin.from('vendor_metric_events').select('vendor_id',{count:'exact',head:true}).eq('vendor_id',vendor.id).gte('event_date',since).eq('kind','instagram'),
    admin.from('inquiries').select('id',{count:'exact',head:true}).eq('vendor_id',vendor.id).gte('created_at',createdSince),
    admin.from('inquiries').select('id',{count:'exact',head:true}).eq('vendor_id',vendor.id),
    admin.from('vendor_lead_pipeline').select('inquiry_id',{count:'exact',head:true}).eq('vendor_id',vendor.id).eq('owner_id',user.id).eq('stage','booked'),
    admin.from('vendor_lead_pipeline').select('inquiry_id',{count:'exact',head:true}).eq('vendor_id',vendor.id).eq('owner_id',user.id).eq('stage','quoted'),
  ])
  const totalInquiries=inquiries.count??0
  const completed=booked.count??0
  const allTimeInquiries=allInquiries.count??0
  const conversion=allTimeInquiries?Math.round(100*completed/allTimeInquiries):null
  const anyError=[views,website,instagram,inquiries,allInquiries,booked,quoted].some(result=>!!result.error)
  const metrics=[
    {title:'Estimated profile viewing sessions',value:views.count??0,detail:'Past 30 days · deduplicated per browser tab each day'},
    {title:'Website click sessions',value:website.count??0,detail:'Past 30 days'},
    {title:'Instagram click sessions',value:instagram.count??0,detail:'Past 30 days'},
    {title:'New inquiries',value:totalInquiries,detail:'Past 30 days'},
    {title:'Leads marked Quoted',value:quoted.count??0,detail:'Current pipeline stage · all time'},
    {title:'Leads marked Booked',value:completed,detail:'Current pipeline stage · all time'},
  ]
  return <><Navbar/><main className="min-h-[70vh] bg-ivory px-4 py-12"><div className="mx-auto max-w-5xl">
    <Link href="/vendor/dashboard" className="text-sm text-primary underline">← Vendor dashboard</Link>
    <h1 className="mt-5 font-[family-name:var(--font-heading)] text-3xl text-plum">Insights for {vendor.name}</h1>
    <p className="mt-2 text-sm text-muted">Early-stage metrics based on on-site interactions and your inquiry records. These are approximate, not unique people or guaranteed customers.</p>
    {anyError&&<p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">Some metrics could not be loaded. Try again later.</p>}
    <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map(metric=><div key={metric.title} className="rounded-2xl border border-border-soft bg-white p-6">
        <p className="text-xs font-semibold text-muted">{metric.title}</p>
        <p className="mt-3 text-3xl font-bold text-plum">{metric.value.toLocaleString('en-CA')}</p>
        <p className="mt-2 text-xs text-muted">{metric.detail}</p>
      </div>)}
    </div>
    <div className="mt-6 rounded-2xl border border-border-soft bg-white p-6">
      <p className="text-sm font-semibold text-plum">Indicative booking conversion</p>
      <p className="mt-2 text-2xl font-semibold text-plum">{conversion===null?'Not enough data':conversion+'%'}</p>
      <p className="mt-1 text-xs text-muted">Leads currently marked Booked divided by all inquiries received since launch. This is an early operational snapshot, not a cohort-based conversion rate. More rigorous conversion reporting comes later.</p>
      <Link href={`/vendor/dashboard/${vendor.id}/inquiries`} className="mt-4 inline-block text-sm text-primary underline">Manage inquiries and lead stages</Link>
    </div>
    <p className="mt-6 text-xs text-muted">Site interaction counts use randomly generated browser-tab session identifiers, counted once per listing, day and interaction. No visitor names, IP addresses, emails or full destination URLs are saved to these metrics. Automated traffic and visitors who block tracking can affect counts.</p>
  </div></main><Footer/></>
}
