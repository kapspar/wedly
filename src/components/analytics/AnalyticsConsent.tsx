'use client'

import { useEffect, useState } from 'react'
import posthog from 'posthog-js'

const CONSENT_KEY = 'planwedly-analytics-consent'

type ConsentChoice = 'accepted' | 'declined' | null

export default function AnalyticsConsent() {
  const [choice, setChoice] = useState<ConsentChoice>(null)
  const [ready, setReady] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(CONSENT_KEY)
    if (stored === 'accepted') {
      setChoice('accepted')
      posthog.opt_in_capturing()
    } else if (stored === 'declined') {
      setChoice('declined')
      posthog.opt_out_capturing()
    }
    setReady(true)
  }, [])

  function choose(next: Exclude<ConsentChoice, null>) {
    window.localStorage.setItem(CONSENT_KEY, next)
    setChoice(next)
    setSettingsOpen(false)
    if (next === 'accepted') {
      posthog.opt_in_capturing()
      posthog.capture('$pageview')
    } else {
      posthog.opt_out_capturing()
    }
  }

  if (!ready) return null

  return (
    <>
      {choice && !settingsOpen && (
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="fixed bottom-3 left-3 z-[100] rounded-full border border-[#EADCE9] bg-white px-3 py-1.5 text-xs text-[#563454] shadow-sm hover:shadow-md"
        >
          Analytics settings
        </button>
      )}
      {(!choice || settingsOpen) && (
        <section
          role="dialog"
          aria-label="Analytics preferences"
          aria-modal="false"
          className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-xl rounded-2xl border border-[#EADCE9] bg-white p-5 shadow-xl"
        >
          <h2 className="mb-2 text-base font-semibold text-[#563454]">Help us improve PlanWedly</h2>
          <p className="mb-4 text-sm text-gray-700">
            With your permission, we use PostHog to understand page visits and actions like vendor
            searches, profile views, and contact clicks. We do not send your form entries, names,
            or email addresses as analytics properties. You can change your choice here anytime.
          </p>
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={() => choose('declined')}
              className="rounded-full border border-[#EADCE9] px-4 py-2 text-sm text-[#563454]">
              Decline
            </button>
            <button type="button" onClick={() => choose('accepted')}
              className="rounded-full bg-[#563454] px-4 py-2 text-sm font-medium text-white">
              Accept analytics
            </button>
          </div>
        </section>
      )}
    </>
  )
}
