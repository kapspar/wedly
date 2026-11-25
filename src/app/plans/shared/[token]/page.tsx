import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Plans from '../../Plans'
export const metadata={title:'Shared wedding planning template',robots:{index:false,follow:false}}
export default async function SharedPlanPage({params}:{params:Promise<{token:string}>}){
 const {token}=await params
 return <><Navbar/><main className="flex-1 bg-ivory"><div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
 <h1 className="font-[family-name:var(--font-heading)] text-3xl text-plum">A wedding plan to make your own</h1>
 <p className="mb-7 mt-3 text-sm text-muted">Copy the checklist, events and budget categories as a starting point for your own wedding.</p>
 <Plans sharedToken={token}/>
 </div></main><Footer/></>
}
