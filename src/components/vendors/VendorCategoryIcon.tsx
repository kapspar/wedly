'use client'

import {
  Building2,
  Camera,
  Video,
  Palette,
  Music,
  Flame,
  Sparkles,
  Flower2,
  Gem,
  Plane,
  UtensilsCrossed,
  Car,
  type LucideProps,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  Building2,
  Camera,
  Video,
  Palette,
  Music,
  Flame,
  Sparkles,
  Flower2,
  Gem,
  Plane,
  UtensilsCrossed,
  Car,
}

interface Props extends LucideProps {
  icon: string | null
}

export default function VendorCategoryIcon({ icon, ...props }: Props) {
  const Icon = icon ? iconMap[icon] : null
  if (!Icon) return null
  return <Icon {...props} />
}
