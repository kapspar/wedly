'use client'

import { useState } from 'react'

export default function BillingActions({ vendorId, status, enabled }: {
  vendorId: string
  status: string | null
  enabled: boolean
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const active = !!status && ['active', 'past_due', 'unpaid', 'incomplete', 'trialing'].includes(status)

  async function openBilling(route: 'checkout' | 'portal', interval?: 'month' | 'year') {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/billing/' + route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, ...(interval ? { interval } : {}) }),
      })
      const data = await response.json() as { url?: string; error?: string }
      if (!response.ok || !data.url) throw new Error(data.error ?? 'Billing could not be opened.')
      window.location.assign(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Billing unavailable.')
      setBusy(false)
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-border-soft bg-primary-soft/20 p-4">
      <p className="font-medium text-plum">Premium · Stripe test mode</p>
      <p className="mt-1 text-sm text-muted">$29 CAD/month or $290 CAD/year (two months free). No free trial.</p>
      <p className="mt-1 text-xs text-muted">
        {status ? `Stripe subscription: ${status.replaceAll('_', ' ')}` : 'Currently on the free plan.'}
      </p>
      {!enabled ? (
        <p className="mt-3 text-sm text-muted">Premium test checkout is not configured yet. Your free listing remains available.</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {active ? (
            <button type="button" disabled={busy} onClick={() => void openBilling('portal')}
              className="rounded-xl border border-primary px-4 py-2 text-sm font-medium text-plum disabled:opacity-50">
              Manage test billing
            </button>
          ) : (
            <>
              <button type="button" disabled={busy} onClick={() => void openBilling('checkout', 'month')}
                className="rounded-xl bg-plum px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                Test monthly checkout
              </button>
              <button type="button" disabled={busy} onClick={() => void openBilling('checkout', 'year')}
                className="rounded-xl border border-primary px-4 py-2 text-sm font-medium text-plum disabled:opacity-50">
                Test annual checkout
              </button>
            </>
          )}
        </div>
      )}
      {busy && <p role="status" className="mt-2 text-sm text-muted">Opening Stripe…</p>}
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  )
}
