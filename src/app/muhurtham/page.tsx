'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarHeart, CheckCircle2, Clock3, FileCheck2, ShieldCheck, Users } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

const steps = [
  { icon: Users, title: 'Tell us about your wedding', detail: 'Both partners share their relevant birth information, wedding location, date preferences and family traditions in a private consultation intake.' },
  { icon: CalendarHeart, title: 'Review candidate dates', detail: 'A participating Tamil Hindu priest uses their established panchangam and customary method to identify appropriate dates and times.' },
  { icon: Clock3, title: 'Consult with your priest', detail: 'Discuss recommended options and choose a ceremony time with the priest. Different traditions may reach different recommendations.' },
  { icon: FileCheck2, title: 'Receive priest confirmation', detail: 'After the priest approves, receive a dated, verifiable confirmation. Temple endorsement is included only when explicitly authorized.' },
]

export default function MuhurthamPage() {
  const [price, setPrice] = useState(75)
  const [share, setShare] = useState(80)
  const priest = price * share / 100
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-ivory">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-rose-gold mb-3">PlanWedly · Service preview</p>
            <h1 className="font-[family-name:var(--font-heading)] text-3xl sm:text-5xl text-charcoal">Find your Muhurtham</h1>
            <p className="text-charcoal/75 mt-4 leading-relaxed">Explore a priest-guided way to choose an auspicious Tamil Hindu wedding date, with a personalized consultation and an optional signed confirmation.</p>
            <div className="mt-5 inline-flex gap-2 items-center bg-peach-light/50 text-charcoal rounded-full px-4 py-2 text-xs font-medium">
              <ShieldCheck className="h-4 w-4 text-rose-gold" /> Preview only — bookings and payments are not yet available
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-10">
            <Card className="p-6">
              <p className="text-xs uppercase tracking-wide text-rose-gold font-semibold">Free</p>
              <h2 className="font-[family-name:var(--font-heading)] text-2xl mt-2">Explore the calendar</h2>
              <p className="text-sm text-charcoal/75 mt-2">A future reference calendar of Tamil months and commonly considered wedding periods. Dates will not be labeled auspicious until the source and calculation rules are verified.</p>
              <p className="mt-5 text-xs font-medium text-charcoal/70">Calendar data validation in progress</p>
            </Card>
            <Card className="p-6 border-rose-gold/30">
              <p className="text-xs uppercase tracking-wide text-rose-gold font-semibold">Optional paid service</p>
              <h2 className="font-[family-name:var(--font-heading)] text-2xl mt-2">Priest-verified consultation</h2>
              <p className="text-sm text-charcoal/75 mt-2">A qualified participating priest reviews the couple's details, recommends a date and time, and can issue a signed confirmation. Priests choose whether to charge and set their own fees.</p>
              <p className="mt-5 text-xs font-medium text-charcoal/70">Coming soon · No payment collected</p>
            </Card>
          </div>

          <h2 className="font-[family-name:var(--font-heading)] text-2xl text-charcoal mt-12 mb-5">How it will work</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {steps.map((step, i) => (
              <Card className="p-5" key={step.title}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-9 h-9 rounded-full bg-peach-light/60 flex items-center justify-center"><step.icon className="h-5 w-5 text-rose-gold" /></span>
                  <span className="text-xs text-charcoal/70">Step {i + 1}</span>
                </div>
                <h3 className="font-[family-name:var(--font-heading)] text-lg">{step.title}</h3>
                <p className="text-sm text-charcoal/75 mt-2">{step.detail}</p>
              </Card>
            ))}
          </div>

          <Card className="p-6 mt-10">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl">Confirmation certificate preview</h2>
            <p className="text-sm text-charcoal/75 mt-2">A proposed document for the couple, signed by the reviewing priest after the consultation. A temple can countersign only if it agrees to participate.</p>
            <div className="mt-5 border-2 border-[#C7A67B] bg-[#FAF5EC] text-[#49382D] p-6 sm:p-10 text-center rounded-lg">
              <p className="uppercase tracking-[0.25em] text-xs">PlanWedly · Sample only</p>
              <h3 className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl mt-3">Muhurtham Confirmation</h3>
              <p className="mt-4 text-sm">For: Couple's names to be confirmed</p>
              <p className="text-sm mt-1">Recommended date & time: Pending priest review</p>
              <div className="grid grid-cols-2 gap-5 mt-10 text-xs">
                <div className="border-t border-[#C7A67B] pt-2">Priest signature</div>
                <div className="border-t border-[#C7A67B] pt-2">Authorized temple signature (optional)</div>
              </div>
              <p className="text-xs mt-8">Not a valid religious or temple-issued certificate</p>
            </div>
          </Card>

          <Card className="p-6 mt-8">
            <h2 className="font-[family-name:var(--font-heading)] text-xl">Proposed priest-first pricing</h2>
            <p className="text-sm text-charcoal/75 mt-2">This interactive illustration is for planning the business model. It does not set a price or process a payment.</p>
            <div className="grid sm:grid-cols-2 gap-4 mt-5">
              <label className="text-sm font-medium">Sample consultation fee (CAD)
                <input type="number" min="0" max="10000" step="5" value={price} onChange={e => setPrice(Math.max(0, Math.min(10000, Number(e.target.value) || 0)))} className="mt-1 block w-full rounded-xl border border-peach-light px-3 py-2.5" />
              </label>
              <label className="text-sm font-medium">Priest share: {share}%
                <input type="range" min="70" max="100" step="5" value={share} onChange={e => setShare(Number(e.target.value))} className="mt-3 w-full accent-rose-gold" />
              </label>
            </div>
            <div className="flex flex-wrap gap-6 mt-5 text-sm">
              <p><strong>Priest:</strong> ${priest.toFixed(2)}</p>
              <p><strong>PlanWedly:</strong> ${(price - priest).toFixed(2)}</p>
            </div>
            <p className="text-xs text-charcoal/70 mt-2">Illustrative gross split, before payment fees, taxes, refunds, and any temple allocation. Free consultations may also be supported.</p>
          </Card>

          <div className="mt-8 flex items-start gap-2 text-sm text-charcoal/75">
            <CheckCircle2 className="h-5 w-5 text-sage-dark shrink-0" />
            <p>We will not collect birth details or offer calculated auspicious dates until the privacy, priest review, and calculation processes are ready. The priest—not PlanWedly—makes the religious recommendation.</p>
          </div>
          <div className="mt-8"><Link href="/dashboard"><Button variant="outline">Back to dashboard</Button></Link></div>
        </div>
      </main>
      <Footer />
    </>
  )
}
