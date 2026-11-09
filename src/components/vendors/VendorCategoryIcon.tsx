'use client'

import Image from 'next/image'
import {
  Building2, Camera, Video, Palette, Music, Flame, Sparkles,
  Flower2, Gem, Plane, UtensilsCrossed, Car, type LucideProps,
} from 'lucide-react'

// These filenames match the approved artwork uploaded to public/icons.
const categoryArtwork: Record<string, string> = {
  Building2: 'Venues Icon.png',
  Camera: 'Photographers Icon.png',
  Video: 'Videographers Icon.png',
  Palette: 'Decorators Icon.png',
  Music: 'DJs Icon.png',
  Flame: 'Priests Icon.png',
  Sparkles: 'Makeup Artists Icon.png',
  Flower2: 'Florists Icon.png',
  Gem: 'Jewelers Icon.png',
  Plane: 'Travel Agents Icon.png',
  UtensilsCrossed: 'Caterers Icon.png',
  Car: 'Transportation Icon.png',
}

const fallbackIcons: Record<string, React.ComponentType<LucideProps>> = {
  Building2, Camera, Video, Palette, Music, Flame, Sparkles,
  Flower2, Gem, Plane, UtensilsCrossed, Car,
}

interface Props extends LucideProps {
  icon: string | null
}

export default function VendorCategoryIcon({ icon, className, ...props }: Props) {
  if (!icon) return null

  const artwork = categoryArtwork[icon]
  if (artwork) {
    return (
      <Image
        src={`/icons/${artwork}`}
        alt=""
        aria-hidden="true"
        width={96}
        height={96}
        className={`object-contain shrink-0 ${className ?? ''}`}
      />
    )
  }

  // Preserve support for any categories without matching uploaded artwork.
  const FallbackIcon = fallbackIcons[icon]
  return FallbackIcon ? <FallbackIcon className={className} {...props} /> : null
}
