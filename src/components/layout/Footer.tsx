import Link from 'next/link'
import { Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="h-5 w-5 text-peach" fill="currentColor" />
              <span className="font-[family-name:var(--font-script)] text-xl text-white">
                Wedly
              </span>
            </div>
            <p className="text-sm text-white/60 max-w-sm">
              Helping couples plan meaningful weddings with confidence. Discover
              trusted vendors, manage your budget, and celebrate your story.
            </p>
          </div>

          <div>
            <h4 className="font-[family-name:var(--font-heading)] text-white text-sm font-semibold mb-3">
              Explore
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/vendors"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Browse Vendors
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/signup"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Start Planning
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-[family-name:var(--font-heading)] text-white text-sm font-semibold mb-3">
              Company
            </h4>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-white/40">
                  Toronto, Canada
                </span>
              </li>
              <li>
                <span className="text-sm text-white/40">
                  Serving the GTA Tamil Community
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} Wedly. Love. Plan. Celebrate.
          </p>
        </div>
      </div>
    </footer>
  )
}
