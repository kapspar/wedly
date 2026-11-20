import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { billingAdmin, stripePost, stripeTestConfig, validOrigin, type BillingInterval } from '@/lib/billing/stripe'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!validOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
  let payload: unknown
  try { payload = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { vendorId, interval } = (payload ?? {}) as { vendorId?: string; interval?: BillingInterval }
  if (!vendorId || !/^[0-9a-f-]{36}$/i.test(vendorId) || (interval !== 'month' && interval !== 'year')) {
    return NextResponse.json({ error: 'Invalid vendor or billing interval' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Sign in as a vendor first' }, { status: 401 })
    const { data: vendor } = await supabase.from('vendors')
      .select('id').eq('id', vendorId).eq('claimed_by', user.id).eq('is_claimed', true).maybeSingle()
    if (!vendor) return NextResponse.json({ error: 'Verified business ownership required' }, { status: 403 })

    const admin = billingAdmin()
    const { data: existing, error: lookupError } = await admin.from('vendor_subscriptions')
      .select('status,stripe_customer_id').eq('vendor_id', vendorId).maybeSingle()
    if (lookupError) throw lookupError
    if (existing && ['active', 'past_due', 'unpaid', 'incomplete', 'trialing'].includes(existing.status)) {
      return NextResponse.json({ error: 'A subscription already exists. Use Billing settings or contact support.' }, { status: 409 })
    }

    const config = stripeTestConfig()
    const form = new URLSearchParams()
    form.set('mode', 'subscription')
    form.set('line_items[0][price]', interval === 'month' ? config.monthPrice : config.yearPrice)
    form.set('line_items[0][quantity]', '1')
    form.set('client_reference_id', vendorId)
    form.set('metadata[vendor_id]', vendorId)
    form.set('metadata[owner_id]', user.id)
    form.set('subscription_data[metadata][vendor_id]', vendorId)
    form.set('subscription_data[metadata][owner_id]', user.id)
    if (existing?.stripe_customer_id) form.set('customer', existing.stripe_customer_id)
    else if (user.email) form.set('customer_email', user.email)
    const origin = new URL(request.url).origin
    form.set('success_url', origin + '/vendor/dashboard?billing=success')
    form.set('cancel_url', origin + '/vendor/dashboard?billing=cancelled')
    const session = await stripePost('checkout/sessions', form,
      'pw-test-checkout-' + vendorId + '-' + interval + '-' + Math.floor(Date.now() / 300000))
    if (!session.url || !session.url.startsWith('https://checkout.stripe.com/')) {
      throw new Error('Stripe did not provide a checkout URL.')
    }
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe test checkout failed:', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: 'Test checkout unavailable. Verify Stripe test configuration.' }, { status: 503 })
  }
}
