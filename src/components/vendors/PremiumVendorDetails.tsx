import Card from '@/components/ui/Card'
import PremiumVideo from '@/components/vendors/PremiumVideo'
export type Package={title:string;description:string;starting_price_cad:number|null}
export type FAQ={question:string;answer:string}
export type PremiumData={packages:Package[];faqs:FAQ[];highlights:string[];video_urls:string[]}
export default function PremiumVendorDetails({data}:{data:PremiumData}){
  const hasAny=data.packages.length||data.faqs.length||data.highlights.length||data.video_urls.length
  if(!hasAny)return null
  const money=(n:number)=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(n)
  return <div className="space-y-6">
    {!!data.highlights.length&&<Card className="p-6 sm:p-8">
      <h2 className="font-[family-name:var(--font-heading)] text-xl text-ink">Why couples choose us</h2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">{data.highlights.map((highlight,i)=>
        <li key={i} className="flex gap-2 rounded-lg bg-primary-soft/30 p-3 text-sm text-ink">
          <span className="font-semibold text-primary">✓</span>{highlight}
        </li>)}</ul>
    </Card>}
    {!!data.packages.length&&<Card className="p-6 sm:p-8">
      <h2 className="font-[family-name:var(--font-heading)] text-xl text-ink">Services & packages</h2>
      <p className="mt-1 text-xs text-muted">Prices are vendor-provided starting estimates, not confirmed quotes.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{data.packages.map((pack,i)=><div key={i} className="rounded-xl border border-border-soft p-4">
        <h3 className="font-semibold text-plum">{pack.title}</h3>
        {pack.starting_price_cad&&<p className="mt-2 text-sm font-medium text-primary">From {money(pack.starting_price_cad)}</p>}
        {pack.description&&<p className="mt-2 whitespace-pre-line text-sm text-muted">{pack.description}</p>}
      </div>)}</div>
    </Card>}
    {!!data.video_urls.length&&<Card className="p-6 sm:p-8">
      <h2 className="font-[family-name:var(--font-heading)] text-xl text-ink">Video portfolio</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{data.video_urls.map((url,i)=><PremiumVideo key={i} url={url} index={i}/>)}</div>
    </Card>}
    {!!data.faqs.length&&<Card className="p-6 sm:p-8">
      <h2 className="font-[family-name:var(--font-heading)] text-xl text-ink">Frequently asked questions</h2>
      <div className="mt-4 divide-y divide-border-soft">{data.faqs.map((faq,i)=><details key={i} className="py-3">
        <summary className="cursor-pointer text-sm font-semibold text-plum">{faq.question}</summary>
        <p className="mt-2 whitespace-pre-line text-sm text-muted">{faq.answer}</p>
      </details>)}</div>
    </Card>}
  </div>
}
