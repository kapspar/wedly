import Link from 'next/link'
import { MapPin, ExternalLink } from 'lucide-react'
import Card from '@/components/ui/Card'

interface VendorCardProps {
  vendor: {
    slug: string
    name: string
    description: string | null
    city: string
    area: string | null
    pricing_range: string | null
    is_featured: boolean
  }
  categorySlug?: string
}

export default function VendorCard({ vendor }: VendorCardProps) {
  return (
    <Link href={`/vendor/${vendor.slug}`}>
      <Card hover className="overflow-hidden h-full flex flex-col">
        <div className="h-40 bg-gradient-to-br from-peach-light to-peach/30 flex items-center justify-center relative">
          <span className="font-[family-name:var(--font-script)] text-3xl text-rose-gold/40">
            {vendor.name.charAt(0)}
          </span>
          {vendor.is_featured && (
            <span className="absolute top-3 right-3 bg-rose-gold text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
              Featured
            </span>
          )}
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-[family-name:var(--font-heading)] text-base text-charcoal mb-1">
            {vendor.name}
          </h3>
          <div className="flex items-center gap-1 text-xs text-charcoal/50 mb-2">
            <MapPin className="h-3 w-3" />
            {vendor.city}
            {vendor.area && `, ${vendor.area}`}
          </div>
          {vendor.description && (
            <p className="text-xs text-charcoal/60 line-clamp-2 flex-1">
              {vendor.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-peach-light/50">
            {vendor.pricing_range ? (
              <span className="text-xs text-charcoal/50">{vendor.pricing_range}</span>
            ) : (
              <span className="text-xs text-charcoal/30">Contact for pricing</span>
            )}
            <ExternalLink className="h-3.5 w-3.5 text-rose-gold" />
          </div>
        </div>
      </Card>
    </Link>
  )
}
