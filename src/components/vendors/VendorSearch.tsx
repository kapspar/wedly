'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Search } from 'lucide-react'

export default function VendorSearch({
  basePath,
  initialQuery = '',
}: {
  basePath: string
  initialQuery?: string
}) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) {
      params.set('q', query.trim())
    }
    const qs = params.toString()
    router.push(qs ? `${basePath}?${qs}` : basePath)
  }

  return (
    <form onSubmit={handleSearch} role="search" className="relative flex gap-2">
      <label htmlFor="vendor-search" className="sr-only">
        Search vendors
      </label>
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/40 pointer-events-none" aria-hidden="true" />
        <input
          id="vendor-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search vendors..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-peach-light bg-white text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-rose-gold/50 focus:border-rose-gold transition-colors"
        />
      </div>
      <button
        type="submit"
        className="px-5 py-3 rounded-xl bg-rose-gold text-white text-sm font-medium hover:bg-rose-gold-dark transition-colors flex-shrink-0"
      >
        Search
      </button>
    </form>
  )
}
