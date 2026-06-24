import { redirect } from 'next/navigation'
import { Bookmark } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import VendorCard from '@/components/vendors/VendorCard'
import Card from '@/components/ui/Card'
import Link from 'next/link'

export const metadata = { title: 'Saved Vendors' }

export default async function SavedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: saved } = await supabase
    .from('saved_vendors')
    .select('*, vendor:vendors(*)')
    .eq('couple_id', user.id)
    .order('created_at', { ascending: false })

  const vendors = saved?.map(s => s.vendor).filter(Boolean) ?? []

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-[family-name:var(--font-heading)] text-2xl text-charcoal flex items-center gap-2 mb-6">
            <Bookmark className="h-6 w-6 text-rose-gold" />
            Saved Vendors
          </h1>

          {vendors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor) => (
                <VendorCard
                  key={(vendor as { id: string }).id}
                  vendor={vendor as { slug: string; name: string; description: string | null; city: string; area: string | null; pricing_range: string | null; is_featured: boolean }}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Bookmark className="h-8 w-8 text-peach mx-auto mb-3" />
              <p className="text-sm text-charcoal/50 mb-4">
                No saved vendors yet. Browse vendors to find the perfect match!
              </p>
              <Link
                href="/vendors"
                className="inline-flex items-center gap-2 text-sm text-rose-gold hover:text-rose-gold-dark font-medium"
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
