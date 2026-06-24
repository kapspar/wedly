'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface Props {
  vendorId: string
  vendorName: string
  userId?: string
}

export default function InquiryForm({ vendorId, vendorName, userId }: Props) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [guestCount, setGuestCount] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  if (!userId) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-charcoal/60 mb-3">
          Sign in to send an inquiry to {vendorName}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/auth/login?redirect=/vendor/${vendorId}`)}
        >
          Sign in
        </Button>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: insertError } = await supabase.from('inquiries').insert({
      vendor_id: vendorId,
      couple_id: userId,
      message: message.trim(),
      event_date: eventDate || null,
      guest_count: guestCount ? parseInt(guestCount) : null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setMessage('')
    setEventDate('')
    setGuestCount('')
  }

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 rounded-full bg-sage/20 flex items-center justify-center mx-auto mb-3">
          <Send className="h-5 w-5 text-sage-dark" />
        </div>
        <p className="text-sm font-medium text-charcoal mb-1">Inquiry sent!</p>
        <p className="text-xs text-charcoal/50">
          Your message has been sent to {vendorName}. You can track it from your dashboard.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="text-xs text-rose-gold mt-3 hover:text-rose-gold-dark"
        >
          Send another inquiry
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="eventDate"
          label="Event Date"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
        />
        <Input
          id="guestCount"
          label="Guest Count"
          type="number"
          value={guestCount}
          onChange={(e) => setGuestCount(e.target.value)}
          placeholder="Approx. guests"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="message" className="block text-sm font-medium text-charcoal/80">
          Message
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Tell ${vendorName} about your wedding and what you're looking for...`}
          rows={4}
          required
          className="w-full rounded-xl border border-peach-light bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-rose-gold/50 focus:border-rose-gold transition-colors resize-none"
        />
      </div>
      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}
      <Button type="submit" loading={loading} className="w-full">
        <Send className="h-4 w-4" />
        Send Inquiry
      </Button>
    </form>
  )
}
