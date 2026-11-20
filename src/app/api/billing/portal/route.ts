import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { billingAdmin, stripePost, validOrigin } from '@/lib/billing/stripe'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!validOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
  let body: { vendorId?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body?.vendorId || !/^[0-9a-f-]{36}$/i.test(body.vendorId)) {
    return NextResponse.json({ error: 'Invalid vendor' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
    const { data: vendor } = await supabase.from('vendors').select('id')
      .eq('id', body.vendorId).eq('claimed_by', user.id).eq('is_claimed', true).maybeSingle()
    if (!vendor) return NextResponse.json({ error: 'Business ownership required' }, { status: 403 })

    const { data: subscription, error } = await billingAdmin().from('vendor_subscriptions')
      .select('stripe_customer_id').eq('vendor_id', vendor.id).eq('owner_id', user.id).maybeSingle()
    if (error) throw error
    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe billing account for this listing' }, { status: 404 })
    }
    const form = new URLSearchParams()
    form.set('customer', subscription.stripe_customer_id)
    form.set('return_url', new URL(request.url).origin + '/vendor/dashboard')
    const portal = await stripePost('billing_portal/sessions', form)
    if (!portal.url || !portal.url.startsWith('https://billing.stripe.com/')) {
      throw new Error('Stripe did not provide a billing portal URL.')
    }
    return NextResponse.json({ url: portal.url })
  } catch (error) {
    console.error('Stripe test billing portal failed:', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: 'Billing portal unavailable' }, { status: 503 })
  }
}
