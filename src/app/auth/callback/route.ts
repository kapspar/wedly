import { SeverityNumber } from '@opentelemetry/api-logs'
import { after, NextResponse } from 'next/server'
import { posthogLogger, posthogLoggerProvider } from '../../../../instrumentation'
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

  posthogLogger?.emit({
    body: 'Authentication callback received',
    severityNumber: SeverityNumber.INFO,
    attributes: {
      endpoint: '/auth/callback',
      has_authorization_code: Boolean(code),
    },
  })

  after(() => posthogLoggerProvider?.forceFlush().catch(() => {}))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      posthogLogger?.emit({
        body: 'Authentication session established',
        severityNumber: SeverityNumber.INFO,
        attributes: { endpoint: '/auth/callback' },
      })

      if (redirect === '/onboarding') {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: wedding, error: lookupError } = await supabase.from('weddings')
            .select('id').eq('couple_id', user.id).limit(1).maybeSingle()
          if (lookupError) return NextResponse.redirect(new URL('/dashboard', origin))
          return NextResponse.redirect(new URL(wedding ? '/dashboard' : '/onboarding', origin))
        }
      }
      return NextResponse.redirect(new URL(redirect, origin))
    }

    posthogLogger?.emit({
      body: 'Authentication session exchange failed',
      severityNumber: SeverityNumber.WARN,
      attributes: { endpoint: '/auth/callback' },
    })
  }

  return NextResponse.redirect(new URL('/auth/login?error=auth_failed', origin))
}
