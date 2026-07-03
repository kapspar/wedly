import Link from 'next/link'
import { Search, Calendar, DollarSign, ArrowRight, CheckCircle } from 'lucide-react'
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
        <section className="relative overflow-hidden bg-ivory py-24 sm:py-40">
          {/* Decorative background rings */}
          <div className="absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full border border-peach-light/40 pointer-events-none" aria-hidden="true" />
          <div className="absolute top-10 right-10 w-[280px] h-[280px] rounded-full border border-rose-gold/10 pointer-events-none" aria-hidden="true" />
          <div className="absolute -bottom-32 -left-16 w-[400px] h-[400px] rounded-full border border-peach/20 pointer-events-none" aria-hidden="true" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="font-[family-name:var(--font-logo)] text-xl sm:text-2xl italic font-light text-rose-gold tracking-wider mb-6">
              Love. Plan. Celebrate.
            </p>
            <h1 className="font-[family-name:var(--font-heading)] text-4xl sm:text-6xl lg:text-7xl text-charcoal leading-tight tracking-tight mb-6">
              Your Tamil wedding,<br />
              <span className="text-rose-gold">beautifully planned.</span>
            </h1>
            <p className="text-charcoal/60 max-w-2xl mx-auto mb-10 text-lg sm:text-xl leading-relaxed">
              Discover trusted vendors, manage your budget, and plan every tradition —
              all in one place built for GTA Tamil couples.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 bg-rose-gold text-white px-8 py-4 rounded-full font-medium text-base hover:bg-rose-gold-dark transition-colors shadow-sm"
              >
                Start Planning — It&apos;s Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/vendors"
                className="inline-flex items-center justify-center gap-2 border-2 border-charcoal/20 text-charcoal px-8 py-4 rounded-full font-medium text-base hover:border-rose-gold hover:text-rose-gold transition-colors"
              >
                Browse Vendors
              </Link>
            </div>
            <p className="text-xs text-charcoal/40 mt-8 tracking-wide uppercase">
              Serving the Greater Toronto Area Tamil wedding community
            </p>
          </div>

          {/* Bottom wave */}
          <div className="absolute -bottom-1 left-0 right-0 pointer-events-none" aria-hidden="true">
            <svg viewBox="0 0 1440 60" fill="none" className="w-full">
              <path d="M0 60L1440 60L1440 0C1200 50 240 50 0 0L0 60Z" fill="white" />
            </svg>
          </div>
        </section>

        {/* Why Wedly */}
        <section className="py-20 sm:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl text-charcoal mb-4">
                Everything you need, in one place
              </h2>
              <p className="text-charcoal/60 max-w-xl mx-auto text-lg">
                Planning a Tamil wedding is complex. Wedly makes it simple.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-8 text-center group" hover>
                <div className="w-14 h-14 rounded-2xl bg-peach-light/60 flex items-center justify-center mx-auto mb-5 group-hover:bg-peach-light transition-colors">
                  <Search className="h-6 w-6 text-rose-gold" />
                </div>
                <h3 className="font-[family-name:var(--font-heading)] text-xl text-charcoal mb-3">
                  Discover Trusted Vendors
                </h3>
                <p className="text-charcoal/60 leading-relaxed">
                  Browse vetted vendors who understand Tamil wedding traditions — venues, priests, photographers, decorators, and more.
                </p>
              </Card>
              <Card className="p-8 text-center group" hover>
                <div className="w-14 h-14 rounded-2xl bg-peach-light/60 flex items-center justify-center mx-auto mb-5 group-hover:bg-peach-light transition-colors">
                  <DollarSign className="h-6 w-6 text-rose-gold" />
                </div>
                <h3 className="font-[family-name:var(--font-heading)] text-xl text-charcoal mb-3">
                  Manage Your Budget
                </h3>
                <p className="text-charcoal/60 leading-relaxed">
                  Set budgets across every category, track what you&apos;ve spent, and stay in control of your wedding finances.
                </p>
              </Card>
              <Card className="p-8 text-center group" hover>
                <div className="w-14 h-14 rounded-2xl bg-peach-light/60 flex items-center justify-center mx-auto mb-5 group-hover:bg-peach-light transition-colors">
                  <Calendar className="h-6 w-6 text-rose-gold" />
                </div>
                <h3 className="font-[family-name:var(--font-heading)] text-xl text-charcoal mb-3">
                  Plan Every Tradition
                </h3>
                <p className="text-charcoal/60 leading-relaxed">
                  Organize every event — engagement, temple ceremony, reception, and more — with tools built for multi-day celebrations.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Vendor Categories */}
        {categories && categories.length > 0 && (
          <section className="py-20 sm:py-28 bg-ivory">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-14">
                <h2 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl text-charcoal mb-4">
                  Find your perfect vendors
                </h2>
                <p className="text-charcoal/60 max-w-lg mx-auto text-lg">
                  Browse every category you need for a complete Tamil wedding
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map((cat) => (
                  <Link key={cat.id} href={`/vendors/${cat.slug}`} className="group">
                    <Card className="p-5 text-center" hover>
                      <div className="w-12 h-12 rounded-xl bg-peach-light/50 flex items-center justify-center mx-auto mb-3 group-hover:bg-peach-light transition-colors">
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
              <div className="text-center mt-10">
                <Link
                  href="/vendors"
                  className="inline-flex items-center gap-2 text-rose-gold font-medium hover:text-rose-gold-dark transition-colors"
                >
                  View all vendors
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Social Proof / Trust */}
        <section className="py-20 sm:py-28 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl text-charcoal mb-6">
              Planning your wedding should feel joyful.
            </h2>
            <p className="text-charcoal/60 mb-12 max-w-xl mx-auto text-lg leading-relaxed">
              Wedly was built for GTA Tamil couples — by people who understand the beauty, the traditions, and the scale of a Tamil wedding.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14">
              {[
                { label: 'Vendor categories', value: `${categories?.length ?? 12}+` },
                { label: 'GTA vendors listed', value: '100+' },
                { label: 'Free to get started', value: '$0' },
              ].map((stat) => (
                <div key={stat.label} className="border border-peach-light rounded-2xl px-6 py-8">
                  <p className="font-[family-name:var(--font-heading)] text-4xl text-charcoal mb-2">{stat.value}</p>
                  <p className="text-sm text-charcoal/60">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 bg-rose-gold text-white px-8 py-4 rounded-full font-medium text-base hover:bg-rose-gold-dark transition-colors"
              >
                Get Started — It&apos;s Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/vendors"
                className="inline-flex items-center justify-center gap-2 border-2 border-charcoal/20 text-charcoal px-8 py-4 rounded-full font-medium text-base hover:border-rose-gold hover:text-rose-gold transition-colors"
              >
                Browse Vendors
              </Link>
            </div>
          </div>
        </section>

        {/* What's included */}
        <section className="py-20 sm:py-28 bg-ivory">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl text-charcoal mb-4">
                Your free account includes
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                'Vendor search & discovery',
                'Budget planner & tracker',
                'Multi-day event organizer',
                'Planning task list',
                'Save favourite vendors',
                'Send vendor inquiries',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3 bg-white rounded-xl px-5 py-4 border border-peach-light/50">
                  <CheckCircle className="h-5 w-5 text-sage flex-shrink-0" />
                  <span className="text-sm text-charcoal">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
