import 'server-only'
import { billingAdmin } from '@/lib/billing/stripe'

export type ListingEntitlements = {
  verified: boolean
  premiumPreview: boolean
}

/**
 * Only an approved/claimed listing can display Verified Business.
 * Stripe is TEST MODE ONLY. Premium is intentionally marked as a preview:
 * test purchases cannot be represented as real paid endorsements.
 * All entitlements are computed on the server, never accepted from clients.
 */
export async function vendorEntitlements(vendors: Array<{
  id: string
  claimed_by?: string | null
  is_claimed?: boolean | null
}>) {
  const result = new Map<string, ListingEntitlements>()
  for (const vendor of vendors) {
    result.set(vendor.id, {
      verified: vendor.is_claimed === true && !!vendor.claimed_by,
      premiumPreview: false,
    })
  }

  const eligible = vendors.filter(vendor => result.get(vendor.id)?.verified)
  if (!eligible.length || !process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) return result

  const { data, error } = await billingAdmin().from('vendor_subscriptions')
    .select('vendor_id,owner_id,status,stripe_subscription_id')
    .in('vendor_id', eligible.map(vendor => vendor.id))
  if (error) {
    console.error('Could not resolve listing entitlements:', error.code)
    return result
  }

  const byId = new Map(eligible.map(vendor => [vendor.id, vendor]))
  for (const subscription of data ?? []) {
    const vendor = byId.get(subscription.vendor_id)
    if (vendor && vendor.claimed_by === subscription.owner_id &&
        subscription.status === 'active' && !!subscription.stripe_subscription_id) {
      result.set(vendor.id, { verified: true, premiumPreview: true })
    }
  }
  return result
}
