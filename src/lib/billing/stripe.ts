import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export type BillingInterval = 'month' | 'year'

// Stripe is intentionally TEST MODE ONLY until PlanWedly is ready to accept payments.
// Never put Stripe keys or service-role keys behind NEXT_PUBLIC_ variables.
export function stripeTestConfig() {
  const secret = process.env.STRIPE_SECRET_KEY
  const monthPrice = process.env.STRIPE_PRICE_MONTHLY
  const yearPrice = process.env.STRIPE_PRICE_YEARLY
  if (!secret?.startsWith('sk_test_') || !monthPrice?.startsWith('price_') || !yearPrice?.startsWith('price_')) {
    throw new Error('Stripe test mode is not configured. Check server-side Stripe keys and price IDs.')
  }
  return { secret, monthPrice, yearPrice }
}

export function billingAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Server-side billing database credentials are missing.')
  return createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function stripePost(path: string, form: URLSearchParams, idempotencyKey?: string) {
  const { secret } = stripeTestConfig()
  const response = await fetch('https://api.stripe.com/v1/' + path, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + secret,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: form.toString(),
    cache: 'no-store',
  })
  const data: unknown = await response.json()
  if (!response.ok) {
    const detail = data && typeof data === 'object' && 'error' in data
      ? (data as { error?: { message?: string } }).error?.message
      : undefined
    throw new Error(detail || 'Stripe request failed.')
  }
  return data as { id: string; url?: string; customer?: string }
}

export function validOrigin(request: Request) {
  const origin = request.headers.get('origin')
  const expected = new URL(request.url).origin
  // Browsers send Origin for these POST requests. Restrict to same-origin.
  return origin === expected
}

export function isPremium(status: string | null | undefined) {
  return status === 'active'
}
