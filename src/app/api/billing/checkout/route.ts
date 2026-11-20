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

    // Check Stripe directly as well as Supabase. Subscription webhooks can be
    // delayed, so the local record alone is not sufficient for paid checkout.
    const config = stripeTestConfig()
    const search = new URL('https://api.stripe.com/v1/subscriptions/search')
    search.searchParams.set('query', `metadata['vendor_id']:'${vendorId}'`)
    search.searchParams.set('limit', '100')
    const lookup = await fetch(search, {
      headers: { Authorization: `Bearer ${config.secret}` },
      cache: 'no-store',
    })
    if (!lookup.ok) throw new Error('Could not verify active Stripe subscriptions.')
    const found = await lookup.json() as {
      data?: Array<{ status: string; items?: { data?: Array<{ price?: { id: string } }> } }>
      has_more?: boolean
    }
    // Fail closed rather than potentially creating a duplicate if the query
    // is incomplete. In normal operation there are far fewer than 100.
    if (found.has_more) throw new Error('Subscription lookup needs manual review.')
    if (found.data?.some(subscription =>
      subscription.items?.data?.some(item =>
        item.price?.id === config.monthPrice || item.price?.id === config.yearPrice
      ) && !['canceled', 'incomplete_expired'].includes(subscription.status)
    )) {
      return NextResponse.json({
        error: 'An active or pending Stripe subscription already exists for this business. Use Manage test billing.',
      }, { status: 409 })
    }

    // One atomic reservation per listing. This closes the window in which
    // multiple checkouts could be opened before their webhooks were delivered.
    const { data: reservationToken, error: reservationError } = await admin.rpc(
      'reserve_vendor_checkout', { p_vendor_id: vendorId, p_owner_id: user.id }
    )
    if (reservationError) throw reservationError
    if (!reservationToken) {
      return NextResponse.json({
        error: 'A test checkout is already open for this business. Complete it or retry after the 35-minute reservation expires.',
      }, { status: 409 })
    }

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
    // Stripe sessions cannot outlive the reservation: 31-minute Checkout,
    // 35-minute reservation to cover webhook delivery and clock skew.
    form.set('expires_at', String(Math.floor(Date.now() / 1000) + 31 * 60))
    let session: { id: string; url?: string }
    try {
      session = await stripePost('checkout/sessions', form,
        'pw-test-checkout-' + vendorId + '-' + reservationToken)
      if (!session.url || !session.url.startsWith('https://checkout.stripe.com/')) {
        throw new Error('Stripe did not provide a checkout URL.')
      }
    } catch (error) {
      // Failed Stripe requests should not block a new checkout for 35 minutes.
      await admin.from('vendor_checkout_reservations').delete()
        .eq('vendor_id', vendorId).eq('reservation_token', reservationToken)
      throw error
    }
    const { error: saveError } = await admin.from('vendor_checkout_reservations')
      .update({ stripe_session_id: session.id })
      .eq('vendor_id', vendorId).eq('reservation_token', reservationToken)
    if (saveError) throw saveError
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe test checkout failed:', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: 'Test checkout unavailable. Verify Stripe test configuration.' }, { status: 503 })
  }
}
