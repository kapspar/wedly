import Link from 'next/link'
import { Store, Plus, ChevronLeft, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Card from '@/components/ui/Card'

export const metadata = { title: 'Manage Vendors — Admin' }

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('vendor_categories')
    .select('*')
    .order('display_order')

  let query = supabase
    .from('vendors')
    .select('*, category:vendor_categories(name, slug)')
    .order('name')

  if (params.category) {
    const cat = categories?.find(c => c.slug === params.category)
    if (cat) query = query.eq('category_id', cat.id)
  }

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,city.ilike.%${params.q}%`)
  }

  const { data: vendors } = await query.limit(200)

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-sm text-charcoal/50 hover:text-charcoal mb-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Admin
              </Link>
              <h1 className="font-[family-name:var(--font-heading)] text-2xl text-charcoal flex items-center gap-2">
                <Store className="h-6 w-6 text-rose-gold" />
                Manage Vendors
              </h1>
            </div>
            <Link
              href="/admin/vendors/new"
              className="inline-flex items-center gap-1.5 bg-rose-gold text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-rose-gold-dark transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Vendor
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Link
              href="/admin/vendors"
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                !params.category
                  ? 'bg-rose-gold text-white'
                  : 'bg-peach-light/50 text-charcoal/60 hover:bg-peach-light'
              }`}
            >
              All
            </Link>
            {categories?.map((cat) => (
              <Link
                key={cat.id}
                href={`/admin/vendors?category=${cat.slug}`}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  params.category === cat.slug
                    ? 'bg-rose-gold text-white'
                    : 'bg-peach-light/50 text-charcoal/60 hover:bg-peach-light'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          <p className="text-sm text-charcoal/50 mb-4">
            {vendors?.length ?? 0} vendors
          </p>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-peach-light bg-peach-light/20">
                    <th className="text-left py-3 px-4 font-medium text-charcoal/70">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-charcoal/70">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-charcoal/70">City</th>
                    <th className="text-left py-3 px-4 font-medium text-charcoal/70">Priority</th>
                    <th className="text-left py-3 px-4 font-medium text-charcoal/70">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-charcoal/70">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-peach-light/50">
                  {vendors?.map((vendor) => {
                    const category = vendor.category as { name: string; slug: string } | null
                    return (
                      <tr key={vendor.id} className="hover:bg-peach-light/10">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-charcoal">{vendor.name}</p>
                            <p className="text-xs text-charcoal/40">{vendor.slug}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-charcoal/60">
                          {category?.name}
                        </td>
                        <td className="py-3 px-4 text-charcoal/60">{vendor.city}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              vendor.priority === 'high'
                                ? 'bg-rose-gold/10 text-rose-gold'
                                : 'bg-peach-light text-charcoal/50'
                            }`}
                          >
                            {vendor.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            {vendor.is_published && (
                              <span className="text-xs bg-sage/20 text-sage-dark px-2 py-0.5 rounded-full">
                                Published
                              </span>
                            )}
                            {vendor.is_featured && (
                              <span className="text-xs bg-rose-gold/10 text-rose-gold px-2 py-0.5 rounded-full">
                                Featured
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/vendor/${vendor.slug}`}
                            className="text-rose-gold hover:text-rose-gold-dark"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
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
