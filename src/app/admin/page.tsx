import Link from 'next/link'
import { Shield, Store, Tag, MessageSquare, ClipboardCheck, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { billingAdmin } from '@/lib/billing/stripe'
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
    { count: pendingClaims },
    { count: pendingListingRequests },
  ] = await Promise.all([
    supabase.from('vendors').select('*', { count: 'exact', head: true }),
    supabase.from('vendor_categories').select('*', { count: 'exact', head: true }),
    supabase.from('inquiries').select('*', { count: 'exact', head: true }),
    supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('vendor_claims').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('vendor_listing_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  // Review submissions are deliberately not readable with the regular
  // Supabase session. Count pending reviews using the server-only role, and
  // only after verifying staff authorization.
  const { data: isStaff, error: staffError } = await supabase.rpc('is_admin')
  let pendingReviewCount = 0
  let pendingReportCount = 0
  if (!staffError && isStaff === true) {
    const { count, error } = await billingAdmin().from('reviews')
      .select('id', { count: 'exact', head: true }).eq('moderation_status', 'pending')
    if (error) console.error('Could not load pending review count:', error.message)
    else pendingReviewCount = count ?? 0
    const {count: reports, error:reportError}=await billingAdmin().from('review_reports').select('id',{count:'exact',head:true}).eq('status','pending')
    if(reportError)console.error('Could not load review report count:',reportError.code)
    else pendingReportCount=reports??0
  }

  const adminLinks = [
    {
      href: '/admin/listing-requests',
      label: 'New Business Reviews',
      description: 'Review new vendor listing submissions',
      icon: Building2,
      count: pendingListingRequests ?? 0,
    },
    {
      href: '/admin/claims',
      label: 'Vendor Claims',
      description: 'Verify and approve business ownership',
      icon: ClipboardCheck,
      count: pendingClaims ?? 0,
    },
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
      href: '/admin/reviews',
      label: 'Customer Reviews',
      description: `${pendingReviewCount} awaiting moderation`,
      icon: ClipboardCheck,
      count: pendingReviewCount,
    },
    {
      href: '/admin/review-reports',
      label: 'Review Disputes',
      description: 'Investigate reported customer reviews',
      icon: ClipboardCheck,
      count: pendingReportCount,
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
