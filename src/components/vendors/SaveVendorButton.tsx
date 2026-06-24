'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Props {
  vendorId: string
  initialSaved: boolean
  userId?: string
}

export default function SaveVendorButton({ vendorId, initialSaved, userId }: Props) {
  const router = useRouter()
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    if (!userId) {
      router.push('/auth/login')
      return
    }

    setLoading(true)
    const supabase = createClient()

    if (saved) {
      await supabase
        .from('saved_vendors')
        .delete()
        .eq('couple_id', userId)
        .eq('vendor_id', vendorId)
      setSaved(false)
    } else {
      await supabase
        .from('saved_vendors')
        .insert({ couple_id: userId, vendor_id: vendorId })
      setSaved(true)
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all',
        saved
          ? 'bg-rose-gold text-white'
          : 'border-2 border-peach-light text-charcoal/60 hover:border-rose-gold hover:text-rose-gold'
      )}
    >
      <Bookmark className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}
