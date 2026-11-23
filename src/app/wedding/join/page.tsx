import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AcceptInvite from './AcceptInvite'
export default async function JoinPage({searchParams}:{searchParams:Promise<{token?:string}>}) {
 const {token}=await searchParams
 if(!token||!/^[0-9a-f-]{36}$/i.test(token)) redirect('/onboarding')
 const supabase=await createClient()
 const {data:{user}}=await supabase.auth.getUser()
 if(!user) redirect('/auth/login?redirect='+encodeURIComponent('/wedding/join?token='+token))
 return <><Navbar/><main className="flex-1 max-w-lg w-full mx-auto px-4 py-14"><h1 className="text-3xl font-semibold text-plum mb-4">Join your wedding</h1><AcceptInvite token={token}/></main><Footer/></>
}
