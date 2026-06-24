import Link from 'next/link'
import { Heart, Search, Calendar, DollarSign, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Card from '@/components/ui/Card'
import VendorCategoryIcon from '@/components/vendors/VendorCategoryIcon'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('vendor_categories')
    .select('*, vendors:vendors(count)')
    .order('display_order')

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-peach-light/40 to-ivory py-20 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="font-[family-name:var(--font-script)] text-5xl sm:text-7xl text-charcoal mb-4">
              Wedly
            </h1>
            <p className="font-[family-name:var(--font-heading)] text-xl sm:text-2xl text-charcoal/80 mb-3">
              Love. Plan. Celebrate.
            </p>
            <p className="text-charcoal/60 max-w-xl mx-auto mb-8 text-base sm:text-lg">
              The trusted platform for planning Tamil weddings in the GTA.
              Discover vendors, manage your budget, and celebrate your story — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 bg-rose-gold text-white px-8 py-3 rounded-full font-medium hover:bg-rose-gold-dark transition-colors"
              >
                Start Planning
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/vendors"
                className="inline-flex items-center justify-center gap-2 border-2 border-rose-gold text-rose-gold px-8 py-3 rounded-full font-medium hover:bg-rose-gold hover:text-white transition-colors"
              >
                Browse Vendors
              </Link>
            </div>
          </div>
          <div className="absolute -bottom-1 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" className="w-full">
              <path d="M0 60L1440 60L1440 0C1200 50 240 50 0 0L0 60Z" fill="var(--color-ivory)" />
            </svg>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl text-center text-charcoal mb-12">
              Everything you need to plan your perfect day
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-6 text-center" hover>
                <div className="w-12 h-12 rounded-full bg-peach-light flex items-center justify-center mx-auto mb-4">
                  <Search className="h-6 w-6 text-rose-gold" />
                </div>
                <h3 className="font-[family-name:var(--font-heading)] text-lg text-charcoal mb-2">
                  Discover Vendors
                </h3>
                <p className="text-sm text-charcoal/60">
                  Browse trusted vendors who understand Tamil wedding traditions — from venues and priests to photographers and decorators.
                </p>
              </Card>
              <Card className="p-6 text-center" hover>
                <div className="w-12 h-12 rounded-full bg-peach-light flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-6 w-6 text-rose-gold" />
                </div>
                <h3 className="font-[family-name:var(--font-heading)] text-lg text-charcoal mb-2">
                  Manage Your Budget
                </h3>
                <p className="text-sm text-charcoal/60">
                  Set budgets for every category, track spending, and stay on top of your wedding finances with ease.
                </p>
              </Card>
              <Card className="p-6 text-center" hover>
                <div className="w-12 h-12 rounded-full bg-peach-light flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-6 w-6 text-rose-gold" />
                </div>
                <h3 className="font-[family-name:var(--font-heading)] text-lg text-charcoal mb-2">
                  Plan Multi-Day Events
                </h3>
                <p className="text-sm text-charcoal/60">
                  Organize every event — from engagement to reception — with tools built for multi-day Tamil wedding celebrations.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Vendor Categories */}
        {categories && categories.length > 0 && (
          <section className="py-16 sm:py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl text-center text-charcoal mb-4">
                Find your perfect vendors
              </h2>
              <p className="text-center text-charcoal/60 mb-12 max-w-lg mx-auto">
                Explore vendors across every category you need for your wedding
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map((cat) => (
                  <Link key={cat.id} href={`/vendors/${cat.slug}`} className="group">
                    <Card className="p-5 text-center" hover>
                      <div className="w-10 h-10 rounded-full bg-peach-light/50 flex items-center justify-center mx-auto mb-3 group-hover:bg-peach-light transition-colors">
                        <VendorCategoryIcon icon={cat.icon} className="h-5 w-5 text-rose-gold" />
                      </div>
                      <h3 className="font-medium text-sm text-charcoal">{cat.name}</h3>
                      <p className="text-xs text-charcoal/40 mt-1">
                        {(cat.vendors as { count: number }[])?.[0]?.count ?? 0} vendors
                      </p>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-16 sm:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Heart className="h-10 w-10 text-rose-gold mx-auto mb-4" fill="currentColor" />
            <h2 className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl text-charcoal mb-4">
              Ready to start planning?
            </h2>
            <p className="text-charcoal/60 mb-8 max-w-md mx-auto">
              Planning your wedding should feel joyful, not overwhelming.
              Let Wedly help you every step of the way.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 bg-rose-gold text-white px-8 py-3 rounded-full font-medium hover:bg-rose-gold-dark transition-colors"
            >
              Get Started — It&apos;s Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
