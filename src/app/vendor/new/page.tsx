import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import NewVendorForm from '@/components/vendors/NewVendorForm'

export const metadata = { title: 'Add Your Business — PlanWedly' }

export default async function NewVendorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/vendor/new')

  const { data: profile } = await supabase.from('profiles')
    .select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'vendor') redirect('/dashboard')
  const { data: categories } = await supabase.from('vendor_categories')
    .select('id,name').order('display_order')

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] bg-ivory px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <Link href="/vendor/dashboard" className="text-sm font-medium text-primary hover:underline">Back to vendor dashboard</Link>
          <h1 className="mt-5 font-[family-name:var(--font-heading)] text-3xl text-plum">Add your business</h1>
          <p className="mt-3 mb-8 text-muted">
            Not in the PlanWedly directory? Submit your details for review. We will not publish your listing until our team approves it.
          </p>
          <NewVendorForm requesterId={user.id} categories={categories ?? []} />
        </div>
      </main>
      <Footer />
    </>
  )
}
