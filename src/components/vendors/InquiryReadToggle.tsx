'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function InquiryReadToggle({ vendorId, inquiryId, unread }: {
  vendorId: string
  inquiryId: string
  unread: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  async function toggle() {
    setBusy(true)
    setNotice('')
    try {
      const result = await fetch('/api/vendor/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, inquiryId, read: unread }),
      })
      if (!result.ok) throw new Error()
      router.refresh()
    } catch {
      setNotice('Could not update the unread status. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return <div className="space-y-2">
    <button type="button" disabled={busy} onClick={() => void toggle()}
      className="min-h-11 rounded-xl border border-border-soft px-4 text-sm font-medium text-plum disabled:opacity-50">
      {busy ? 'Updating…' : unread ? 'Mark as read' : 'Mark as unread'}
    </button>
    {notice && <p role="alert" className="text-sm text-red-700">{notice}</p>}
  </div>
}
