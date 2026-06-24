'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { cn, slugify } from '@/lib/utils'
import {
  WEDDING_TYPES,
  EVENT_TYPES,
  BUDGET_CATEGORIES,
  HINDU_DEFAULT_EVENTS,
  CHRISTIAN_DEFAULT_EVENTS,
  INTERFAITH_DEFAULT_EVENTS,
} from '@/lib/constants'
import type { WeddingType, EventType } from '@/lib/types/database'

const STEPS = ['Names', 'Wedding Type', 'Date', 'Events', 'Budget']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [partner1, setPartner1] = useState('')
  const [partner2, setPartner2] = useState('')
  const [weddingType, setWeddingType] = useState<WeddingType>('hindu')
  const [hasDate, setHasDate] = useState<'yes' | 'auspicious' | 'unsure'>('unsure')
  const [weddingDate, setWeddingDate] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<EventType[]>(HINDU_DEFAULT_EVENTS as EventType[])
  const [budgets, setBudgets] = useState<Record<string, { enabled: boolean; amount: number }>>(
    Object.fromEntries(
      BUDGET_CATEGORIES.map((c) => [c.key, { enabled: true, amount: c.default }])
    )
  )

  const handleTypeChange = (type: WeddingType) => {
    setWeddingType(type)
    const defaults =
      type === 'hindu'
        ? HINDU_DEFAULT_EVENTS
        : type === 'christian_catholic'
          ? CHRISTIAN_DEFAULT_EVENTS
          : INTERFAITH_DEFAULT_EVENTS
    setSelectedEvents(defaults as EventType[])
  }

  const toggleEvent = (event: EventType) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    )
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Please sign in to continue')
      setLoading(false)
      return
    }

    const slug = slugify(`${partner1}-and-${partner2}`)

    const { data: wedding, error: weddingError } = await supabase
      .from('weddings')
      .insert({
        couple_id: user.id,
        partner1_name: partner1,
        partner2_name: partner2,
        wedding_type: weddingType,
        wedding_date: hasDate === 'yes' && weddingDate ? weddingDate : null,
        seeking_auspicious_date: hasDate === 'auspicious',
        slug,
      })
      .select()
      .single()

    if (weddingError) {
      setError(weddingError.message)
      setLoading(false)
      return
    }

    const eventInserts = selectedEvents.map((event, i) => ({
      wedding_id: wedding.id,
      event_type: event,
      sort_order: i,
    }))

    const budgetInserts = Object.entries(budgets)
      .filter(([, v]) => v.enabled)
      .map(([key, v]) => ({
        wedding_id: wedding.id,
        category: key,
        budgeted: v.amount,
        is_enabled: true,
      }))

    await Promise.all([
      supabase.from('wedding_events').insert(eventInserts),
      supabase.from('budget_categories').insert(budgetInserts),
    ])

    router.push('/dashboard')
    router.refresh()
  }

  const canNext =
    step === 0
      ? partner1.trim() && partner2.trim()
      : step === 1
        ? true
        : step === 2
          ? hasDate !== 'yes' || weddingDate
          : step === 3
            ? selectedEvents.length > 0
            : true

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <div className="flex items-center justify-center gap-2 py-6">
        <Heart className="h-6 w-6 text-rose-gold" fill="currentColor" />
        <span className="font-[family-name:var(--font-script)] text-2xl text-charcoal">Wedly</span>
      </div>

      {/* Progress */}
      <div className="max-w-lg mx-auto w-full px-4 mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                  i < step
                    ? 'bg-sage text-white'
                    : i === step
                      ? 'bg-rose-gold text-white'
                      : 'bg-peach-light text-charcoal/40'
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-6 sm:w-12 mx-1',
                    i < step ? 'bg-sage' : 'bg-peach-light'
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {STEPS.map((s) => (
            <span key={s} className="text-[10px] text-charcoal/40 hidden sm:block">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 pb-8">
        <Card className="w-full max-w-lg p-6 sm:p-8">
          {/* Step 0: Names */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="font-[family-name:var(--font-heading)] text-xl text-charcoal">
                  Tell us about you
                </h2>
                <p className="text-sm text-charcoal/60 mt-1">
                  What are the names of the happy couple?
                </p>
              </div>
              <Input
                id="partner1"
                label="Partner 1"
                placeholder="First name"
                value={partner1}
                onChange={(e) => setPartner1(e.target.value)}
              />
              <Input
                id="partner2"
                label="Partner 2"
                placeholder="First name"
                value={partner2}
                onChange={(e) => setPartner2(e.target.value)}
              />
            </div>
          )}

          {/* Step 1: Wedding Type */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="font-[family-name:var(--font-heading)] text-xl text-charcoal">
                  Wedding Type
                </h2>
                <p className="text-sm text-charcoal/60 mt-1">
                  This helps us personalize your planning experience
                </p>
              </div>
              <div className="space-y-3">
                {WEDDING_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => handleTypeChange(t.value)}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-xl border-2 transition-all',
                      weddingType === t.value
                        ? 'border-rose-gold bg-rose-gold/5'
                        : 'border-peach-light hover:border-peach'
                    )}
                  >
                    <span className="font-medium text-sm text-charcoal">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Date */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="font-[family-name:var(--font-heading)] text-xl text-charcoal">
                  Wedding Date
                </h2>
                <p className="text-sm text-charcoal/60 mt-1">Do you have a date in mind?</p>
              </div>
              <div className="space-y-3">
                {[
                  { value: 'yes' as const, label: 'Yes, we have a date' },
                  { value: 'auspicious' as const, label: 'Looking for an auspicious date' },
                  { value: 'unsure' as const, label: 'Not sure yet' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setHasDate(opt.value)}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-xl border-2 transition-all',
                      hasDate === opt.value
                        ? 'border-rose-gold bg-rose-gold/5'
                        : 'border-peach-light hover:border-peach'
                    )}
                  >
                    <span className="font-medium text-sm text-charcoal">{opt.label}</span>
                  </button>
                ))}
              </div>
              {hasDate === 'yes' && (
                <Input
                  id="weddingDate"
                  label="Wedding Date"
                  type="date"
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                />
              )}
              {hasDate === 'auspicious' && (
                <p className="text-sm text-charcoal/50 bg-peach-light/30 rounded-xl p-3">
                  We&apos;re working on an auspicious date service — we&apos;ll notify you when it&apos;s ready!
                </p>
              )}
            </div>
          )}

          {/* Step 3: Events */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="font-[family-name:var(--font-heading)] text-xl text-charcoal">
                  Wedding Events
                </h2>
                <p className="text-sm text-charcoal/60 mt-1">
                  Select the events you&apos;re planning
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {EVENT_TYPES.map((ev) => (
                  <button
                    key={ev.value}
                    onClick={() => toggleEvent(ev.value)}
                    className={cn(
                      'px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all',
                      selectedEvents.includes(ev.value)
                        ? 'border-rose-gold bg-rose-gold/5 text-charcoal'
                        : 'border-peach-light text-charcoal/50 hover:border-peach'
                    )}
                  >
                    {ev.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Budget */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="font-[family-name:var(--font-heading)] text-xl text-charcoal">
                  Budget Setup
                </h2>
                <p className="text-sm text-charcoal/60 mt-1">
                  Set your budget for each category (you can adjust later)
                </p>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {BUDGET_CATEGORIES.map((cat) => (
                  <div
                    key={cat.key}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl border border-peach-light"
                  >
                    <input
                      type="checkbox"
                      checked={budgets[cat.key].enabled}
                      onChange={(e) =>
                        setBudgets((prev) => ({
                          ...prev,
                          [cat.key]: { ...prev[cat.key], enabled: e.target.checked },
                        }))
                      }
                      className="accent-rose-gold w-4 h-4"
                    />
                    <span className="text-sm text-charcoal flex-1">{cat.label}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-charcoal/40">$</span>
                      <input
                        type="number"
                        value={budgets[cat.key].amount}
                        onChange={(e) =>
                          setBudgets((prev) => ({
                            ...prev,
                            [cat.key]: { ...prev[cat.key], amount: Number(e.target.value) },
                          }))
                        }
                        disabled={!budgets[cat.key].enabled}
                        className="w-24 text-right text-sm bg-transparent border-none focus:outline-none disabled:text-charcoal/30"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center pt-2 border-t border-peach-light">
                <p className="text-sm text-charcoal/60">
                  Total Budget:{' '}
                  <span className="font-semibold text-charcoal">
                    $
                    {Object.values(budgets)
                      .filter((b) => b.enabled)
                      .reduce((sum, b) => sum + b.amount, 0)
                      .toLocaleString()}
                  </span>
                </p>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mt-4">
              {error}
            </p>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} loading={loading}>
                Complete Setup
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
