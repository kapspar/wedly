import Link from 'next/link'
import { Tag, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'
import VendorCategoryIcon from '@/components/vendors/VendorCategoryIcon'

export const metadata = { title: 'Manage Categories — Admin' }

export default async function AdminCategoriesPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('vendor_categories')
    .select('*, vendors:vendors(count)')
    .order('display_order')

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-sm text-charcoal/50 hover:text-charcoal mb-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Admin
          </Link>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl text-charcoal flex items-center gap-2 mb-6">
            <Tag className="h-6 w-6 text-rose-gold" />
            Vendor Categories
          </h1>

          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-peach-light bg-peach-light/20">
                  <th className="text-left py-3 px-4 font-medium text-charcoal/70">Icon</th>
                  <th className="text-left py-3 px-4 font-medium text-charcoal/70">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-charcoal/70">Slug</th>
                  <th className="text-left py-3 px-4 font-medium text-charcoal/70">Vendors</th>
                  <th className="text-left py-3 px-4 font-medium text-charcoal/70">Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-peach-light/50">
                {categories?.map((cat) => (
                  <tr key={cat.id} className="hover:bg-peach-light/10">
                    <td className="py-3 px-4">
                      <div className="w-8 h-8 rounded-full bg-peach-light/50 flex items-center justify-center">
                        <VendorCategoryIcon icon={cat.icon} className="h-4 w-4 text-rose-gold" />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-charcoal">{cat.name}</td>
                    <td className="py-3 px-4 text-charcoal/50">{cat.slug}</td>
                    <td className="py-3 px-4 text-charcoal/60">
                      {(cat.vendors as { count: number }[])?.[0]?.count ?? 0}
                    </td>
                    <td className="py-3 px-4 text-charcoal/50">{cat.display_order}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </main>
    </>
  )
}
