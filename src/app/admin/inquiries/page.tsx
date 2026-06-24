import Link from 'next/link'
import { MessageSquare, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'

export const metadata = { title: 'All Inquiries — Admin' }

export default async function AdminInquiriesPage() {
  const supabase = await createClient()

  const { data: inquiries } = await supabase
    .from('inquiries')
    .select('*, vendor:vendors(name, slug), couple:profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-sm text-charcoal/50 hover:text-charcoal mb-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Admin
          </Link>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl text-charcoal flex items-center gap-2 mb-6">
            <MessageSquare className="h-6 w-6 text-rose-gold" />
            All Inquiries
          </h1>

          <p className="text-sm text-charcoal/50 mb-4">
            {inquiries?.length ?? 0} inquiries
          </p>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-peach-light bg-peach-light/20">
                    <th className="text-left py-3 px-4 font-medium text-charcoal/70">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-charcoal/70">Couple</th>
                    <th className="text-left py-3 px-4 font-medium text-charcoal/70">Vendor</th>
                    <th className="text-left py-3 px-4 font-medium text-charcoal/70">Message</th>
                    <th className="text-left py-3 px-4 font-medium text-charcoal/70">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-peach-light/50">
                  {inquiries?.map((inq) => {
                    const vendor = inq.vendor as { name: string; slug: string } | null
                    const couple = inq.couple as { full_name: string | null; email: string } | null
                    return (
                      <tr key={inq.id} className="hover:bg-peach-light/10">
                        <td className="py-3 px-4 text-charcoal/50 whitespace-nowrap">
                          {new Date(inq.created_at).toLocaleDateString('en-CA', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-charcoal">{couple?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-charcoal/40">{couple?.email}</p>
                        </td>
                        <td className="py-3 px-4">
                          {vendor && (
                            <Link
                              href={`/vendor/${vendor.slug}`}
                              className="text-charcoal hover:text-rose-gold"
                            >
                              {vendor.name}
                            </Link>
                          )}
                        </td>
                        <td className="py-3 px-4 text-charcoal/60 max-w-xs truncate">
                          {inq.message}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
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
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </>
  )
}
