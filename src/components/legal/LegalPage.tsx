import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import type { ReactNode } from 'react'

export default function LegalPage({
  title, description, updated, sections, children,
}:{
  title:string
  description:string
  updated:string
  sections:{id:string;title:string;body:ReactNode}[]
  children?:ReactNode
}) {
  return <>
    <Navbar />
    <main className="min-h-[75vh] bg-ivory px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <nav aria-label="Legal pages" className="flex flex-wrap gap-4 text-sm text-primary">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="hover:underline">Terms of Service</Link>
        </nav>
        <header className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">PlanWedly · Legal information</p>
          <h1 className="mt-3 font-[family-name:var(--font-heading)] text-4xl text-plum sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted">{description}</p>
          <p className="mt-3 text-xs text-muted">Last updated: {updated}</p>
        </header>
        {children}
        <div className="mt-9 rounded-2xl border border-border-soft bg-white p-5 sm:p-7">
          <h2 className="text-sm font-semibold text-plum">On this page</h2>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {sections.map((section,index)=><li key={section.id}>
              <a href={`#${section.id}`} className="text-sm text-primary hover:underline">
                {index+1}. {section.title}
              </a>
            </li>)}
          </ol>
        </div>
        <div className="mt-7 space-y-5">
          {sections.map((section,index)=><section id={section.id} key={section.id} className="scroll-mt-28 rounded-2xl border border-border-soft bg-white p-6 sm:p-8">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl text-plum">{index+1}. {section.title}</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-ink [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
              {section.body}
            </div>
          </section>)}
        </div>
        <p className="mt-8 text-xs leading-6 text-muted">This page describes PlanWedly's current service. If you have questions, contact us using the details above. See the other legal page for related information.</p>
      </div>
    </main>
    <Footer />
  </>
}
