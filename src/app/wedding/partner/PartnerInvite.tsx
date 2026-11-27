'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
export default function PartnerInvite({weddingId,canInvite,hasPartner}:{weddingId:string;canInvite:boolean;hasPartner:boolean}) {
 const [email,setEmail]=useState('');const [link,setLink]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [copied,setCopied]=useState(false)
 const invite=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');setCopied(false);setLink('')
 const {data,error:err}=await createClient().rpc('create_partner_invitation',{p_wedding:weddingId,p_email:email.trim()})
 if(err||!data){setError(err?.message||'Could not create invitation')}else{setLink(window.location.origin+'/wedding/join?token='+data)}
 setBusy(false)}
 return <div className="rounded-2xl border border-border-soft bg-white p-6 space-y-4">
 {hasPartner?<p className="font-medium text-plum">Your partner has joined your wedding. You can both edit its events, budget, tasks and guest list.</p>:
 !canInvite?<p className="text-muted">Your wedding&apos;s original creator can manage invitations.</p>:
 <><p className="text-sm text-muted">Enter your partner&apos;s email. They can sign up or sign in with that address, then use your private invitation link to join the same wedding plan. The invitation expires after 14 days.</p>
 <form onSubmit={invite} className="space-y-3"><label className="block text-sm font-medium" htmlFor="partner-email">Partner email</label><input id="partner-email" type="email" required maxLength={254} className="w-full rounded-xl border border-border-soft p-3" value={email} onChange={e=>setEmail(e.target.value)}/><button disabled={busy} className="rounded-xl bg-primary text-white px-5 py-3 disabled:opacity-60">{busy?'Creating…':'Generate invitation link'}</button></form>
 {link&&<div className="rounded-xl bg-primary-soft/30 p-4 space-y-2"><p className="text-sm font-medium">Share this invitation privately with your partner:</p><input readOnly value={link} className="w-full text-xs border rounded-lg p-2"/><button className="rounded-lg border px-4 py-2 text-sm" onClick={async()=>{try{await navigator.clipboard.writeText(link);setCopied(true)}catch{setError('Copy the link manually from the field.')}}}>{copied?'Copied!':'Copy invitation link'}</button></div>}</>}
 {error&&<p role="alert" className="text-sm text-red-600">{error}</p>}
 <p className="text-xs text-muted">Vendor inquiries and individual saved-vendor lists remain account-specific for now.</p>
 </div>
}
