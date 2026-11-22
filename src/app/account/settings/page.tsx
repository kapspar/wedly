import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import DeleteAccountForm from '@/components/account/DeleteAccountForm'

export const metadata={title:'Account Settings — PlanWedly'}
export default async function AccountSettingsPage(){
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user?.email)redirect('/auth/login?redirect=/account/settings')
  const {data:isStaff}=await supabase.rpc('is_admin')
  return <><Navbar/><main className="min-h-[70vh] bg-ivory px-4 py-12"><div className="mx-auto max-w-2xl">
    <Link href="/dashboard" className="text-sm text-primary underline">← Dashboard</Link>
    <h1 className="mt-4 font-[family-name:var(--font-heading)] text-3xl text-plum">Account settings</h1>
    <div className="mt-6 rounded-2xl border border-border-soft bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Signed-in account</p>
      <p className="mt-2 break-all text-base font-medium text-plum">{user.email}</p>
      <p className="mt-2 text-xs text-muted">To change your Google or email provider settings, use that provider directly.</p>
    </div>
    <div className="mt-8"><DeleteAccountForm email={user.email} isStaff={isStaff===true}/></div>
  </div></main><Footer/></>
}
