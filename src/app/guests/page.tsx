'use client'
import {useEffect,useMemo,useState} from 'react'
import Link from 'next/link'
import {Users,Plus,Trash2,Download,CalendarDays,Search} from 'lucide-react'
import {createClient} from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import {EVENT_TYPES} from '@/lib/constants'
import type {EventType} from '@/lib/types/database'

type Guest = {
 id:string;wedding_id:string;name:string;household_name:string|null;email:string|null;phone:string|null;
 party_size:number;side:string;rsvp_status:string;dietary_notes:string|null;notes:string|null
}
type Event = {id:string;event_type:EventType;custom_label:string|null}
type GuestInvite = {guest_id:string;event_id:string;wedding_id:string;rsvp_status:string}
const statuses=[{value:'pending',label:'Not invited'},{value:'invited',label:'Invited'},{value:'confirmed',label:'Confirmed'},{value:'declined',label:'Declined'}]
const eventName=(event:Event)=>event.custom_label?.trim()||EVENT_TYPES.find(t=>t.value===event.event_type)?.label||event.event_type
const statusLabel=(s:string)=>statuses.find(x=>x.value===s)?.label||s
function csvCell(value:string|number|null|undefined){return '"'+String(value??'').replaceAll('"','""').replace(/^([=+\-@\t\r])/,"'$1")+'"'}
export default function GuestsPage(){
 const [guests,setGuests]=useState<Guest[]>([])
 const [events,setEvents]=useState<Event[]>([])
 const [invites,setInvites]=useState<GuestInvite[]>([])
 const [weddingId,setWeddingId]=useState('')
 const [loading,setLoading]=useState(true)
 const [busy,setBusy]=useState('')
 const [error,setError]=useState('')
 const [success,setSuccess]=useState('')
 const [name,setName]=useState('')
 const [household,setHousehold]=useState('')
 const [partySize,setPartySize]=useState(1)
 const [side,setSide]=useState('couple')
 const [email,setEmail]=useState('')
 const [search,setSearch]=useState('')
 const [eventFilter,setEventFilter]=useState('all')
 const [statusFilter,setStatusFilter]=useState('all')
 const [householdFilter,setHouseholdFilter]=useState('all')
 const [links,setLinks]=useState<Record<string,string>>({})
 useEffect(()=>{
  let active=true
  async function load(){
   const supabase=createClient()
   const {data:{user}}=await supabase.auth.getUser()
   if(!active)return
   if(!user){setError('Sign in to manage your wedding guests.');setLoading(false);return}
   const {data:wedding,error:we}=await supabase.from('weddings').select('id').limit(1).maybeSingle()
   if(!active)return
   if(we||!wedding){setError(we?.message||'Set up a wedding before managing guests.');setLoading(false);return}
   setWeddingId(wedding.id)
   const [g,e,i]=await Promise.all([
    supabase.from('guest_list').select('id,wedding_id,name,household_name,email,phone,party_size,side,rsvp_status,dietary_notes,notes').eq('wedding_id',wedding.id).order('name'),
    supabase.from('wedding_events').select('id,event_type,custom_label').eq('wedding_id',wedding.id).order('sort_order'),
    supabase.from('guest_event_invitations').select('guest_id,event_id,wedding_id,rsvp_status').eq('wedding_id',wedding.id)
   ])
   if(!active)return
   if(g.error||e.error||i.error)setError(g.error?.message||e.error?.message||i.error?.message||'Guest list could not load.')
   else{setGuests(g.data??[]);setEvents(e.data??[]);setInvites(i.data??[])}
   setLoading(false)
  }
  void load();return()=>{active=false}
 },[])
 const total=guests.reduce((n,g)=>n+g.party_size,0)
 const confirmed=guests.filter(g=>g.rsvp_status==='confirmed').reduce((n,g)=>n+g.party_size,0)
 const householdNames=useMemo(()=>[...new Set(guests.map(g=>g.household_name?.trim()).filter((x):x is string=>!!x))].sort(),[guests])
 const eventCount=(eventId:string)=>guests.filter(g=>invites.some(i=>i.guest_id===g.id&&i.event_id===eventId)).reduce((n,g)=>n+g.party_size,0)
 const visible=useMemo(()=>guests.filter(g=>{
  const value=search.trim().toLowerCase()
  if(value&&!([g.name,g.household_name,g.email,g.phone].some(x=>(x??'').toLowerCase().includes(value))))return false
  if(householdFilter!=='all'&&(householdFilter==='ungrouped'?!!g.household_name:g.household_name!==householdFilter))return false
  if(eventFilter==='all')return statusFilter==='all'||g.rsvp_status===statusFilter
  const invite=invites.find(i=>i.guest_id===g.id&&i.event_id===eventFilter)
  return !!invite&&(statusFilter==='all'||invite.rsvp_status===statusFilter)
 }),[guests,invites,search,householdFilter,eventFilter,statusFilter])
 const groups=useMemo(()=>{
  const m=new Map<string,Guest[]>()
  for(const guest of visible){const key=guest.household_name?.trim()||'Other guests';m.set(key,[...(m.get(key)||[]),guest])}
  return [...m.entries()].sort(([a],[b])=>a.localeCompare(b))
 },[visible])
 async function addGuest(e:React.FormEvent){
  e.preventDefault();if(!weddingId||busy)return
  if(!name.trim()||!Number.isInteger(partySize)||partySize<1||partySize>100){setError('Enter a name and party size between 1 and 100.');return}
  setBusy('new');setError('');setSuccess('')
  const {data,error:writeError}=await createClient().from('guest_list').insert({
   wedding_id:weddingId,name:name.trim(),household_name:household.trim()||null,party_size:partySize,
   side,email:email.trim()||null
  }).select('id,wedding_id,name,household_name,email,phone,party_size,side,rsvp_status,dietary_notes,notes').single()
  if(writeError)setError('Unable to add guest: '+writeError.message)
  else if(data){setGuests(current=>[...current,data].sort((a,b)=>a.name.localeCompare(b.name)));setName('');setEmail('');setPartySize(1);setSuccess('Guest or household added.')}
  setBusy('')
 }
 async function update(id:string,patch:Partial<Pick<Guest,'name'|'household_name'|'email'|'phone'|'party_size'|'side'|'rsvp_status'|'dietary_notes'|'notes'>>){
  if(busy)return
  const original=guests.find(g=>g.id===id);if(!original)return
  if(patch.party_size!==undefined&&(!Number.isInteger(patch.party_size)||patch.party_size<1||patch.party_size>100)){
   setError('Party size must be from 1 to 100.');return
  }
  setBusy(id);setError('');setSuccess('')
  const {data,error:writeError}=await createClient().from('guest_list').update({...patch,updated_at:new Date().toISOString()})
   .eq('wedding_id',weddingId).eq('id',id).select('id,wedding_id,name,household_name,email,phone,party_size,side,rsvp_status,dietary_notes,notes').single()
  if(writeError)setError('Unable to update guest: '+writeError.message)
  else if(data){setGuests(current=>current.map(g=>g.id===id?data:g));setSuccess('Guest details saved for both partners.')}
  setBusy('')
 }
 async function setInvitation(guestId:string,eventId:string,next:string){
  if(busy)return
  setBusy(guestId);setError('');setSuccess('')
  const supabase=createClient()
  const prior=invites.find(i=>i.guest_id===guestId&&i.event_id===eventId)
  if(next==='none'){
   if(prior){
    const {error:writeError}=await supabase.from('guest_event_invitations').delete().eq('guest_id',guestId).eq('event_id',eventId).eq('wedding_id',weddingId)
    if(writeError)setError('Could not change invitation: '+writeError.message)
    else setInvites(current=>current.filter(i=>!(i.guest_id===guestId&&i.event_id===eventId)))
   }
  }else{
   const {data,error:writeError}=await supabase.from('guest_event_invitations')
    .upsert({guest_id:guestId,event_id:eventId,wedding_id:weddingId,rsvp_status:next},{onConflict:'guest_id,event_id'})
    .select('guest_id,event_id,wedding_id,rsvp_status').single()
   if(writeError)setError('Could not save invitation: '+writeError.message)
   else if(data)setInvites(current=>[...current.filter(i=>!(i.guest_id===guestId&&i.event_id===eventId)),data])
  }
  setBusy('')
 }
 async function createRsvpLink(guestId:string){
  if(busy)return
  setBusy(guestId);setError('');setSuccess('')
  const {data,error:linkError}=await createClient().rpc('create_guest_rsvp_link',{p_guest:guestId})
  if(linkError||!data)setError(linkError?.message||'Unable to create RSVP link.')
  else {
   const url=window.location.origin+'/rsvp/'+data
   setLinks(current=>({...current,[guestId]:url}))
   setSuccess('Personal RSVP link created. Copy and send it to the guest yourself.')
  }
  setBusy('')
 }
 async function revokeRsvpLink(guestId:string){
  if(busy||!window.confirm('Revoke this guest’s RSVP link? Previously shared links will stop working.'))return
  setBusy(guestId);setError('');setSuccess('')
  const {error:revokeError}=await createClient().rpc('revoke_guest_rsvp_link',{p_guest:guestId})
  if(revokeError)setError(revokeError.message)
  else {setLinks(current=>{const next={...current};delete next[guestId];return next});setSuccess('Invitation link revoked.')}
  setBusy('')
 }
 async function copyRsvpLink(guestId:string){
  const link=links[guestId]
  if(!link)return
  try{await navigator.clipboard.writeText(link);setSuccess('RSVP link copied. Send it directly to the guest.')}
  catch{setSuccess('Select the link below to copy it manually.')}
 }
 async function removeGuest(id:string){
  if(busy||!window.confirm('Delete this guest/household and its event invitations?'))return
  setBusy(id);setError('');setSuccess('')
  const {error:writeError}=await createClient().from('guest_list').delete().eq('id',id).eq('wedding_id',weddingId)
  if(writeError)setError('Unable to remove guest: '+writeError.message)
  else{setGuests(current=>current.filter(g=>g.id!==id));setInvites(current=>current.filter(i=>i.guest_id!==id))}
  setBusy('')
 }
 function exportCsv(){
  const head=['Guest or household','Household group','Party size','Side','Overall RSVP','Email','Phone','Dietary notes','Notes',...events.map(e=>eventName(e)+' RSVP')]
  const lines=[head.map(csvCell).join(',')]
  for(const g of visible){
   const fields=[g.name,g.household_name,g.party_size,g.side,g.rsvp_status,g.email,g.phone,g.dietary_notes,g.notes,
    ...events.map(e=>invites.find(i=>i.guest_id===g.id&&i.event_id===e.id)?.rsvp_status||'not invited')]
   lines.push(fields.map(csvCell).join(','))
  }
  const blob=new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'})
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='planwedly-guests.csv';a.click();URL.revokeObjectURL(url)
 }
 return <><Navbar/><main className="flex-1 bg-ivory"><div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
  <Link href="/dashboard" className="text-sm text-primary hover:underline">← Wedding dashboard</Link>
  <div className="mt-3 mb-6 flex flex-wrap items-center justify-between gap-3"><div>
   <h1 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-3xl text-plum sm:text-4xl"><Users className="h-7 w-7 text-primary"/>Guest management</h1>
   <p className="mt-2 text-sm text-muted">Organize households, track responses and plan the guest list for each celebration.</p>
  </div><button type="button" disabled={loading||!weddingId} onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl border border-primary px-4 py-2 text-sm text-primary disabled:opacity-50"><Download className="h-4 w-4"/>Export CSV</button></div>
  <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
   {[[total,'Guests planned'],[confirmed,'Confirmed overall'],[guests.length,'Guest/household entries'],[householdNames.length,'Named households']].map(([n,label])=><div key={label} className="rounded-xl border border-border-soft bg-white p-4"><p className="text-2xl font-bold text-plum">{n}</p><p className="mt-1 text-xs text-muted">{label}</p></div>)}
  </div>
  {!!events.length&&<div className="mb-6 rounded-2xl border border-border-soft bg-white p-4"><h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-plum"><CalendarDays className="h-4 w-4"/>Event invitation counts</h2><div className="flex flex-wrap gap-2">{events.map(e=><span key={e.id} className="rounded-full bg-primary-soft/50 px-3 py-2 text-xs text-plum">{eventName(e)}: {eventCount(e.id)}</span>)}</div></div>}
  {error&&<p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
  {success&&<p role="status" className="mb-4 rounded-xl bg-primary-soft/50 p-3 text-sm text-plum">{success}</p>}
  <form onSubmit={addGuest} className="mb-6 rounded-2xl border border-border-soft bg-white p-5">
   <h2 className="mb-4 font-semibold text-plum">Add guest or household</h2>
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="text-xs font-medium text-muted">Guest name or household contact<input required maxLength={180} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Auntie Meena" className="mt-1 block w-full rounded-xl border border-border-soft p-3 text-sm text-ink"/></label>
    <label className="text-xs font-medium text-muted">Household group (optional)<input maxLength={120} value={household} onChange={e=>setHousehold(e.target.value)} placeholder="e.g. Kumar family" className="mt-1 block w-full rounded-xl border border-border-soft p-3 text-sm text-ink"/></label>
    <label className="text-xs font-medium text-muted">Number of people<input type="number" min="1" max="100" step="1" value={partySize} onChange={e=>setPartySize(Number(e.target.value))} className="mt-1 block w-full rounded-xl border border-border-soft p-3 text-sm text-ink"/></label>
    <label className="text-xs font-medium text-muted">Invited by<select value={side} onChange={e=>setSide(e.target.value)} className="mt-1 block w-full rounded-xl border border-border-soft p-3 text-sm text-ink"><option value="couple">Both / couple</option><option value="partner1">Partner 1 side</option><option value="partner2">Partner 2 side</option></select></label>
    <label className="text-xs font-medium text-muted sm:col-span-2">Email (optional)<input type="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 block w-full rounded-xl border border-border-soft p-3 text-sm text-ink"/></label>
   </div><button type="submit" disabled={!weddingId||!!busy||!name.trim()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white disabled:opacity-50"><Plus className="h-4 w-4"/>Add to guest list</button>
  </form>
  <div className="mb-5 rounded-2xl border border-border-soft bg-white p-4">
   <div className="relative mb-3"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted"/><input aria-label="Search guests" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, family, email…" className="w-full rounded-xl border border-border-soft p-3 pl-10 text-sm text-ink"/></div>
   <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
    <label className="text-xs text-muted">Event<select value={eventFilter} onChange={e=>setEventFilter(e.target.value)} className="mt-1 block w-full rounded-lg border border-border-soft p-2 text-sm text-ink"><option value="all">All events</option>{events.map(e=><option key={e.id} value={e.id}>{eventName(e)}</option>)}</select></label>
    <label className="text-xs text-muted">RSVP<select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="mt-1 block w-full rounded-lg border border-border-soft p-2 text-sm text-ink"><option value="all">All responses</option>{statuses.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
    <label className="text-xs text-muted">Household<select value={householdFilter} onChange={e=>setHouseholdFilter(e.target.value)} className="mt-1 block w-full rounded-lg border border-border-soft p-2 text-sm text-ink"><option value="all">All households</option><option value="ungrouped">Ungrouped</option>{householdNames.map(n=><option key={n} value={n}>{n}</option>)}</select></label>
   </div>
  </div>
  {loading?<div className="rounded-xl bg-white p-8 text-center text-muted">Loading guests…</div>:
    groups.length===0?<div className="rounded-xl bg-white p-8 text-center text-sm text-muted">{guests.length?'No matches. Try a different filter.':'No guests yet. Add your first household above.'}</div>:
    <div className="space-y-6">{groups.map(([group,members])=><section key={group}>
      <h2 className="mb-3 flex items-center justify-between gap-3 text-base font-semibold text-plum"><span>{group}</span><span className="text-xs font-normal text-muted">{members.reduce((n,g)=>n+g.party_size,0)} people</span></h2>
      <div className="space-y-3">{members.map(g=><div key={g.id} className="rounded-2xl border border-border-soft bg-white p-4 sm:p-5">
       <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1"><p className="font-medium text-ink">{g.name}</p><p className="mt-1 text-xs text-muted">{g.party_size} people · {g.side==='partner1'?'Partner 1 side':g.side==='partner2'?'Partner 2 side':'Both sides'}</p></div>
        <button type="button" aria-label={'Delete '+g.name} disabled={!!busy} onClick={()=>removeGuest(g.id)} className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50"><Trash2 className="h-4 w-4"/></button>
       </div>
       <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-muted">Guest / household name<input maxLength={180} key={g.id+g.name} defaultValue={g.name} disabled={!!busy} onBlur={e=>{const value=e.target.value.trim();if(value&&value!==g.name)void update(g.id,{name:value});else if(!value)e.target.value=g.name}} className="mt-1 block w-full rounded-lg border border-border-soft p-2 text-sm text-ink"/></label>
        <label className="text-xs text-muted">Household group<input maxLength={120} key={g.id+(g.household_name||'')} defaultValue={g.household_name||''} disabled={!!busy} onBlur={e=>{const value=e.target.value.trim()||null;if(value!==g.household_name)void update(g.id,{household_name:value})}} className="mt-1 block w-full rounded-lg border border-border-soft p-2 text-sm text-ink"/></label>
        <label className="text-xs text-muted">People in party<input type="number" min="1" max="100" key={g.id+g.party_size} defaultValue={g.party_size} disabled={!!busy} onBlur={e=>{const value=Number(e.target.value);if(Number.isInteger(value)&&value>=1&&value<=100&&value!==g.party_size)void update(g.id,{party_size:value})}} className="mt-1 block w-full rounded-lg border border-border-soft p-2 text-sm text-ink"/></label>
        <label className="text-xs text-muted">Overall RSVP<select value={g.rsvp_status} disabled={!!busy} onChange={e=>update(g.id,{rsvp_status:e.target.value})} className="mt-1 block w-full rounded-lg border border-border-soft p-2 text-sm text-ink">{statuses.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
        <label className="text-xs text-muted">Side<select value={g.side} disabled={!!busy} onChange={e=>update(g.id,{side:e.target.value})} className="mt-1 block w-full rounded-lg border border-border-soft p-2 text-sm text-ink"><option value="couple">Both / couple</option><option value="partner1">Partner 1</option><option value="partner2">Partner 2</option></select></label>
        <label className="text-xs text-muted">Contact email<input type="email" maxLength={254} key={g.id+(g.email||'')} defaultValue={g.email||''} disabled={!!busy} onBlur={e=>{const value=e.target.value.trim()||null;if(value!==g.email)void update(g.id,{email:value})}} className="mt-1 block w-full rounded-lg border border-border-soft p-2 text-sm text-ink"/></label>
        <label className="text-xs text-muted">Phone<input maxLength={40} key={g.id+(g.phone||'')} defaultValue={g.phone||''} disabled={!!busy} onBlur={e=>{const value=e.target.value.trim()||null;if(value!==g.phone)void update(g.id,{phone:value})}} className="mt-1 block w-full rounded-lg border border-border-soft p-2 text-sm text-ink"/></label>
        <label className="text-xs text-muted">Dietary requirements<input maxLength={400} key={g.id+(g.dietary_notes||'')} defaultValue={g.dietary_notes||''} disabled={!!busy} onBlur={e=>{const value=e.target.value.trim()||null;if(value!==g.dietary_notes)void update(g.id,{dietary_notes:value})}} className="mt-1 block w-full rounded-lg border border-border-soft p-2 text-sm text-ink"/></label>
       </div>
       {!!events.length&&<div className="mt-4 border-t border-border-soft pt-3"><p className="mb-2 text-xs font-semibold text-plum">Invitations by event</p><div className="grid gap-2 sm:grid-cols-2">{events.map(ev=>{
        const status=invites.find(i=>i.guest_id===g.id&&i.event_id===ev.id)?.rsvp_status||'none'
        return <label key={ev.id} className="text-xs text-muted">{eventName(ev)}
         <select aria-label={eventName(ev)+' invitation for '+g.name} value={status} disabled={!!busy} onChange={e=>setInvitation(g.id,ev.id,e.target.value)} className="mt-1 block w-full rounded-lg border border-border-soft p-2 text-sm text-ink"><option value="none">Not on this event list</option>{statuses.map(x=><option value={x.value} key={x.value}>{x.label}</option>)}</select>
        </label>})}</div></div>}
       {!!events.length&&<div className="mt-4 rounded-xl border border-primary/20 bg-primary-soft/20 p-3">
        <p className="text-xs font-semibold text-plum">Guest RSVP link</p>
        <p className="mt-1 text-xs text-muted">Add this guest to at least one event above, then generate a private link. Guests can respond without an account. Send the link personally; PlanWedly does not send emails.</p>
        <div className="mt-3 flex flex-wrap gap-2">
         <button type="button" disabled={!!busy||!invites.some(i=>i.guest_id===g.id)} onClick={()=>createRsvpLink(g.id)} className="rounded-lg border border-primary px-3 py-2 text-xs font-medium text-primary disabled:opacity-40">{links[g.id]?'Show / refresh RSVP link':'Create RSVP link'}</button>
         {links[g.id]&&<button type="button" onClick={()=>copyRsvpLink(g.id)} className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white">Copy RSVP link</button>}
         <button type="button" disabled={!!busy} onClick={()=>revokeRsvpLink(g.id)} className="rounded-lg border border-border-soft px-3 py-2 text-xs text-muted">Revoke old link</button>
        </div>
        {links[g.id]&&<input readOnly aria-label={'RSVP link for '+g.name} onFocus={e=>e.target.select()} value={links[g.id]} className="mt-3 w-full rounded-lg border border-border-soft bg-white p-2 text-xs text-ink"/>}
       </div>}
       <label className="mt-3 block text-xs text-muted">Notes<textarea rows={2} maxLength={2000} key={g.id+(g.notes||'')} defaultValue={g.notes||''} disabled={!!busy} onBlur={e=>{const value=e.target.value.trim()||null;if(value!==g.notes)void update(g.id,{notes:value})}} className="mt-1 block w-full resize-y rounded-lg border border-border-soft p-2 text-sm text-ink"/></label>
      </div>)}</div>
    </section>)}</div>}
  <p className="mt-6 text-xs text-muted">One entry can represent one person or a household of several people. Event invitation statuses are tracked separately from the overall RSVP. Guests can reply through personal links when you send them. PlanWedly does not send invitation emails automatically.</p>
 </div></main><Footer/></>
}
