import { BadgeCheck, Gem } from 'lucide-react'

export default function ListingBadges({
  verified = false,
  premiumPreview = false,
  compact = false,
}: {
  verified?: boolean
  premiumPreview?: boolean
  compact?: boolean
}) {
  if (!verified && !premiumPreview) return null
  const shared = `inline-flex items-center gap-1 rounded-full font-semibold ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`
  return <span className="inline-flex flex-wrap items-center gap-2">
    {verified && <span title="PlanWedly verified that the listing is claimed by its business owner. This is not a quality endorsement."
      className={`${shared} bg-blue-50 text-blue-800`}>
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true"/> Verified Business
    </span>}
    {premiumPreview && <span title="Test-mode Premium subscription. Paid benefits are being developed; this is not an endorsement of work quality."
      className={`${shared} bg-purple-50 text-purple-800`}>
      <Gem className="h-3.5 w-3.5" aria-hidden="true"/> Premium Preview
    </span>}
  </span>
}
