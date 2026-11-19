import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs'

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

if ((!token || !host) && process.env.NODE_ENV !== 'production') {
  const missingVariable = token
    ? 'NEXT_PUBLIC_POSTHOG_HOST'
    : 'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN'

  console.warn(
    `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`
  )
}

export const posthogLoggerProvider = token && host
  ? new LoggerProvider({
      resource: resourceFromAttributes({ 'service.name': 'wedly' }),
      processors: [
        new BatchLogRecordProcessor({
          exporter: new OTLPLogExporter({
            url: `${host}/i/v1/logs`,
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }),
        }),
      ],
    })
  : undefined

// This isolated logger keeps existing application logs out of PostHog.
export const posthogLogger = posthogLoggerProvider?.getLogger('wedly-posthog')

export function register() {
  // The provider is intentionally not registered globally: only log lines added here are exported.
}
