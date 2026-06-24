import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Card from '@/components/ui/Card'

export const metadata = { title: 'My Inquiries' }

export default async function InquiriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: inquiries } = await supabase
    .from('inquiries')
    .select('*, vendor:vendors(name, slug, city)')
    .eq('couple_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-[family-name:var(--font-heading)] text-2xl text-charcoal flex items-center gap-2 mb-6">
            <MessageSquare className="h-6 w-6 text-rose-gold" />
            My Inquiries
          </h1>

          {inquiries && inquiries.length > 0 ? (
            <div className="space-y-4">
              {inquiries.map((inq) => {
                const vendor = inq.vendor as { name: string; slug: string; city: string } | null
                return (
                  <Card key={inq.id} className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        {vendor && (
                          <Link
                            href={`/vendor/${vendor.slug}`}
                            className="font-[family-name:var(--font-heading)] text-base text-charcoal hover:text-rose-gold transition-colors"
                          >
                            {vendor.name}
                          </Link>
                        )}
                        <p className="text-xs text-charcoal/40 mt-0.5">
                          {vendor?.city} &middot;{' '}
                          {new Date(inq.created_at).toLocaleDateString('en-CA', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          inq.status === 'pending'
                            ? 'bg-peach-light text-peach-dark'
                            : inq.status === 'replied'
                              ? 'bg-sage/20 text-sage-dark'
                              : inq.status === 'read'
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {inq.status}
                      </span>
                    </div>
                    <p className="text-sm text-charcoal/70">{inq.message}</p>
                    <div className="flex gap-4 mt-3 text-xs text-charcoal/40">
                      {inq.event_date && (
                        <span>
                          Event:{' '}
                          {new Date(inq.event_date).toLocaleDateString('en-CA', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                      {inq.guest_count && <span>{inq.guest_count} guests</span>}
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <MessageSquare className="h-8 w-8 text-peach mx-auto mb-3" />
              <p className="text-sm text-charcoal/50 mb-4">
                No inquiries yet. Find a vendor and send them a message!
              </p>
              <Link
                href="/vendors"
                className="text-sm text-rose-gold hover:text-rose-gold-dark font-medium"
              >
                Browse Vendors
              </Link>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
