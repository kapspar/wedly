import posthog from 'posthog-js'

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

if (token && host) {
  posthog.init(token, {
    api_host: host,
    defaults: '2026-08-30',
    capture_exceptions: true,
    opt_out_capturing_by_default: true,
    autocapture: false,
    disable_session_recording: true,
    mask_all_text: true,
    mask_all_element_attributes: true,
    before_send: (event) => {
      // Keep search terms and other URL query parameters out of analytics.
      if (event?.properties) {
        for (const key of ['$current_url', '$referrer', '$initial_referrer']) {
          const value = event.properties[key]
          if (typeof value === 'string') {
            try {
              const url = new URL(value)
              event.properties[key] = url.origin + url.pathname
            } catch {
              // Leave non-URL values unchanged.
            }
          }
        }
      }
      return event
    },
    debug: process.env.NODE_ENV === 'development',
  })
} else if (process.env.NODE_ENV === 'development') {
  const missingVariable = token
    ? 'NEXT_PUBLIC_POSTHOG_HOST'
    : 'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN'

  throw new Error(
    `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`
  )
}
