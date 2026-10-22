import Link from 'next/link'
import { ArrowRight, CalendarDays, Check, ClipboardCheck, Heart, Search, Wallet, Sparkles, Flower2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Card from '@/components/ui/Card'
import VendorCategoryIcon from '@/components/vendors/VendorCategoryIcon'

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
        <section className="relative isolate overflow-hidden bg-[#FCF8F4]">
          <div className="absolute inset-0 opacity-60 pointer-events-none" aria-hidden="true" style={{ backgroundImage: 'radial-gradient(ellipse at 85% 10%, #F4E4DD 0%, transparent 43%), radial-gradient(ellipse at 5% 90%, #F8E7E4 0%, transparent 45%)' }} />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32 grid lg:grid-cols-[1.15fr_0.85fr] items-center gap-12 lg:gap-16">
            <div>
              <div className="flex items-center gap-3 mb-8 text-[#9B6A62]">
                <span className="h-px w-10 bg-[#BA9188]" />
                <span className="font-[family-name:var(--font-logo)] text-xl sm:text-2xl italic tracking-wide">Love. Plan. Celebrate.</span>
              </div>
              <h1 className="font-[family-name:var(--font-heading)] text-[clamp(3rem,6vw,5.8rem)] leading-[1.12] tracking-tight text-[#3C3030]">
                A beautiful beginning, <em className="font-normal text-rose-gold">thoughtfully planned.</em>
              </h1>
              <p className="mt-8 max-w-xl text-base sm:text-lg leading-8 text-[#74625D]">
                Your love story deserves a celebration that feels like you. Discover wedding vendors, stay on top of your plans, and honour the traditions that matter.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-gold px-8 py-4 text-white font-medium hover:bg-rose-gold-dark transition-colors">
                  Start planning for free <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/vendors" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#CBB8AE] px-8 py-4 text-[#5B4642] font-medium hover:border-rose-gold hover:text-rose-gold transition-colors">
                  Explore vendors
                </Link>
              </div>
              <p className="mt-7 text-xs tracking-wide text-[#8E7A73]">For Tamil Hindu and Christian weddings in the Greater Toronto Area</p>
            </div>

            <div className="relative min-h-[350px] sm:min-h-[460px] lg:min-h-[520px] flex items-center justify-center" aria-label="Decorative wedding stationery illustration">
              <div className="absolute w-[83%] aspect-square rounded-full border border-[#D9BEB1]/60" />
              <div className="absolute w-[67%] aspect-square rounded-full border border-[#E8D4CB]" />
              <div className="absolute left-[4%] top-[9%] text-[#B7827D] rotate-[-20deg]" aria-hidden="true"><Flower2 className="w-16 h-16 sm:w-24 sm:h-24" strokeWidth={0.8} /></div>
              <div className="absolute right-[4%] bottom-[9%] text-[#B7827D] rotate-[20deg]" aria-hidden="true"><Flower2 className="w-16 h-16 sm:w-24 sm:h-24" strokeWidth={0.8} /></div>
              <div className="relative w-[74%] max-w-[390px] rotate-[-4deg] bg-[#FFFDFB] border border-[#E5D6CD] shadow-[0_30px_75px_-30px_rgba(91,57,47,0.28)] px-8 py-12 sm:px-12 sm:py-16 text-center">
                <div className="mx-auto w-12 h-12 rounded-full border border-[#C99B8B] flex items-center justify-center text-rose-gold"><Heart className="h-5 w-5" strokeWidth={1.3} /></div>
                <p className="mt-8 text-[10px] uppercase tracking-[0.32em] text-[#A57A70]">The next chapter</p>
                <p className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl text-[#57413C] mt-4 leading-tight">Your story,<br /><em>your celebration.</em></p>
                <div className="flex items-center justify-center gap-3 mt-7 text-[#BA8D80]"><span className="h-px w-12 bg-[#D5B8A9]" /><Sparkles className="h-4 w-4" /><span className="h-px w-12 bg-[#D5B8A9]" /></div>
                <p className="text-xs tracking-[0.17em] uppercase mt-7 text-[#9D8075]">With love, Wedly</p>
              </div>
              <div className="absolute right-[0%] top-[12%] w-20 h-24 sm:w-28 sm:h-32 bg-[#D6AA9C]/45 rotate-[14deg] rounded-t-full -z-10" />
              <div className="absolute left-[5%] bottom-[12%] w-24 h-24 sm:w-32 sm:h-32 bg-[#E9D3C8]/65 rounded-full -z-10" />
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-14">
              <p className="text-xs uppercase tracking-[0.2em] text-rose-gold font-medium mb-4">A little less stress, a lot more joy</p>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl sm:text-5xl text-[#433431] leading-tight">From the first idea to the <em>big day.</em></h2>
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

        <section className="bg-[#FAF3EE] py-20 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-[2rem] border border-[#EAD8CE] bg-[#FFFDFB] p-8 sm:p-12">
                <Flower2 className="h-9 w-9 text-rose-gold mb-7" strokeWidth={1.1} />
                <p className="text-xs tracking-[0.17em] uppercase text-[#9E7168] mb-3">Honouring your traditions</p>
                <h2 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl text-[#433431] mb-4">Tamil Hindu weddings</h2>
                <p className="text-[#77645F] leading-7">From meaningful ceremonies to joyful receptions, make room for every tradition that matters to your family.</p>
              </div>
              <div className="rounded-[2rem] border border-[#EAD8CE] bg-[#FFFDFB] p-8 sm:p-12">
                <Heart className="h-9 w-9 text-rose-gold mb-7" strokeWidth={1.1} />
                <p className="text-xs tracking-[0.17em] uppercase text-[#9E7168] mb-3">Celebrating your story</p>
                <h2 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl text-[#433431] mb-4">Tamil Christian weddings</h2>
                <p className="text-[#77645F] leading-7">Plan your ceremony, reception, and the moments in between, with the people and traditions you love.</p>
              </div>
            </div>
          </div>
        </section>

        {categories && categories.length > 0 && (
          <section className="py-20 sm:py-28 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-5 mb-12">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-rose-gold font-medium mb-4">Your people, your day</p>
                  <h2 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl text-[#433431]">Find the right wedding vendors</h2>
                  <p className="text-[#786761] mt-3">Explore businesses serving the GTA Tamil wedding community.</p>
                </div>
                <Link href="/vendors" className="inline-flex items-center gap-2 text-rose-gold font-medium hover:text-rose-gold-dark">Browse all vendors <ArrowRight className="h-4 w-4" /></Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.map((cat) => (
                  <Link key={cat.id} href={`/vendors/${cat.slug}`} className="group">
                    <Card className="p-5 text-center" hover>
                      <div className="w-12 h-12 rounded-xl bg-peach-light/50 flex items-center justify-center mx-auto mb-3 group-hover:bg-peach-light transition-colors">
                        <VendorCategoryIcon icon={cat.icon} className="h-5 w-5 text-rose-gold" />
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

        <section className="bg-[#F4E7E0] py-20 sm:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <Sparkles className="h-8 w-8 text-rose-gold mx-auto mb-6" strokeWidth={1.2} />
            <h2 className="font-[family-name:var(--font-heading)] text-3xl sm:text-5xl text-[#433431] leading-tight">The best celebrations start with <em>a little planning.</em></h2>
            <p className="text-[#786761] mt-6 mb-9">Your wedding planning space is free to get started. Bring your ideas; we&apos;ll help you organize the rest.</p>
            <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 bg-rose-gold text-white px-8 py-4 rounded-full font-medium hover:bg-rose-gold-dark transition-colors">Create your free account <ArrowRight className="h-4 w-4" /></Link>
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
