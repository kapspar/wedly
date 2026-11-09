import Link from 'next/link'
import { ArrowRight, CalendarDays, Check, ClipboardCheck, Heart, Search, Wallet, Sparkles, Flower2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Card from '@/components/ui/Card'
import VendorCategoryIcon from '@/components/vendors/VendorCategoryIcon'
import Image from 'next/image'

const journey = [
  { number: '01', title: 'Make room for the dream', subtitle: 'Your budget, beautifully organized', icon: Wallet, detail: 'Set a budget that feels right for you, and keep track of every meaningful detail.', tone: 'bg-[#F8E8E2]' },
  { number: '02', title: 'Bring the details together', subtitle: 'The little things, all in one place', icon: ClipboardCheck, detail: 'Explore vendors, plan your events, manage your guest list, and keep things moving.', tone: 'bg-[#F3EDE6]' },
  { number: '03', title: 'Celebrate your way', subtitle: 'A day that feels like yours', icon: Heart, detail: 'Honour your traditions and make space for the moments you will remember.', tone: 'bg-[#F2E5E6]' },
]

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
        <section className="relative isolate overflow-hidden bg-[#FBF7FA]">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{ background: 'radial-gradient(ellipse at 80% 20%, #F5EAF4 0%, transparent 55%)' }} />
          <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 pt-12 pb-16 sm:pt-20 sm:pb-24">
            <div className="grid lg:grid-cols-2 items-center gap-4 lg:gap-12">
              <div className="text-center lg:text-left">
                <p className="text-xs sm:text-sm uppercase tracking-[0.26em] text-[#74346E] mb-6">Love. Plan. Celebrate.</p>
                <h1 className="font-[family-name:var(--font-heading)] text-[clamp(2.7rem,5.5vw,5rem)] leading-[1.1] text-[#62245D] tracking-tight">Your All-in-One Wedding Planning Assistant</h1>
                <p className="mt-6 max-w-lg mx-auto lg:mx-0 text-base sm:text-lg leading-7 text-[#332B33]">Plan, organize, and bring your dream celebration to life — all in one place.</p>
                <div className="mt-8 hidden lg:flex flex-wrap gap-3">
                  <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#893D87] px-8 py-4 text-white font-medium hover:bg-[#6B2C69] transition-colors">Create New Wedding Project <ArrowRight className="h-4 w-4" /></Link>
                  <Link href="/vendors" className="inline-flex items-center justify-center rounded-xl border border-[#B78DB5] px-6 py-4 text-[#62245D] font-medium">Explore vendors</Link>
                </div>
              </div>
              <div className="w-full max-w-[540px] mx-auto -my-4 lg:my-0">
                <Image src="/illustrations/wedly-reception.png" alt="Couple dancing at their wedding reception" width={936} height={936} priority className="w-full h-auto object-contain" />
              </div>
            </div>
            <div className="lg:hidden max-w-md mx-auto mt-3">
              <Link href="/auth/signup" className="flex items-center justify-center gap-2 rounded-xl bg-[#893D87] px-5 py-4 text-white text-center font-medium hover:bg-[#6B2C69] transition-colors">Create New Wedding Project <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="mt-6 text-center text-sm text-[#453746]">Are you a professional planner, vendor, or venue? <Link href="/auth/signup" className="inline-block ml-1 font-semibold text-[#74346E] underline underline-offset-4">Business Portal</Link></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-7 mt-16 max-w-4xl mx-auto text-center">
              {[
                { icon: ClipboardCheck, label: 'Plan & Organize' },
                { icon: Wallet, label: 'Manage Your Budget' },
                { icon: Search, label: 'Find Vendors' },
                { icon: Heart, label: 'Prepare & Celebrate' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-3">
                  <span className="rounded-full bg-[#F3E9F2] p-4 text-[#62245D]"><item.icon className="h-8 w-8" strokeWidth={1.4} /></span>
                  <span className="text-sm sm:text-base text-[#322634]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-10 bg-[#FFFDFD]" style={{ clipPath: 'ellipse(80% 100% at 50% 100%)' }} />
        </section>

        <section className="bg-white py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-14">
              <p className="text-xs uppercase tracking-[0.2em] text-[#843E80] font-medium mb-4">A little less stress, a lot more joy</p>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl sm:text-5xl text-[#62245D] leading-tight">From the first idea to the <em>big day.</em></h2>
              <p className="mt-5 text-[#786761] leading-relaxed">Thoughtful tools to help you enjoy the journey, not just the destination.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {journey.map((step) => (
                <div key={step.number} className={`rounded-[2rem] ${step.tone} p-7 sm:p-9 relative overflow-hidden min-h-[320px] flex flex-col`}>
                  <div className="flex justify-between items-start">
                    <span className="font-[family-name:var(--font-heading)] text-2xl text-[#9B7069]">{step.number}</span>
                    <div className="w-16 h-16 rounded-full bg-white/60 flex items-center justify-center text-[#A96D65]"><step.icon className="h-8 w-8" strokeWidth={1.25} /></div>
                  </div>
                  <div className="mt-auto pt-14">
                    <p className="text-xs uppercase tracking-[0.13em] text-[#A1746C] mb-3">{step.subtitle}</p>
                    <h3 className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl text-[#453533] mb-3">{step.title}</h3>
                    <p className="text-sm text-[#75645F] leading-6">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#FBF7FA] py-20 sm:py-24">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-xs uppercase tracking-[0.24em] text-[#843E80] mb-3">Every love story belongs</p>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl sm:text-5xl text-[#62245D]">Your traditions. Your celebration.</h2>
              <p className="mt-4 text-[#615561]">Built with the GTA Tamil community in mind, with room for every couple to celebrate their way.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-[2rem] bg-white/80 p-6 sm:p-9 text-center border border-[#EEDFEA]">
                <Image src="/illustrations/wedly-hindu.png" alt="Couple in Tamil Hindu wedding attire" width={936} height={936} className="w-full max-w-[390px] h-auto mx-auto object-contain" />
                <h3 className="font-[family-name:var(--font-heading)] text-2xl text-[#62245D] mt-3">Tamil Hindu weddings</h3>
                <p className="mt-2 text-sm leading-6 text-[#615561]">Plan your ceremony and honour the traditions that matter to your family.</p>
              </div>
              <div className="rounded-[2rem] bg-white/80 p-6 sm:p-9 text-center border border-[#EEDFEA]">
                <Image src="/illustrations/wedly-catholic.png" alt="Couple in Catholic wedding attire" width={936} height={936} className="w-full max-w-[390px] h-auto mx-auto object-contain" />
                <h3 className="font-[family-name:var(--font-heading)] text-2xl text-[#62245D] mt-3">Tamil Christian weddings</h3>
                <p className="mt-2 text-sm leading-6 text-[#615561]">Bring your ceremony, reception and meaningful moments together.</p>
              </div>
            </div>
          </div>
        </section>

        {categories && categories.length > 0 && (
          <section className="py-20 sm:py-28 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-5 mb-12">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#843E80] font-medium mb-4">Your people, your day</p>
                  <h2 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl text-[#62245D]">Find the right wedding vendors</h2>
                  <p className="text-[#786761] mt-3">Explore businesses serving the GTA Tamil wedding community.</p>
                </div>
                <Link href="/vendors" className="inline-flex items-center gap-2 text-[#843E80] font-medium hover:text-[#62245D]">Browse all vendors <ArrowRight className="h-4 w-4" /></Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map((cat) => (
                  <Link key={cat.id} href={`/vendors/${cat.slug}`} className="group">
                    <Card className="p-5 text-center" hover>
                      <div className="w-16 h-16 rounded-xl bg-peach-light/50 flex items-center justify-center mx-auto mb-3 group-hover:bg-peach-light transition-colors">
                        <VendorCategoryIcon icon={cat.icon} className="h-14 w-14 text-[#843E80]" />
                      </div>
                      <h3 className="font-medium text-sm text-charcoal">{cat.name}</h3>
                      <p className="text-xs text-charcoal/40 mt-1">{(cat.vendors as { count: number }[])?.[0]?.count ?? 0} listings</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="bg-[#F5EBF4] py-20 sm:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <Sparkles className="h-8 w-8 text-[#843E80] mx-auto mb-6" strokeWidth={1.2} />
            <h2 className="font-[family-name:var(--font-heading)] text-3xl sm:text-5xl text-[#62245D] leading-tight">The best celebrations start with <em>a little planning.</em></h2>
            <p className="text-[#786761] mt-6 mb-9">Your wedding planning space is free to get started. Bring your ideas; we&apos;ll help you organize the rest.</p>
            <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 bg-[#893D87] text-white px-8 py-4 rounded-full font-medium hover:bg-[#62245D] transition-colors">Create your free account <ArrowRight className="h-4 w-4" /></Link>
            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs text-[#826D65]">
              <span className="flex items-center gap-1"><Check className="h-4 w-4" /> Budget tracker</span>
              <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> Event planning</span>
              <span className="flex items-center gap-1"><Search className="h-4 w-4" /> Vendor discovery</span>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
