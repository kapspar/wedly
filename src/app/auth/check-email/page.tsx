import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export const metadata = {
  title: 'Confirm Your Email — PlanWedly',
  description: 'Check your inbox to finish creating your PlanWedly account.',
}

export default function CheckEmailPage() {
  return <><Navbar/><main className="flex min-h-[68vh] items-center justify-center bg-ivory px-4 py-12">
    <section className="w-full max-w-lg rounded-2xl border border-border-soft bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
        <MailCheck className="h-8 w-8 text-primary"/>
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-primary">One more step</p>
      <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl text-plum">Check your email</h1>
      <p className="mt-4 text-sm leading-6 text-muted">
        If your email address needs verification, we’ll send you a confirmation link.
        Open that message and select <strong>Confirm my email</strong> to finish creating your PlanWedly account.
      </p>
      <div className="mt-6 rounded-xl bg-primary-soft/30 p-4 text-left text-sm text-muted">
        <p className="font-medium text-plum">Don’t see the message?</p>
        <p className="mt-2">Check Spam, Junk or Promotions. Delivery can take a few minutes.
          If it still hasn’t arrived, return to sign in and use the same address.</p>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/auth/login" className="rounded-xl bg-plum px-5 py-3 text-sm font-semibold text-white hover:opacity-90">Go to sign in</Link>
        <Link href="/" className="rounded-xl border border-border-soft px-5 py-3 text-sm font-semibold text-plum">Back to PlanWedly</Link>
      </div>
      <p className="mt-6 text-xs text-muted">Love. Plan. Celebrate.</p>
    </section>
  </main><Footer/></>
}
