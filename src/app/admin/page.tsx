import Link from 'next/link'
import { Shield, Store, Tag, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'

export const metadata = { title: 'Admin Dashboard' }

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: vendorCount },
    { count: categoryCount },
    { count: inquiryCount },
    { count: pendingInquiryCount },
  ] = await Promise.all([
    supabase.from('vendors').select('*', { count: 'exact', head: true }),
    supabase.from('vendor_categories').select('*', { count: 'exact', head: true }),
    supabase.from('inquiries').select('*', { count: 'exact', head: true }),
    supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const adminLinks = [
    {
      href: '/admin/vendors',
      label: 'Vendors',
      description: 'Manage vendor listings',
      icon: Store,
      count: vendorCount ?? 0,
    },
    {
      href: '/admin/categories',
      label: 'Categories',
      description: 'Manage vendor categories',
      icon: Tag,
      count: categoryCount ?? 0,
    },
    {
      href: '/admin/inquiries',
      label: 'Inquiries',
      description: `${pendingInquiryCount ?? 0} pending`,
      icon: MessageSquare,
      count: inquiryCount ?? 0,
    },
  ]

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-[family-name:var(--font-heading)] text-2xl text-charcoal flex items-center gap-2 mb-8">
            <Shield className="h-6 w-6 text-rose-gold" />
            Admin Dashboard
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {adminLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Card className="p-6" hover>
                  <link.icon className="h-8 w-8 text-rose-gold mb-3" />
                  <h2 className="font-[family-name:var(--font-heading)] text-lg text-charcoal">
                    {link.label}
                  </h2>
                  <p className="text-xs text-charcoal/50 mt-1">{link.description}</p>
                  <p className="text-2xl font-bold text-charcoal mt-3">{link.count}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
