'use client'

import { useState, useEffect } from 'react'
import { CalendarDays, Plus, Trash2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { EVENT_TYPES } from '@/lib/constants'
import type { EventType } from '@/lib/types/database'

interface WeddingEvent {
  id: string
  event_type: EventType
  custom_label: string | null
  event_date: string | null
  event_time: string | null
  venue_name: string | null
  notes: string | null
  sort_order: number
  isNew?: boolean
}

export default function EventsPage() {
  const [events, setEvents] = useState<WeddingEvent[]>([])
  const [weddingId, setWeddingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: wedding } = await supabase
        .from('weddings')
        .select('id')
        .eq('couple_id', user.id)
        .single()

      if (!wedding) return
      setWeddingId(wedding.id)

      const { data } = await supabase
        .from('wedding_events')
        .select('*')
        .eq('wedding_id', wedding.id)
        .order('sort_order')

      if (data) setEvents(data)
      setLoading(false)
    }
    load()
  }, [])

  const addEvent = () => {
    setEvents(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        event_type: 'other',
        custom_label: '',
        event_date: null,
        event_time: null,
        venue_name: null,
        notes: null,
        sort_order: prev.length,
        isNew: true,
      },
    ])
  }

  const removeEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const updateEvent = (id: string, field: string, value: string | null) => {
    setEvents(prev =>
      prev.map(e => (e.id === id ? { ...e, [field]: value } : e))
    )
  }

  const handleSave = async () => {
    if (!weddingId) return
    setSaving(true)
    const supabase = createClient()

    await supabase.from('wedding_events').delete().eq('wedding_id', weddingId)

    const inserts = events.map((e, i) => ({
      wedding_id: weddingId,
      event_type: e.event_type,
      custom_label: e.custom_label || null,
      event_date: e.event_date || null,
      event_time: e.event_time || null,
      venue_name: e.venue_name || null,
      notes: e.notes || null,
      sort_order: i,
    }))

    if (inserts.length > 0) {
      await supabase.from('wedding_events').insert(inserts)
    }

    setSaving(false)
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-[family-name:var(--font-heading)] text-2xl text-charcoal flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-rose-gold" />
              Wedding Events
            </h1>
            <div className="flex gap-2">
              <Button onClick={addEvent} variant="outline" size="sm">
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
              <Button onClick={handleSave} loading={saving} size="sm">
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-charcoal/40">Loading...</div>
          ) : events.length === 0 ? (
            <Card className="p-8 text-center">
              <CalendarDays className="h-8 w-8 text-peach mx-auto mb-3" />
              <p className="text-sm text-charcoal/50 mb-4">No events planned yet</p>
              <Button onClick={addEvent} variant="outline" size="sm">
                <Plus className="h-4 w-4" />
                Add your first event
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id} className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <select
                      value={event.event_type}
                      onChange={(e) => updateEvent(event.id, 'event_type', e.target.value)}
                      className="text-sm font-medium text-charcoal bg-transparent border-b border-peach-light focus:outline-none focus:border-rose-gold"
                    >
                      {EVENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeEvent(event.id)}
                      className="text-charcoal/30 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {event.event_type === 'other' && (
                      <Input
                        placeholder="Event name"
                        value={event.custom_label ?? ''}
                        onChange={(e) => updateEvent(event.id, 'custom_label', e.target.value)}
                      />
                    )}
                    <Input
                      type="date"
                      label="Date"
                      value={event.event_date ?? ''}
                      onChange={(e) => updateEvent(event.id, 'event_date', e.target.value)}
                    />
                    <Input
                      type="time"
                      label="Time"
                      value={event.event_time ?? ''}
                      onChange={(e) => updateEvent(event.id, 'event_time', e.target.value)}
                    />
                    <Input
                      placeholder="Venue"
                      label="Venue"
                      value={event.venue_name ?? ''}
                      onChange={(e) => updateEvent(event.id, 'venue_name', e.target.value)}
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
