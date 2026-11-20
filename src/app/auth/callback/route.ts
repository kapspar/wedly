import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function safeRedirect(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/dashboard'
  }
  return value
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const requested = safeRedirect(searchParams.get('redirect'))
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: isStaff } = await supabase.rpc('is_admin')
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        let role = profile?.role
        if (requested === '/vendor/get-started' && role === 'couple' && !isStaff) {
          const { data: converted, error: conversionError } = await supabase.rpc('register_vendor_account')
          if (conversionError || !converted) {
            return NextResponse.redirect(new URL('/?vendor_account_error=1', origin))
          }
          role = 'vendor'
        }
        const home = isStaff ? '/admin' : role === 'vendor' ? '/vendor/get-started' : '/dashboard'
        if (requested === '/dashboard' || requested === '/onboarding') {
          if (isStaff || role === 'vendor') return NextResponse.redirect(new URL(home, origin))
          if (requested === '/onboarding') {
            const { data: wedding, error: lookupError } = await supabase.from('weddings')
              .select('id').eq('couple_id', user.id).limit(1).maybeSingle()
            if (lookupError) return NextResponse.redirect(new URL(home, origin))
            return NextResponse.redirect(new URL(wedding ? home : '/onboarding', origin))
          }
        }
        if (requested.startsWith('/admin') && !isStaff) {
          return NextResponse.redirect(new URL(home, origin))
        }
        if (requested === '/vendor/get-started' && (role !== 'vendor' || isStaff)) {
          return NextResponse.redirect(new URL(home, origin))
        }
        return NextResponse.redirect(new URL(requested, origin))
      }
    }
  }
  return NextResponse.redirect(new URL('/auth/login?error=auth_failed', origin))
}
