'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

export default function VendorAnalytics({ vendorId }: { vendorId: string }) {
  useEffect(() => {
    posthog.capture('vendor_profile_viewed', { vendor_id: vendorId })

    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const link = target.closest('a[data-analytics-outbound]')
      if (!link) return
      const destination = link.getAttribute('data-analytics-outbound')
      if (destination === 'instagram' || destination === 'website') {
        posthog.capture('vendor_outbound_clicked', {
          vendor_id: vendorId,
          destination,
        })
      }
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [vendorId])

  return null
}
