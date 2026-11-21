import Link from 'next/link'
import { BadgeCheck, Star } from 'lucide-react'
import Card from '@/components/ui/Card'

export type PublicReview = {
  id: string
  rating: number
  body: string | null
  service_date: string
  created_at: string
  customer_verified: boolean
  communication_rating: number | null
  quality_rating: number | null
  value_rating: number | null
  reliability_rating: number | null
  vendor_response: string | null
  response_status: string
}

const formatServiceMonth = (date: string) => {
  const [year, month] = date.split('-').map(Number)
  return new Intl.DateTimeFormat('en-CA', { month:'long', year:'numeric', timeZone:'UTC' })
    .format(new Date(Date.UTC(year, month-1, 1)))
}

function Stars({ rating }: { rating: number }) {
  return <span aria-label={`${rating} out of 5 stars`} className="inline-flex gap-0.5">
    {Array.from({ length:5 },(_,i)=><Star key={i} aria-hidden="true" className={`h-4 w-4 ${i<rating?'fill-amber-400 text-amber-500':'text-muted/30'}`}/>)}
  </span>
}

export default function PublicReviews({reviews,count,average,slug}:{
  reviews:PublicReview[];count:number;average:number|null;slug:string
}) {
  return <Card className="p-6 sm:p-8" >
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-xl text-ink">Customer Reviews</h2>
        <p className="mt-1 text-xs text-muted">Only moderated, approved reviews are shown.</p>
      </div>
      <Link href={`/vendor/${slug}/review`} className="rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-primary hover:bg-primary-soft/30">Leave a Review</Link>
    </div>
    {count===0?<p className="mt-5 text-sm text-muted">No approved customer reviews yet.</p>:<>
      <div className="mt-5 flex items-center gap-3">
        {average!==null?<><span className="text-3xl font-semibold text-plum">{average.toFixed(1)}</span><Stars rating={Math.round(average)}/></>:<span className="text-sm font-medium text-plum">Rating building — 3 reviews needed for an overall average</span>}
        <span className="text-xs text-muted">{count} approved review{count===1?'':'s'}</span>
      </div>
      <div className="mt-5 space-y-4">
        {reviews.map(review=><article key={review.id} className="rounded-xl border border-border-soft bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Stars rating={review.rating}/>
            {review.customer_verified?<span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs text-green-800"><BadgeCheck className="h-3.5 w-3.5"/> Verified Customer</span>:<span className="text-xs text-muted">Customer review · Relationship not independently verified</span>}
          </div>
          <p className="mt-2 text-xs text-muted">Service provided: {formatServiceMonth(review.service_date)}</p>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-ink">{review.body}</p>
          {([['Communication',review.communication_rating],['Quality of service',review.quality_rating],['Value for money',review.value_rating],['Professionalism & reliability',review.reliability_rating]] as const).some(([,v])=>v!==null)&&
            <div className="mt-3 flex flex-wrap gap-2">
              {([['Communication',review.communication_rating],['Quality',review.quality_rating],['Value',review.value_rating],['Reliability',review.reliability_rating]] as const).filter(([,v])=>v!==null).map(([label,value])=>
                <span key={label} className="rounded-full bg-primary-soft/40 px-2 py-1 text-xs text-muted">{label}: {value}/5</span>)}
            </div>}
          {review.response_status==='approved'&&review.vendor_response&&<div className="mt-4 rounded-lg border-l-2 border-primary bg-primary-soft/20 p-3">
            <p className="text-xs font-semibold text-plum">Response from the business</p>
            <p className="mt-2 whitespace-pre-line text-sm text-ink">{review.vendor_response}</p>
          </div>}
        </article>)}
      </div>
      {count>reviews.length&&<p className="mt-4 text-xs text-muted">Showing the {reviews.length} most recent approved reviews.</p>}
      <p className="mt-4 text-xs text-muted">Service dates provide historical context. Prices mentioned in older reviews may not reflect current quotes. PlanWedly verifies customer relationships only where indicated, not the accuracy of each opinion.</p>
    </>}
  </Card>
}
