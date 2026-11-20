import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { billingAdmin, stripeTestConfig } from '@/lib/billing/stripe'

export const runtime = 'nodejs'

type StripeSubscription = {
  id: string
  customer: string | { id: string }
  status: string
  cancel_at_period_end?: boolean
  metadata?: Record<string, string>
  items?: { data?: Array<{ price?: { id: string }; current_period_end?: number }> }
}

type StripeEvent = {
  id: string
  type: string
  livemode: boolean
  created: number
  data: { object: StripeSubscription }
}

function verifySignature(body: string, signatureHeader: string, secret: string) {
  const parts = signatureHeader.split(',').map(part => part.trim())
  const timestamp = parts.find(part => part.startsWith('t='))?.slice(2)
  const signatures = parts.filter(part => part.startsWith('v1=')).map(part => part.slice(3))
  if (!timestamp || !/^\d+$/.test(timestamp) || !signatures.length) return false
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false
  const digest = createHmac('sha256', secret).update(timestamp + '.' + body).digest()
  return signatures.some(signature => {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false
    const candidate = Buffer.from(signature, 'hex')
    return candidate.length === digest.length && timingSafeEqual(candidate, digest)
  })
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret?.startsWith('whsec_')) return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  const header = request.headers.get('stripe-signature') ?? ''
  const body = await request.text()
  if (Buffer.byteLength(body, 'utf8') > 1024 * 1024 || !verifySignature(body, header, secret)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  let event: StripeEvent
  try { event = JSON.parse(body) as StripeEvent } catch { return NextResponse.json({ error: 'Invalid event' }, { status: 400 }) }
  if (!event.id || !event.type || event.livemode !== false || !Number.isFinite(event.created)) {
    return NextResponse.json({ error: 'Only valid Stripe test events are accepted' }, { status: 400 })
  }
  if (!['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
    return NextResponse.json({ received: true })
  }

  let ledgerInserted = false
  let processingStep = 'initializing'
  try {
    const admin = billingAdmin()
    processingStep = 'recording event id'
    const { error: ledgerError } = await admin.from('stripe_webhook_events').insert({ event_id: event.id })
    if (ledgerError?.code === '23505') return NextResponse.json({ received: true, duplicate: true })
    if (ledgerError) throw ledgerError
    ledgerInserted = true

    const subscription = event.data.object
    const vendorId = subscription.metadata?.vendor_id
    const ownerId = subscription.metadata?.owner_id
    if (!vendorId || !ownerId || !subscription.id) {
      // A different Stripe product or manually managed subscription.
      return NextResponse.json({ received: true, skipped: true })
    }
    processingStep = 'looking up verified vendor'
    const { data: vendor, error: vendorError } = await admin.from('vendors')
      .select('id,claimed_by,is_claimed').eq('id', vendorId).maybeSingle()
    if (vendorError) throw vendorError
    if (!vendor || !vendor.is_claimed || vendor.claimed_by !== ownerId) {
      return NextResponse.json({ received: true, skipped: true })
    }

    const { monthPrice, yearPrice } = stripeTestConfig()
    const price = subscription.items?.data?.[0]?.price?.id ?? null
    if (price !== monthPrice && price !== yearPrice) {
      return NextResponse.json({ received: true, skipped: true })
    }
    const customerId = typeof subscription.customer === 'string'
      ? subscription.customer : subscription.customer?.id
    if (!customerId) throw new Error('Subscription is missing a Stripe customer.')

    processingStep = 'looking up current subscription'
    const { data: current, error: lookupError } = await admin.from('vendor_subscriptions')
      .select('last_stripe_event_at,stripe_subscription_id').eq('vendor_id', vendorId).maybeSingle()
    if (lookupError) throw lookupError
    if (current?.stripe_subscription_id && current.stripe_subscription_id !== subscription.id) {
      // Do not overwrite an existing subscription with a different subscription.
      return NextResponse.json({ received: true, skipped: true })
    }
    const incomingTime = new Date(event.created * 1000)
    if (current?.last_stripe_event_at && new Date(current.last_stripe_event_at) > incomingTime) {
      return NextResponse.json({ received: true, stale: true })
    }

    const periodEnd = subscription.items?.data?.[0]?.current_period_end
    processingStep = 'upserting subscription'
    const { error: upsertError } = await admin.from('vendor_subscriptions').upsert({
      vendor_id: vendorId,
      owner_id: ownerId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: price,
      billing_interval: price === monthPrice ? 'month' : 'year',
      status: event.type === 'customer.subscription.deleted' ? 'canceled' : subscription.status,
      cancel_at_period_end: !!subscription.cancel_at_period_end,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      last_stripe_event_at: incomingTime.toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'vendor_id' })
    if (upsertError) throw upsertError
    return NextResponse.json({ received: true })
  } catch (error) {
    const details = error && typeof error === 'object' ? error as { code?: unknown; message?: unknown } : null
    console.error('Stripe test webhook processing failed:', {
      step: processingStep,
      code: typeof details?.code === 'string' ? details.code : undefined,
      message: typeof details?.message === 'string' ? details.message : error instanceof Error ? error.message : 'unknown',
    })
    if (ledgerInserted && event?.id) {
      // Allow Stripe retries after transient processing errors.
      try { await billingAdmin().from('stripe_webhook_events').delete().eq('event_id', event.id) } catch {}
    }
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
