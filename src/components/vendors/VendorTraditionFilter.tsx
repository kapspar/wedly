import { weddingTraditions } from '@/lib/vendors/traditions'

export default function VendorTraditionFilter({ path, tradition, filters }: {
  path: string
  tradition?: string
  filters: Record<string, string | undefined>
}) {
  return (
    <form action={path} method="get" className="mb-6 rounded-2xl border border-border-soft bg-white p-4">
      {Object.entries(filters).map(([name, value]) => value && <input key={name} type="hidden" name={name} value={value} />)}
      <label htmlFor="wedding-tradition" className="block text-sm font-semibold text-plum">Wedding tradition</label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <select id="wedding-tradition" name="tradition" defaultValue={tradition ?? ''}
          className="min-h-11 w-full min-w-0 rounded-xl border border-border-soft bg-white px-3 text-base text-ink sm:max-w-xs">
          <option value="">All traditions</option>
          {weddingTraditions.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <button className="min-h-11 rounded-xl bg-plum px-4 text-sm font-semibold text-white" type="submit">Apply filter</button>
      </div>
      <p className="mt-2 text-xs text-muted">Experience is reported by each vendor.</p>
    </form>
  )
}
