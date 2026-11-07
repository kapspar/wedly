'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Check } from 'lucide-react'
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
  const [checkingAccount, setCheckingAccount] = useState(true)

  useEffect(() => {
    let active = true
    const checkAccount = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!active) return
      if (!user) { router.replace('/auth/login?redirect=/onboarding'); return }
      const { data: wedding, error: lookupError } = await supabase.from('weddings')
        .select('id').eq('couple_id', user.id).limit(1).maybeSingle()
      if (!active) return
      if (lookupError) { setError('Unable to verify your wedding. Please refresh.'); setCheckingAccount(false); return }
      if (wedding) { router.replace('/dashboard'); return }
      setCheckingAccount(false)
    }
    void checkAccount()
    return () => { active = false }
  }, [router])

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
    if (checkingAccount) return
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

    const { data: existingWedding, error: existingError } = await supabase.from('weddings')
      .select('id').eq('couple_id', user.id).limit(1).maybeSingle()
    if (existingError) { setError(existingError.message); setLoading(false); return }
    if (existingWedding) { router.replace('/dashboard'); return }

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

  if (checkingAccount) {
    return <div className="min-h-screen bg-ivory flex items-center justify-center text-plum" role="status">Checking your wedding…</div>
  }

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <div className="flex items-center justify-center pt-5 pb-4 sm:py-6">
        <span className="font-[family-name:var(--font-logo)] text-3xl italic font-light tracking-wide text-plum">Wedly</span>
      </div>

      {/* Progress */}
      <div className="max-w-lg mx-auto w-full px-4 mb-5 sm:mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                  i < step
                    ? 'bg-primary text-white'
                    : i === step
                      ? 'bg-primary text-white'
                      : 'bg-primary-soft text-muted'
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-6 sm:w-12 mx-1',
                    i < step ? 'bg-primary' : 'bg-primary-soft'
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {STEPS.map((s) => (
            <span key={s} className="text-[10px] text-muted hidden sm:block">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 pb-6 sm:pb-8">
        <Card className="w-full max-w-lg p-5 sm:p-8">
          {/* Step 0: Names */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="font-[family-name:var(--font-heading)] text-xl text-ink">
                  Tell us about you
                </h2>
                <p className="text-sm text-muted mt-1">
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
                <h2 className="font-[family-name:var(--font-heading)] text-xl text-ink">
                  Wedding Type
                </h2>
                <p className="text-sm text-muted mt-1">
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
                        ? 'border-primary bg-primary-soft/40'
                        : 'border-border-soft hover:border-border-soft'
                    )}
                  >
                    <span className="font-medium text-sm text-ink">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Date */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="font-[family-name:var(--font-heading)] text-xl text-ink">
                  Wedding Date
                </h2>
                <p className="text-sm text-muted mt-1">Do you have a date in mind?</p>
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
                        ? 'border-primary bg-primary-soft/40'
                        : 'border-border-soft hover:border-border-soft'
                    )}
                  >
                    <span className="font-medium text-sm text-ink">{opt.label}</span>
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
                <p className="text-sm text-muted bg-primary-soft/50 rounded-xl p-3">
                  We&apos;re working on an auspicious date service — we&apos;ll notify you when it&apos;s ready!
                </p>
              )}
            </div>
          )}

          {/* Step 3: Events */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="font-[family-name:var(--font-heading)] text-xl text-ink">
                  Wedding Events
                </h2>
                <p className="text-sm text-muted mt-1">
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
                        ? 'border-primary bg-primary-soft/40 text-ink'
                        : 'border-border-soft text-muted hover:border-border-soft'
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
                <h2 className="font-[family-name:var(--font-heading)] text-xl text-ink">
                  Budget Setup
                </h2>
                <p className="text-sm text-muted mt-1">
                  Set your budget for each category (you can adjust later)
                </p>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {BUDGET_CATEGORIES.map((cat) => (
                  <div
                    key={cat.key}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl border border-border-soft"
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
                    <span className="text-sm text-ink flex-1">{cat.label}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted">$</span>
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
                        className="w-24 text-right text-sm bg-transparent border-none focus:outline-none disabled:text-muted"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center pt-2 border-t border-border-soft">
                <p className="text-sm text-muted">
                  Total Budget:{' '}
                  <span className="font-semibold text-ink">
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
          <div className="flex justify-between gap-3 mt-6 sm:mt-8">
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
