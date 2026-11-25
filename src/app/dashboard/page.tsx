import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Heart,
  Calendar,
  DollarSign,
  Bookmark,
  MessageSquare,
  CheckSquare,
  Users,
  Sparkles,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  ListChecks,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Card from '@/components/ui/Card'
import { daysUntil, formatCurrency } from '@/lib/utils'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')
  const { data: isStaff } = await supabase.rpc('is_admin')
  if (isStaff) redirect('/admin')

  const { data: wedding } = await supabase
    .from('weddings')
    .select('*')
        .maybeSingle()

  if (!wedding) redirect('/onboarding')

  const [
    { data: budgetData },
    { data: commitments },
    { data: events },
    { data: savedVendors },
    { data: inquiries },
    { data: tasks },
    { data: members },
    { data: guests },
  ] = await Promise.all([
    supabase.from('budget_categories').select('*').eq('wedding_id', wedding.id),
    supabase.from('budget_commitments').select('category_id,paid_amount,total_amount,due_date').eq('wedding_id',wedding.id),
    supabase.from('wedding_events').select('*').eq('wedding_id', wedding.id).order('sort_order'),
    supabase.from('wedding_vendor_shortlist').select('vendor_id,stage').eq('wedding_id', wedding.id),
    supabase.from('inquiries').select('*, vendor:vendors(name, slug)').eq('couple_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('tasks').select('*').eq('wedding_id', wedding.id).order('sort_order'),
    supabase.from('wedding_members').select('user_id,role').eq('wedding_id', wedding.id),
    supabase.from('guest_list').select('party_size').eq('wedding_id', wedding.id),
  ])

  const countdown = daysUntil(wedding.wedding_date)
  const totalBudget = budgetData?.filter(b=>b.is_enabled).reduce((sum, b) => sum + Number(b.budgeted), 0) ?? 0
  const trackedPaid = (commitments??[]).filter(c=>budgetData?.some(b=>b.id===c.category_id && b.is_enabled)).reduce((sum,c)=>sum+Number(c.paid_amount),0)
  const totalSpent = (budgetData?.filter(b=>b.is_enabled).reduce((sum,b)=>sum+Number(b.spent),0)??0)+trackedPaid
  const trackedOwed = (commitments??[]).filter(c=>budgetData?.some(b=>b.id===c.category_id && b.is_enabled)).reduce((sum,c)=>sum+Math.max(Number(c.total_amount)-Number(c.paid_amount),0),0)
  const completedTasks = tasks?.filter((t) => t.is_completed).length ?? 0
  const totalTasks = tasks?.length ?? 0
  const pendingTasks = (tasks ?? []).filter(task => !task.is_completed)
  const partnerJoined = (members ?? []).some(member => member.role === 'partner')
  const guestCount = (guests ?? []).reduce((sum, guest) => sum + Number(guest.party_size || 1), 0)
  const weddingTypeLabel = wedding.wedding_type === 'hindu' ? 'Hindu wedding' : wedding.wedding_type === 'christian_catholic' ? 'Christian / Catholic wedding' : 'Interfaith wedding'
  const budgetPercent = totalBudget > 0 ? Math.round(totalSpent / totalBudget * 100) : 0
  const nextSteps = [
    ...(!partnerJoined ? [{href:'/wedding/partner', title:'Invite your partner', detail:'Plan together with shared tasks, events and budget.'}] : []),
    ...(!wedding.wedding_date ? [{href:'/events',title:'Start planning your dates',detail:'You can add event dates even if the main wedding date is undecided.'}] : []),
    ...(events?.length ? [] : [{href:'/events',title:'Choose your wedding events',detail:'Set up the celebrations that matter to you.'}]),
    ...(totalBudget <= 0 ? [{href:'/budget',title:'Set a starting budget',detail:'Estimates are editable as your plans evolve.'}] : []),
    ...(pendingTasks.length ? [{href:'/tasks',title:pendingTasks[0].title,detail:`${pendingTasks.length} tasks remaining in your checklist.`}] : [{href:'/tasks',title:'Review your wedding checklist',detail:'Add the next decisions you need to make.'}]),
  ].slice(0,4)

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl text-plum">
              {wedding.partner1_name} & {wedding.partner2_name}
            </h1>
            <p className="text-xs uppercase tracking-wide font-medium text-primary mt-2">{weddingTypeLabel}</p>
            <p className="text-muted text-sm mt-1">
              {wedding.wedding_date
                ? `Wedding on ${new Date(wedding.wedding_date + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
                : 'No date set yet'}
            </p>
          </div>

          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <Link href="/wedding/partner" className="inline-flex items-center gap-2 rounded-xl border border-primary/30 px-4 py-2 text-sm font-medium text-primary hover:bg-primary-soft/30">
              <Users className="h-4 w-4" />
              {partnerJoined ? 'Partner connected — manage sharing' : 'Invite your partner to plan together'}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="text-xs text-muted">{partnerJoined ? 'Your planning workspace is shared.' : 'You can invite your partner now or later.'}</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {countdown !== null && countdown > 0 && (
              <Card className="p-5 text-center">
                <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-ink">{countdown}</p>
                <p className="text-xs text-muted">days to go</p>
              </Card>
            )}
            <Card className="p-5 text-center">
              <DollarSign className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-lg font-bold text-ink">{formatCurrency(totalSpent)}</p>
              <p className="text-xs text-muted">of {formatCurrency(totalBudget)} budget</p>
            </Card>
            <Card className="p-5 text-center">
              <Users className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-ink">{guestCount}</p>
              <p className="text-xs text-muted">guests planned</p>
            </Card>
            <Card className="p-5 text-center">
              <CheckSquare className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-ink">
                {completedTasks}/{totalTasks}
              </p>
              <p className="text-xs text-muted">tasks done</p>
            </Card>
          </div>

          {/* A clear next-action list based on the couple's actual progress. */}
          <Card className="mb-8 p-6 border-primary/20">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-[family-name:var(--font-heading)] text-xl text-plum flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Your next steps
              </h2>
              <span className="text-xs text-muted">{completedTasks}/{totalTasks} checklist tasks done</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {nextSteps.map((item, index) => (
                <Link key={item.title} href={item.href} className="group rounded-xl border border-border-soft bg-ivory/60 p-4 hover:border-primary/40 transition-colors">
                  <div className="flex justify-between items-start gap-2">
                    <div><p className="text-xs font-semibold text-primary mb-1">STEP {index + 1}</p>
                      <p className="text-sm font-semibold text-ink group-hover:text-plum">{item.title}</p>
                      <p className="text-xs text-muted mt-1">{item.detail}</p></div>
                    <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          {totalBudget > 0 && (
            <div className="mb-8 rounded-xl border border-border-soft p-4 bg-white">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-ink font-medium">Overall budget used</span>
                <span className="text-muted">{budgetPercent}% · {formatCurrency(totalSpent)} of {formatCurrency(totalBudget)}</span>
              </div>
              <div className="h-2 rounded-full bg-primary-soft overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{width:`${Math.min(budgetPercent,100)}%`}} />
              </div>
              {trackedOwed>0&&<p className="mt-2 text-xs text-muted">{formatCurrency(trackedOwed)} still owed on recorded costs.</p>}
              {totalSpent>totalBudget && <p className="text-xs text-amber-700 mt-2 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Spending is above your current budget.</p>}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Events */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-[family-name:var(--font-heading)] text-lg text-ink flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Wedding Events
                </h2>
                <Link href="/events" className="text-xs text-primary hover:text-plum flex items-center gap-1">
                  Manage <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {events && events.length > 0 ? (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center justify-between py-2 border-b border-border-soft last:border-0">
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {event.custom_label || event.event_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </p>
                        {event.venue_name && <p className="text-xs text-muted">{event.venue_name}</p>}
                      </div>
                      <span className="text-xs text-muted">
                        {event.event_date ? new Date(event.event_date + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : 'No date'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No events planned yet</p>
              )}
            </Card>

            {/* Budget Summary */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-[family-name:var(--font-heading)] text-lg text-ink flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Budget
                </h2>
                <Link href="/budget" className="text-xs text-primary hover:text-plum flex items-center gap-1">
                  Details <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {budgetData && budgetData.length > 0 ? (
                <div className="space-y-3">
                  {budgetData.filter((b) => b.is_enabled).slice(0, 5).map((b) => (
                    <div key={b.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-ink capitalize">{b.category.replace(/_/g, ' ')}</span>
                        <span className="text-muted">
                          {formatCurrency(Number(b.spent) + (commitments??[]).filter(c=>c.category_id===b.id).reduce((sum,c)=>sum+Number(c.paid_amount),0))} / {formatCurrency(Number(b.budgeted))}
                        </span>
                      </div>
                      <div className="h-1.5 bg-primary-soft rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: `${Number(b.budgeted) > 0 ? Math.min(((Number(b.spent)+(commitments??[]).filter(c=>c.category_id===b.id).reduce((sum,c)=>sum+Number(c.paid_amount),0)) / Number(b.budgeted)) * 100, 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No budget set up yet</p>
              )}
            </Card>

            {/* Tasks */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-[family-name:var(--font-heading)] text-lg text-ink flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-primary" />
                  Tasks
                </h2>
                <Link href="/tasks" className="text-xs text-primary hover:text-plum flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {tasks && tasks.length > 0 ? (
                <div className="space-y-2">
                  {[...pendingTasks, ...(tasks ?? []).filter(task => task.is_completed)].slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center gap-3 py-1.5">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${task.is_completed ? 'border-primary bg-primary' : 'border-border-soft'}`}>
                        {task.is_completed && <Heart className="h-2.5 w-2.5 text-white" fill="currentColor" />}
                      </div>
                      <span className={`text-sm ${task.is_completed ? 'text-muted line-through' : 'text-ink'}`}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">No tasks yet. Add some to stay organized!</p>
              )}
            </Card>

            {/* Recent Inquiries */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-[family-name:var(--font-heading)] text-lg text-ink flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Recent Inquiries
                </h2>
                <Link href="/inquiries" className="text-xs text-primary hover:text-plum flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {inquiries && inquiries.length > 0 ? (
                <div className="space-y-3">
                  {inquiries.map((inq) => (
                    <div key={inq.id} className="flex items-center justify-between py-2 border-b border-border-soft last:border-0">
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {(inq.vendor as { name: string; slug: string })?.name}
                        </p>
                        <p className="text-xs text-muted truncate max-w-[200px]">{inq.message}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        inq.status === 'pending'
                          ? 'bg-primary-soft text-primary'
                          : inq.status === 'replied'
                            ? 'bg-primary-soft text-plum'
                            : 'bg-primary-soft/60 text-muted'
                      }`}>
                        {inq.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">
                  No inquiries yet.{' '}
                  <Link href="/vendors" className="text-primary">
                    Browse vendors
                  </Link>
                </p>
              )}
            </Card>
          </div>

          {/* Quick Links */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/tasks', label: 'Checklist', icon: CheckSquare },
              { href: '/vendors', label: 'Browse Vendors', icon: Heart },
              { href: '/saved', label: 'Vendor Shortlist', icon: Bookmark },
              { href: '/budget', label: 'Budget', icon: DollarSign },
              { href: '/events', label: 'Events', icon: CalendarDays },
              { href: '/guests', label: 'Guest List', icon: Users },
              { href: '/plans', label: 'Plan Templates', icon: Sparkles },
              { href: '/wedding/partner', label: 'Plan Together', icon: Users },
            ].map((link) => (
              <Link key={link.href} href={link.href}>
                <Card className="p-4 text-center" hover>
                  <link.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-xs font-medium text-ink">{link.label}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
