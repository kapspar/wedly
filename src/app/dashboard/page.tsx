import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Heart,
  Calendar,
  DollarSign,
  Bookmark,
  MessageSquare,
  CheckSquare,
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

  const { data: wedding } = await supabase
    .from('weddings')
    .select('*')
    .eq('couple_id', user.id)
    .single()

  if (!wedding) redirect('/onboarding')

  const [
    { data: budgetData },
    { data: events },
    { data: savedVendors },
    { data: inquiries },
    { data: tasks },
  ] = await Promise.all([
    supabase.from('budget_categories').select('*').eq('wedding_id', wedding.id),
    supabase.from('wedding_events').select('*').eq('wedding_id', wedding.id).order('sort_order'),
    supabase.from('saved_vendors').select('*, vendor:vendors(name, slug, city)').eq('couple_id', user.id),
    supabase.from('inquiries').select('*, vendor:vendors(name, slug)').eq('couple_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('tasks').select('*').eq('wedding_id', wedding.id).order('sort_order'),
  ])

  const countdown = daysUntil(wedding.wedding_date)
  const totalBudget = budgetData?.reduce((sum, b) => sum + Number(b.budgeted), 0) ?? 0
  const totalSpent = budgetData?.reduce((sum, b) => sum + Number(b.spent), 0) ?? 0
  const completedTasks = tasks?.filter((t) => t.is_completed).length ?? 0
  const totalTasks = tasks?.length ?? 0

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl text-charcoal">
              {wedding.partner1_name} & {wedding.partner2_name}
            </h1>
            <p className="text-charcoal/60 text-sm mt-1">
              {wedding.wedding_date
                ? `Wedding on ${new Date(wedding.wedding_date).toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
                : wedding.seeking_auspicious_date
                  ? 'Looking for an auspicious date'
                  : 'No date set yet'}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {countdown !== null && countdown > 0 && (
              <Card className="p-5 text-center">
                <Calendar className="h-6 w-6 text-rose-gold mx-auto mb-2" />
                <p className="text-2xl font-bold text-charcoal">{countdown}</p>
                <p className="text-xs text-charcoal/50">days to go</p>
              </Card>
            )}
            <Card className="p-5 text-center">
              <DollarSign className="h-6 w-6 text-sage mx-auto mb-2" />
              <p className="text-lg font-bold text-charcoal">{formatCurrency(totalSpent)}</p>
              <p className="text-xs text-charcoal/50">of {formatCurrency(totalBudget)} budget</p>
            </Card>
            <Card className="p-5 text-center">
              <Bookmark className="h-6 w-6 text-peach-dark mx-auto mb-2" />
              <p className="text-2xl font-bold text-charcoal">{savedVendors?.length ?? 0}</p>
              <p className="text-xs text-charcoal/50">saved vendors</p>
            </Card>
            <Card className="p-5 text-center">
              <CheckSquare className="h-6 w-6 text-sage mx-auto mb-2" />
              <p className="text-2xl font-bold text-charcoal">
                {completedTasks}/{totalTasks}
              </p>
              <p className="text-xs text-charcoal/50">tasks done</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Events */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-[family-name:var(--font-heading)] text-lg text-charcoal flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-rose-gold" />
                  Wedding Events
                </h2>
                <Link href="/events" className="text-xs text-rose-gold hover:text-rose-gold-dark flex items-center gap-1">
                  Manage <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {events && events.length > 0 ? (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center justify-between py-2 border-b border-peach-light/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-charcoal">
                          {event.custom_label || event.event_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </p>
                        {event.venue_name && <p className="text-xs text-charcoal/50">{event.venue_name}</p>}
                      </div>
                      <span className="text-xs text-charcoal/40">
                        {event.event_date ? new Date(event.event_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) : 'No date'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-charcoal/40">No events planned yet</p>
              )}
            </Card>

            {/* Budget Summary */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-[family-name:var(--font-heading)] text-lg text-charcoal flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-sage" />
                  Budget
                </h2>
                <Link href="/budget" className="text-xs text-rose-gold hover:text-rose-gold-dark flex items-center gap-1">
                  Details <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {budgetData && budgetData.length > 0 ? (
                <div className="space-y-3">
                  {budgetData.filter((b) => b.is_enabled).slice(0, 5).map((b) => (
                    <div key={b.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-charcoal capitalize">{b.category.replace(/_/g, ' ')}</span>
                        <span className="text-charcoal/60">
                          {formatCurrency(Number(b.spent))} / {formatCurrency(Number(b.budgeted))}
                        </span>
                      </div>
                      <div className="h-1.5 bg-peach-light rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sage rounded-full transition-all"
                          style={{
                            width: `${Math.min((Number(b.spent) / Number(b.budgeted)) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-charcoal/40">No budget set up yet</p>
              )}
            </Card>

            {/* Tasks */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-[family-name:var(--font-heading)] text-lg text-charcoal flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-peach-dark" />
                  Tasks
                </h2>
                <Link href="/tasks" className="text-xs text-rose-gold hover:text-rose-gold-dark flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {tasks && tasks.length > 0 ? (
                <div className="space-y-2">
                  {tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center gap-3 py-1.5">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${task.is_completed ? 'border-sage bg-sage' : 'border-peach-light'}`}>
                        {task.is_completed && <Heart className="h-2.5 w-2.5 text-white" fill="currentColor" />}
                      </div>
                      <span className={`text-sm ${task.is_completed ? 'text-charcoal/40 line-through' : 'text-charcoal'}`}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-charcoal/40">No tasks yet. Add some to stay organized!</p>
              )}
            </Card>

            {/* Recent Inquiries */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-[family-name:var(--font-heading)] text-lg text-charcoal flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-rose-gold" />
                  Recent Inquiries
                </h2>
                <Link href="/inquiries" className="text-xs text-rose-gold hover:text-rose-gold-dark flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {inquiries && inquiries.length > 0 ? (
                <div className="space-y-3">
                  {inquiries.map((inq) => (
                    <div key={inq.id} className="flex items-center justify-between py-2 border-b border-peach-light/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-charcoal">
                          {(inq.vendor as { name: string; slug: string })?.name}
                        </p>
                        <p className="text-xs text-charcoal/50 truncate max-w-[200px]">{inq.message}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        inq.status === 'pending'
                          ? 'bg-peach-light text-peach-dark'
                          : inq.status === 'replied'
                            ? 'bg-sage/20 text-sage-dark'
                            : 'bg-peach-light/50 text-charcoal/50'
                      }`}>
                        {inq.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-charcoal/40">
                  No inquiries yet.{' '}
                  <Link href="/vendors" className="text-rose-gold">
                    Browse vendors
                  </Link>
                </p>
              )}
            </Card>
          </div>

          {/* Quick Links */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/vendors', label: 'Browse Vendors', icon: Heart },
              { href: '/saved', label: 'Saved Vendors', icon: Bookmark },
              { href: '/budget', label: 'Budget', icon: DollarSign },
              { href: '/events', label: 'Events', icon: CalendarDays },
            ].map((link) => (
              <Link key={link.href} href={link.href}>
                <Card className="p-4 text-center" hover>
                  <link.icon className="h-5 w-5 text-rose-gold mx-auto mb-2" />
                  <p className="text-xs font-medium text-charcoal">{link.label}</p>
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
