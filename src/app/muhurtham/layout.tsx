import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Muhurtham Service Preview',
  robots: { index: false, follow: false },
}

export default function MuhurthamLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
