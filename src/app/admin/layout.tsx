import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/admin')
  const { data: allowed, error } = await supabase.rpc('is_admin')
  if (error || !allowed) redirect('/dashboard')
  return <>{children}</>
}
