import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Only allow local application paths after authentication.
function safeRedirect(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/dashboard'
  }
  return value
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = safeRedirect(searchParams.get('redirect'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Signup and login both land on the dashboard first. The dashboard
      // already sends couples without a wedding to onboarding.
      const destination = redirect === '/onboarding' || redirect === '/' ? '/dashboard' : redirect
      return NextResponse.redirect(new URL(destination, origin))
    }
  }

  return NextResponse.redirect(new URL('/auth/login?error=auth_failed', origin))
}
