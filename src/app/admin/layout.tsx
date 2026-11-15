import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/admin')
  const { data } = await supabase.from('admin_access' as never)
    .select('role').eq('user_id', user.id).maybeSingle()
  const access = data as { role: string } | null
  if (access?.role !== 'owner' && access?.role !== 'business_admin') redirect('/dashboard')
  return <>{children}</>
}
