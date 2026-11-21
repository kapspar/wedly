'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

export default function VendorAnalytics({ vendorId }: { vendorId: string }) {
  useEffect(() => {
    // One random, tab-scoped session. We never send IP, email, identity or
    // the actual outbound URL to PlanWedly's vendor analytics database.
    let sessionId: string
    try {
      sessionId=sessionStorage.getItem('planwedly_analytics_session')??crypto.randomUUID()
      sessionStorage.setItem('planwedly_analytics_session',sessionId)
    } catch { sessionId=crypto.randomUUID() }
    const record=(kind:'view'|'website'|'instagram')=>{
      void fetch('/api/analytics/vendor',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({vendorId,sessionId,kind}),
        keepalive:true,
      }).catch(()=>{})
    }
    posthog.capture('vendor_profile_viewed',{vendor_id:vendorId})
    record('view')

    const onClick=(event:MouseEvent)=>{
      const target=event.target
      if(!(target instanceof Element))return
      const link=target.closest('a[data-analytics-outbound]')
      if(!link)return
      const destination=link.getAttribute('data-analytics-outbound')
      if(destination==='instagram'||destination==='website'){
        posthog.capture('vendor_outbound_clicked',{vendor_id:vendorId,destination})
        record(destination)
      }
    }
    document.addEventListener('click',onClick)
    return ()=>document.removeEventListener('click',onClick)
  },[vendorId])
  return null
}
