import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function VendorGetStartedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/vendor/dashboard')
  const { data: profile } = await supabase.from('profiles')
    .select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'vendor') redirect('/dashboard')
  redirect('/vendor/dashboard')
}
