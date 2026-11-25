import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Plans from './Plans'
export const metadata={title:'Wedding planning templates'}
export default function PlanPage(){
 return <><Navbar/><main className="flex-1 bg-ivory"><div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
 <Link href="/dashboard" className="text-sm text-primary hover:underline">← Wedding dashboard</Link>
 <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl text-plum sm:text-4xl">Wedding plan templates</h1>
 <p className="mb-7 mt-3 text-sm text-muted">A head start for your wedding. Choose a suggested plan or share a safe, reusable version of your own.</p>
 <Plans/>
 </div></main><Footer/></>
}
