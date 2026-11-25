'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CalendarDays, Check, Clock3, ListChecks, Plus, Trash2 } from 'lucide-react'
import posthog from 'posthog-js'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { EVENT_TYPES } from '@/lib/constants'
import type { EventType } from '@/lib/types/database'

type Priority = 'high' | 'normal' | 'low'
type Task = {
  id: string
  title: string
  is_completed: boolean
  due_date: string | null
  sort_order: number
  priority: Priority
  event_id: string | null
}
type WeddingEvent = {
  id: string
  event_type: EventType
  custom_label: string | null
  event_date: string | null
}
type View = 'all' | 'urgent' | 'upcoming' | 'later' | 'completed'

const todayLocal = () => {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-')
}
const addDays = (date: string, count: number) => {
  const d = new Date(date + 'T12:00:00')
  d.setDate(d.getDate()+count)
  return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-')
}
const formatDate = (date: string) => new Date(date+'T12:00:00').toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'})

const eventLabel = (event: WeddingEvent) => event.custom_label?.trim() ||
  EVENT_TYPES.find(type=>type.value===event.event_type)?.label ||
  event.event_type.replaceAll('_',' ')

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [events, setEvents] = useState<WeddingEvent[]>([])
  const [weddingId, setWeddingId] = useState<string | null>(null)
  const [newTask, setNewTask] = useState('')
  const [newPriority, setNewPriority] = useState<Priority>('normal')
  const [newDueDate, setNewDueDate] = useState('')
  const [newEventId, setNewEventId] = useState('')
  const [activeView, setActiveView] = useState<View>('all')
  const [eventFilter, setEventFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      const supabase = createClient()
      const {data:{user}} = await supabase.auth.getUser()
      if (!active) return
      if (!user) { setError('Sign in to manage your wedding checklist.'); setLoading(false); return }
      const {data:wedding, error:weddingError} = await supabase.from('weddings').select('id').limit(1).maybeSingle()
      if (!active) return
      if(weddingError || !wedding) {setError(weddingError?.message || 'Set up a wedding before managing tasks.');setLoading(false);return}
      setWeddingId(wedding.id)
      const [taskResult,eventResult] = await Promise.all([
        supabase.from('tasks').select('id,title,is_completed,due_date,sort_order,priority,event_id').eq('wedding_id',wedding.id).order('sort_order'),
        supabase.from('wedding_events').select('id,event_type,custom_label,event_date').eq('wedding_id',wedding.id).order('sort_order')
      ])
      if (!active) return
      if (taskResult.error || eventResult.error) setError(taskResult.error?.message || eventResult.error?.message || 'Unable to load checklist.')
      else {setTasks(taskResult.data ?? []);setEvents(eventResult.data ?? [])}
      setLoading(false)
    }
    void load()
    return ()=>{active=false}
  }, [])

  const today=todayLocal()
  const soon=addDays(today,14)
  const groupFor = (task:Task):View => {
    if(task.is_completed)return 'completed'
    if(task.due_date && task.due_date < today)return 'urgent'
    if(task.due_date && task.due_date <= soon)return 'upcoming'
    return 'later'
  }
  const eventName=(id:string|null)=>events.find(event=>event.id===id)
  const counts = useMemo(()=>{
    const result:Record<View,number>={all:tasks.length,urgent:0,upcoming:0,later:0,completed:0}
    for(const task of tasks) result[groupFor(task)]++
    return result
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[tasks,today,soon])
  const filtered=useMemo(()=>{
    const list=tasks.filter(task=>(activeView==='all'||groupFor(task)===activeView) && (!eventFilter || (eventFilter==='general'?!task.event_id:task.event_id===eventFilter)))
    const priorityRank:Record<Priority,number>={high:0,normal:1,low:2}
    return list.sort((a,b)=> {
      const rank:Record<View,number>={urgent:0,upcoming:1,later:2,completed:3,all:4}
      return rank[groupFor(a)]-rank[groupFor(b)] ||
        (a.due_date??'9999').localeCompare(b.due_date??'9999') ||
        priorityRank[a.priority]-priorityRank[b.priority] || a.sort_order-b.sort_order
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[tasks,activeView,eventFilter,today,soon])
  const completed=tasks.filter(task=>task.is_completed).length

  async function addTask(e:React.FormEvent) {
    e.preventDefault()
    if(!newTask.trim()||!weddingId||busy)return
    setBusy(true);setError('');setNotice('')
    const {data,error:writeError}=await createClient().from('tasks').insert({
      wedding_id:weddingId,title:newTask.trim(),priority:newPriority,
      due_date:newDueDate || null,event_id:newEventId || null,sort_order:tasks.length
    }).select('id,title,is_completed,due_date,sort_order,priority,event_id').single()
    if(writeError)setError('Could not add task: '+writeError.message)
    else if(data){setTasks(previous=>[...previous,data]);setNewTask('');setNewDueDate('');setNewPriority('normal');setNewEventId('');posthog.capture('task_created')}
    setBusy(false)
  }

  async function changeTask(id:string,patch:Partial<Pick<Task,'title'|'is_completed'|'due_date'|'priority'|'event_id'>>) {
    if(busy || !weddingId)return
    setBusy(true);setError('');setNotice('')
    const {data,error:writeError}=await createClient().from('tasks').update(patch).eq('id',id).eq('wedding_id',weddingId)
      .select('id,title,is_completed,due_date,sort_order,priority,event_id').single()
    if(writeError)setError('Could not update task: '+writeError.message)
    else if(data){setTasks(previous=>previous.map(task=>task.id===id?data:task));if('is_completed' in patch)posthog.capture('task_completion_toggled',{is_completed:data.is_completed})}
    setBusy(false)
  }

  async function deleteTask(id:string) {
    if(busy || !weddingId || !window.confirm('Delete this task?'))return
    setBusy(true);setError('')
    const {error:writeError}=await createClient().from('tasks').delete().eq('id',id).eq('wedding_id',weddingId)
    if(writeError)setError('Could not delete task: '+writeError.message)
    else {setTasks(previous=>previous.filter(task=>task.id!==id));posthog.capture('task_deleted')}
    setBusy(false)
  }

  const tabs: {value:View;label:string}[]=[
    {value:'all',label:'All'},{value:'urgent',label:'Overdue'},
    {value:'upcoming',label:'Next 14 days'},{value:'later',label:'Later / unscheduled'},
    {value:'completed',label:'Done'}
  ]

  return <><Navbar/><main className="flex-1 bg-ivory">
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-sm text-primary hover:underline">← Wedding dashboard</Link>
          <h1 className="mt-2 flex items-center gap-2 font-[family-name:var(--font-heading)] text-3xl text-plum sm:text-4xl"><ListChecks className="h-7 w-7 text-primary"/>Wedding checklist</h1>
          <p className="mt-2 text-sm text-muted">Plan your next steps together. Due dates and priorities are editable suggestions, not requirements.</p>
        </div>
        <span className="rounded-full bg-primary-soft/60 px-4 py-2 text-sm text-plum">{completed} of {tasks.length} done</span>
      </div>
      <Card className="mb-6 p-5">
        <div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium text-ink">Planning progress</span><span className="text-muted">{tasks.length ? Math.round(100*completed/tasks.length):0}%</span></div>
        <div className="h-2.5 overflow-hidden rounded-full bg-primary-soft"><div className="h-full rounded-full bg-primary transition-all" style={{width:(tasks.length?100*completed/tasks.length:0)+'%'}}/></div>
      </Card>
      <Card className="mb-6 p-5">
        <h2 className="mb-4 text-base font-semibold text-plum">Add a task</h2>
        <form onSubmit={addTask} className="space-y-3">
          <label className="block text-xs font-medium text-muted">Task name<input required maxLength={240} value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="e.g. Contact reception venues" className="mt-1 w-full rounded-xl border border-border-soft bg-white px-3 py-3 text-sm text-ink focus:outline-primary"/></label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-xs font-medium text-muted">Due date (optional)<input type="date" value={newDueDate} onChange={e=>setNewDueDate(e.target.value)} className="mt-1 w-full rounded-xl border border-border-soft bg-white px-3 py-3 text-sm text-ink"/></label>
            <label className="block text-xs font-medium text-muted">Priority<select value={newPriority} onChange={e=>setNewPriority(e.target.value as Priority)} className="mt-1 w-full rounded-xl border border-border-soft bg-white px-3 py-3 text-sm text-ink"><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select></label>
            <label className="block text-xs font-medium text-muted">Event<select value={newEventId} onChange={e=>setNewEventId(e.target.value)} className="mt-1 w-full rounded-xl border border-border-soft bg-white px-3 py-3 text-sm text-ink"><option value="">General wedding</option>{events.map(event=><option key={event.id} value={event.id}>{eventLabel(event)}</option>)}</select></label>
          </div>
          <Button type="submit" disabled={busy || !weddingId || !newTask.trim()}><Plus className="h-4 w-4"/> Add task</Button>
        </form>
      </Card>
      {error&&<p role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice&&<p role="status" className="mb-5 rounded-xl bg-primary-soft px-4 py-3 text-sm text-plum">{notice}</p>}
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map(tab=><button key={tab.value} type="button" onClick={()=>setActiveView(tab.value)} aria-pressed={activeView===tab.value} className={'rounded-full border px-3 py-2 text-xs font-medium transition-colors '+(activeView===tab.value?'border-primary bg-primary text-white':'border-border-soft bg-white text-ink hover:border-primary')}>{tab.label} ({counts[tab.value]})</button>)}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm text-muted">Show event <select value={eventFilter} onChange={e=>setEventFilter(e.target.value)} className="ml-2 rounded-lg border border-border-soft bg-white px-3 py-2 text-ink"><option value="">All events</option><option value="general">General wedding</option>{events.map(event=><option key={event.id} value={event.id}>{eventLabel(event)}</option>)}</select></label>
        <span className="text-xs text-muted">{filtered.length} matching tasks</span>
      </div>
      {loading?<Card className="p-8 text-center text-muted">Loading your checklist…</Card>:
      filtered.length===0?<Card className="p-8 text-center text-muted">{tasks.length===0?'No tasks yet. Add your first task above.':'Nothing in this view — try another filter.'}</Card>:
      <div className="space-y-3">
        {filtered.map(task=>{
          const group=groupFor(task)
          const label=eventName(task.event_id)
          return <Card key={task.id} className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <button type="button" disabled={busy} aria-label={task.is_completed?'Mark incomplete':'Mark complete'} onClick={()=>changeTask(task.id,{is_completed:!task.is_completed})} className={'mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 '+(task.is_completed?'border-primary bg-primary text-white':'border-border-soft bg-white hover:border-primary')}>{task.is_completed&&<Check className="h-4 w-4"/>}</button>
              <div className="min-w-0 flex-1">
                <input aria-label="Task title" maxLength={240} defaultValue={task.title} key={task.id+task.title} disabled={busy} onBlur={e=>{const next=e.target.value.trim();if(next&&next!==task.title)void changeTask(task.id,{title:next});else if(!next)e.target.value=task.title}} className={'w-full bg-transparent text-sm font-medium focus:outline-primary '+(task.is_completed?'text-muted line-through':'text-ink')}/>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  {group==='urgent'?<span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-red-700"><AlertCircle className="h-3 w-3"/>Overdue</span>:group==='upcoming'?<span className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-1 text-plum"><Clock3 className="h-3 w-3"/>Due soon</span>:null}
                  {label&&<span className="rounded-md bg-primary-soft/40 px-2 py-1 text-plum">{eventLabel(label)}</span>}
                  {task.priority==='high'&&<span className="rounded-md border border-primary/30 px-2 py-1 text-primary">High priority</span>}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <label className="text-xs text-muted"><span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3"/>Due date</span><input aria-label={'Due date for '+task.title} type="date" defaultValue={task.due_date??''} key={task.id+'date'+task.due_date} disabled={busy} onChange={e=>changeTask(task.id,{due_date:e.target.value||null})} className="mt-1 block w-full rounded-lg border border-border-soft bg-white px-2 py-2 text-xs text-ink"/></label>
                  <label className="text-xs text-muted">Priority<select aria-label={'Priority for '+task.title} value={task.priority} disabled={busy} onChange={e=>changeTask(task.id,{priority:e.target.value as Priority})} className="mt-1 block w-full rounded-lg border border-border-soft bg-white px-2 py-2 text-xs text-ink"><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select></label>
                  <label className="text-xs text-muted">Event<select aria-label={'Event for '+task.title} value={task.event_id??''} disabled={busy} onChange={e=>changeTask(task.id,{event_id:e.target.value||null})} className="mt-1 block w-full rounded-lg border border-border-soft bg-white px-2 py-2 text-xs text-ink"><option value="">General wedding</option>{events.map(event=><option key={event.id} value={event.id}>{eventLabel(event)}</option>)}</select></label>
                </div>
              </div>
              <button type="button" disabled={busy} onClick={()=>deleteTask(task.id)} aria-label={'Delete '+task.title} className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-40"><Trash2 className="h-4 w-4"/></button>
            </div>
          </Card>
        })}
      </div>}
      <p className="mt-6 text-xs text-muted">Edits are saved to your shared wedding. Your partner will see the updates when they refresh.</p>
    </div>
  </main><Footer/></>
}
