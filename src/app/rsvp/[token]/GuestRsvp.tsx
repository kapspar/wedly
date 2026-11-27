'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import {CheckCircle2,Heart,CalendarDays} from 'lucide-react'
import {createClient} from '@/lib/supabase/client'
type EventResponse = {id:string;name:string;date:string|null;status:string}
type Invitation = {guest:string;couple:string;party_size:number;events:EventResponse[]}
export default function GuestRsvp({token}:{token:string}){
 const [invite,setInvite]=useState<Invitation|null>(null)
 const [loading,setLoading]=useState(true)
 const [busy,setBusy]=useState('')
 const [error,setError]=useState('')
 const [success,setSuccess]=useState('')
 useEffect(()=>{
  let active=true
  async function load(){
   const {data,error:readError}=await createClient().rpc('get_guest_rsvp',{p_token:token})
   if(!active)return
   if(readError||!data||typeof data!=='object'||Array.isArray(data)){
    setError('This invitation is unavailable or the link was revoked.')
   }else setInvite(data as unknown as Invitation)
   setLoading(false)
  }
  void load()
  return()=>{active=false}
 },[token])
 async function respond(eventId:string,response:'confirmed'|'declined'){
  if(busy)return
  setBusy(eventId);setError('');setSuccess('')
  const {data,error:writeError}=await createClient().rpc('submit_guest_rsvp',{p_token:token,p_event:eventId,p_response:response})
  if(writeError||!data){setError('We could not save your RSVP. Please try again or contact the couple.')}
  else{
   setInvite(current=>current?{...current,events:current.events.map(e=>e.id===eventId?{...e,status:response}:e)}:null)
   setSuccess('Your response has been recorded. You can change it using this link.')
  }
  setBusy('')
 }
 return <main className="min-h-screen bg-ivory px-4 py-10">
  <div className="mx-auto max-w-xl">
   <Link href="/" className="block text-center font-[family-name:var(--font-logo)] text-3xl italic text-plum">PlanWedly</Link>
   <div className="mt-8 rounded-2xl border border-border-soft bg-white p-6 shadow-sm sm:p-8">
    <Heart className="mx-auto h-8 w-8 text-primary"/>
    <h1 className="mt-3 text-center font-[family-name:var(--font-heading)] text-3xl text-plum">You&apos;re invited</h1>
    {loading?<p className="mt-5 text-center text-sm text-muted">Loading invitation…</p>:invite?<>
     <p className="mt-4 text-center text-sm text-muted"><strong className="text-ink">{invite.couple}</strong> would love to celebrate with you.</p>
     <p className="mt-4 text-center text-ink">Hello <strong>{invite.guest}</strong>! This invitation is for <strong>{invite.party_size}</strong> {invite.party_size===1?'person':'people'}.</p>
     <p className="mt-2 text-center text-xs text-muted">Please respond to each event below. Your responses are saved to the couple&apos;s guest list.</p>
     <div className="mt-6 space-y-4">{invite.events.map(event=><section key={event.id} className="rounded-xl border border-border-soft p-4">
      <h2 className="font-semibold text-plum">{event.name}</h2>
      {event.date&&<p className="mt-1 flex items-center gap-1 text-xs text-muted"><CalendarDays className="h-3 w-3"/>{new Date(event.date+'T12:00:00').toLocaleDateString('en-CA',{year:'numeric',month:'long',day:'numeric'})}</p>}
      <p className="mt-2 text-xs text-muted">Your response: <strong>{event.status==='confirmed'?'Attending':event.status==='declined'?'Cannot attend':'Awaiting reply'}</strong></p>
      <div className="mt-3 grid grid-cols-2 gap-2">
       <button disabled={!!busy} onClick={()=>respond(event.id,'confirmed')} className={'rounded-xl border px-3 py-3 text-sm font-medium disabled:opacity-50 '+(event.status==='confirmed'?'border-primary bg-primary text-white':'border-primary text-primary')}>I&apos;ll be there</button>
       <button disabled={!!busy} onClick={()=>respond(event.id,'declined')} className={'rounded-xl border px-3 py-3 text-sm font-medium disabled:opacity-50 '+(event.status==='declined'?'border-plum bg-plum text-white':'border-border-soft text-muted')}>Can&apos;t attend</button>
      </div>
     </section>)}</div>
     {success&&<p role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-primary-soft/50 p-3 text-sm text-plum"><CheckCircle2 className="h-4 w-4"/>{success}</p>}
    </>:null}
    {error&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <p className="mt-6 text-center text-xs text-muted">This personal link can be used by anyone who has it. Please don&apos;t post it publicly.</p>
   </div>
  </div>
 </main>
}
