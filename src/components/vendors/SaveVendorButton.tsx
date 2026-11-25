'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import posthog from 'posthog-js'
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

    const {data:wedding,error:lookupError}=await supabase.from('weddings').select('id').limit(1).maybeSingle()
    if(lookupError||!wedding){setLoading(false);router.push('/onboarding');return}

    if (saved) {
      const { error } = await supabase
        .from('wedding_vendor_shortlist')
        .delete()
        .eq('wedding_id', wedding.id)
        .eq('vendor_id', vendorId)
      if (!error) {
        setSaved(false)
        posthog.capture('vendor_unsaved')
      }
    } else {
      const { error } = await supabase
        .from('wedding_vendor_shortlist')
        .upsert({ wedding_id: wedding.id, vendor_id: vendorId }, {onConflict:'wedding_id,vendor_id',ignoreDuplicates:true})
      if (!error) {
        setSaved(true)
        posthog.capture('vendor_saved')
      }
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      aria-label={saved ? 'Remove from saved vendors' : 'Save vendor'}
      aria-pressed={saved}
      className={cn(
        'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all',
        saved
          ? 'bg-rose-gold text-white'
          : 'border-2 border-peach-light text-charcoal/60 hover:border-rose-gold hover:text-rose-gold'
      )}
    >
      <Bookmark className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
      {saved ? 'Shortlisted' : 'Shortlist'}
    </button>
  )
}
