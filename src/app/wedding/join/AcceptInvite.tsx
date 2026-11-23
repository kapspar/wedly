'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
export default function AcceptInvite({token}:{token:string}){
 const router=useRouter();const [error,setError]=useState('');const [busy,setBusy]=useState(false)
 const accept=async()=>{setBusy(true);setError('');const {error:err}=await createClient().rpc('accept_partner_invitation',{p_token:token});if(err){setError(err.message);setBusy(false);return}router.replace('/dashboard');router.refresh()}
 return <div className="rounded-2xl border bg-white p-6 space-y-4"><p className="text-sm text-muted">Accepting gives you editing access to the wedding's shared budget, tasks, events and guest list. You must be signed in with the invited email.</p><button onClick={accept} disabled={busy} className="rounded-xl bg-primary px-5 py-3 text-white disabled:opacity-60">{busy?'Joining…':'Accept invitation'}</button>{error&&<p role="alert" className="text-red-600 text-sm">{error}</p>}</div>
}
