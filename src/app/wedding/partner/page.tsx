import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PartnerInvite from './PartnerInvite'
export const metadata = { title: 'Invite your partner' }
export default async function PartnerPage() {
 const supabase=await createClient()
 const {data:{user}}=await supabase.auth.getUser()
 if(!user) redirect('/auth/login?redirect=/wedding/partner')
 const {data:wedding}=await supabase.from('weddings').select('id,couple_id,partner1_name,partner2_name').limit(1).maybeSingle()
 if(!wedding) redirect('/onboarding')
 const {data:members}=await supabase.from('wedding_members').select('user_id,role').eq('wedding_id',wedding.id)
 return <><Navbar/><main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12"><h1 className="text-3xl font-semibold text-plum mb-3">Plan together</h1><p className="text-muted mb-6">Share one wedding plan with your fiancé, fiancée or partner. You&apos;ll both see the same events, checklist and budget.</p><PartnerInvite weddingId={wedding.id} canInvite={wedding.couple_id===user.id} hasPartner={(members??[]).some(m=>m.role==='partner')} /><Link href="/dashboard" className="inline-block mt-5 text-primary underline underline-offset-4">Continue to dashboard (invite later)</Link></main><Footer/></>
}
