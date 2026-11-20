import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default async function VendorGetStartedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/vendor/get-started')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'vendor') redirect('/dashboard')

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-ivory px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border-soft bg-white p-8 sm:p-12 shadow-sm">
          <p className="text-xs uppercase tracking-widest text-primary mb-3">For wedding professionals</p>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl text-plum">Welcome to PlanWedly for Vendors</h1>
          <p className="mt-4 text-muted leading-relaxed">
            Your business account is ready. The next step is finding your listing in the vendor directory.
          </p>
          <div className="mt-8 rounded-xl bg-primary-soft/40 p-5 text-sm text-ink">
            <strong>Business claims are not open yet.</strong> We are building a secure review process so
            only verified owners can manage listings. No listing has been transferred to your account.
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/vendors" className="rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-plum">
              Find your business
            </Link>
            <Link href="/" className="rounded-xl border border-border-soft px-5 py-3 text-sm font-medium text-plum hover:bg-primary-soft/20">
              Back to homepage
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
