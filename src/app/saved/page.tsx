import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Bookmark } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ShortlistTracker, {type ShortlistItem} from '@/components/vendors/ShortlistTracker'

export const metadata={title:'Wedding Vendor Shortlist'}
export default async function SavedPage() {
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)redirect('/auth/login?redirect=/saved')
  const {data:wedding}=await supabase.from('weddings').select('id').limit(1).maybeSingle()
  if(!wedding)redirect('/onboarding')
  const {data:shortlist,error}=await supabase.from('wedding_vendor_shortlist')
    .select('wedding_id,vendor_id,stage,quote_amount,notes,vendor:vendors!wedding_vendor_shortlist_vendor_id_fkey(name,slug,city,pricing_range)')
    .eq('wedding_id',wedding.id).order('created_at',{ascending:false})
  if(error)console.error('Wedding shortlist load error:',error.code,error.message)
  return <><Navbar/><main className="flex-1 bg-ivory">
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">← Wedding dashboard</Link>
      <h1 className="mt-3 flex items-center gap-2 font-[family-name:var(--font-heading)] text-3xl text-plum sm:text-4xl"><Bookmark className="h-7 w-7 text-primary"/>Vendor shortlist</h1>
      <p className="mb-7 mt-2 text-sm text-muted">Compare vendors and track your decisions, quotes, and bookings together.</p>
      {error?<p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">Your vendor shortlist could not be loaded. Please refresh.</p>:<ShortlistTracker weddingId={wedding.id} initialItems={(shortlist??[]) as ShortlistItem[]}/>}
    </div>
  </main><Footer/></>
}
