'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import posthog from 'posthog-js'

export default function DeleteAccountForm({email,isStaff}:{email:string;isStaff:boolean}) {
  const router=useRouter()
  const [confirmedEmail,setConfirmedEmail]=useState('')
  const [phrase,setPhrase]=useState('')
  const [acknowledged,setAcknowledged]=useState(false)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const ready=!isStaff&&acknowledged&&confirmedEmail.trim().toLowerCase()===email.toLowerCase()&&phrase==='DELETE MY ACCOUNT'
  async function deleteAccount(){
    if(!ready||busy)return
    setBusy(true);setError('')
    try {
      const response=await fetch('/api/account/delete',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email:confirmedEmail,confirmation:phrase})
      })
      const payload=await response.json() as {error?:string}
      if(!response.ok)throw new Error(payload.error??'Unable to delete your account.')
      await createClient().auth.signOut()
      posthog.reset()
      router.replace('/?account_deleted=1')
      router.refresh()
    }catch(e){
      setError(e instanceof Error?e.message:'Unable to delete your account.')
      setBusy(false)
    }
  }
  return <section className="rounded-2xl border border-red-200 bg-white p-6 sm:p-8">
    <h2 className="font-[family-name:var(--font-heading)] text-2xl text-red-800">Delete your PlanWedly account</h2>
    {isStaff?<p className="mt-4 text-sm text-muted">PlanWedly owner/admin accounts cannot be self-deleted. Transfer administrative access first.</p>:<>
      <p className="mt-4 text-sm leading-6 text-ink">This action is permanent. It will delete your PlanWedly login, profile and wedding planning data, including budgets, guests, saved vendors, tasks and your submitted inquiries and reviews.</p>
      <p className="mt-3 text-sm leading-6 text-ink">If you own a vendor listing, its claim will be released and your uploaded photos, availability, private leads and Premium content removed. The public business listing and reviews submitted by other people can remain. Any associated <strong>Stripe test subscriptions will be canceled immediately</strong>. This does not delete your Google account.</p>
      <p className="mt-3 text-xs leading-5 text-muted">You can create a new PlanWedly account with the same email afterwards, but your old wedding data and business customization will not be restored.</p>
      <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-ink">
        <input type="checkbox" checked={acknowledged} onChange={e=>setAcknowledged(e.target.checked)}
          className="mt-1" />
        <span>I understand my PlanWedly data will be permanently deleted, my claimed business listings released, and any test subscriptions canceled.</span>
      </label>
      <label className="mt-5 block text-sm font-semibold text-ink">Confirm your account email address
        <input type="email" value={confirmedEmail} autoComplete="off" onChange={e=>setConfirmedEmail(e.target.value)}
          placeholder={email} className="mt-2 block w-full rounded-xl border border-border-soft p-3 text-sm font-normal"/>
      </label>
      <label className="mt-5 block text-sm font-semibold text-ink">Type DELETE MY ACCOUNT
        <input type="text" value={phrase} autoComplete="off" onChange={e=>setPhrase(e.target.value)}
          placeholder="DELETE MY ACCOUNT" className="mt-2 block w-full rounded-xl border border-border-soft p-3 text-sm font-normal"/>
      </label>
      {error&&<p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <button type="button" disabled={!ready||busy} onClick={()=>void deleteAccount()}
        className="mt-6 rounded-xl bg-red-700 px-6 py-3 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40">
        {busy?'Deleting account…':'Permanently delete account'}
      </button>
    </>}
  </section>
}
