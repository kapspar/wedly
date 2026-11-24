'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

type Vendor = {id:string;name:string;slug:string;city:string;area:string|null;serviceAreas:string[];category:string}
type MapResults = { geometry: { location: unknown } }[]
type GoogleApi = {
  maps: {
    Map: new (node:HTMLElement, options:Record<string,unknown>) => { fitBounds:(bounds:unknown)=>void }
    Marker: new (options:Record<string,unknown>) => { addListener:(name:string,listener:()=>void)=>void }
    InfoWindow: new (options:Record<string,unknown>) => { open:(options:Record<string,unknown>)=>void; close:()=>void }
    LatLngBounds: new ()=> {extend:(loc:unknown)=>void}
    Geocoder: new ()=>{geocode:(request:{address:string},callback:(results:MapResults|null,status:string)=>void)=>void}
  }
}
declare global { interface Window {google?:GoogleApi; __planwedlyGoogleMapReady?:()=>void } }
type CityGroup = { key:string; city:string; vendors:Vendor[] }
const canonical=(s:string)=>s.trim().toLocaleLowerCase('en-CA')
export default function ClaimedVendorMap({vendors,apiKey}:{vendors:Vendor[];apiKey:string}) {
  const [category,setCategory]=useState('')
  const [service,setService]=useState('')
  const [mapError,setMapError]=useState('')
  const [mapReady,setMapReady]=useState(false)
  const root=useRef<HTMLDivElement>(null)
  const categories=useMemo(()=>[...new Set(vendors.map(v=>v.category))].sort(),[vendors])
  const regions=useMemo(()=>[...new Set(vendors.flatMap(v=>v.serviceAreas))].sort(),[vendors])
  const filtered=useMemo(()=>vendors.filter(v=>(!category||v.category===category)&&(!service||v.serviceAreas.includes(service))),[vendors,category,service])
  const groups=useMemo(()=>{
    const grouped=new Map<string,CityGroup>()
    for(const vendor of filtered){const key=canonical(vendor.city);const group=grouped.get(key);if(group)group.vendors.push(vendor);else grouped.set(key,{key,city:vendor.city,vendors:[vendor]})}
    return [...grouped.values()]
  },[filtered])

  useEffect(()=>{
    if(!apiKey||!root.current||groups.length===0){setMapReady(false);return}
    let active=true
    const render=()=>{
      if(!active||!root.current||!window.google)return
      try{
        const maps=window.google.maps
        const map=new maps.Map(root.current,{center:{lat:43.75,lng:-79.4},zoom:9,mapTypeControl:false,streetViewControl:false,fullscreenControl:true})
        const geocoder=new maps.Geocoder()
        const bounds=new maps.LatLngBounds()
        const info=new maps.InfoWindow({})
        let completed=0, successes=0
        for(const group of groups){
          geocoder.geocode({address:group.city+', Ontario, Canada'},(results,status)=>{
            if(!active)return
            completed++
            if(status==='OK'&&results?.[0]){
              successes++
              const position=results[0].geometry.location
              const marker=new maps.Marker({map,position,title:group.city+': '+group.vendors.length+' claimed vendor(s)'})
              bounds.extend(position)
              marker.addListener('click',()=>{
                info.close()
                // Keep map popup plain text; vendor links are provided in adjacent accessible list.
                info.open({map,anchor:marker})
                const names=group.vendors.map(v=>v.name).join(', ')
                // InfoWindow content is passed at construction below, avoiding HTML injection.
                info.close()
                const cityInfo=new maps.InfoWindow({content:group.city+' — '+names})
                cityInfo.open({map,anchor:marker})
              })
            }
            if(completed===groups.length){
              if(successes>0){if(successes===1){map.fitBounds(bounds)}else map.fitBounds(bounds);setMapReady(true)}
              else setMapError('Google Maps could not locate these cities. Use the directory links below.')
            }
          })
        }
      }catch{setMapError('The map could not load. Use the directory links below.')}
    }
    setMapError('')
    if(window.google?.maps){render();return()=>{active=false}}
    // Only one Maps script is loaded. The callback executes when Google Maps is ready.
    window.__planwedlyGoogleMapReady=render
    const scriptId='planwedly-google-maps-script'
    let script=document.getElementById(scriptId) as HTMLScriptElement|null
    if(!script){script=document.createElement('script');script.id=scriptId;script.async=true;script.defer=true;script.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(apiKey)+'&loading=async&callback=__planwedlyGoogleMapReady';script.onerror=()=>setMapError('Google Maps is unavailable. Use the directory links below.');document.head.appendChild(script)}
    return()=>{active=false}
  },[apiKey,groups])
  return <div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium text-ink">Vendor category
        <select value={category} onChange={e=>setCategory(e.target.value)} className="mt-2 block w-full rounded-xl border border-border-soft bg-white px-4 py-3">
          <option value="">All categories</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium text-ink">Serves this region
        <select value={service} onChange={e=>setService(e.target.value)} className="mt-2 block w-full rounded-xl border border-border-soft bg-white px-4 py-3">
          <option value="">All service areas</option>{regions.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </label>
    </div>
    <p className="text-sm text-muted">{filtered.length} claimed vendor{filtered.length===1?'':'s'} in {groups.length} base cit{groups.length===1?'y':'ies'}</p>
    {!apiKey&&<p className="rounded-xl border border-primary/20 bg-primary-soft/30 p-4 text-sm text-ink">Map pins will appear once Google Maps is configured. You can still explore every claimed vendor below.</p>}
    {apiKey&&groups.length>0&&<div className="relative overflow-hidden rounded-2xl border border-border-soft bg-primary-soft/30">
      <div ref={root} className="h-[420px] w-full" aria-label="Map of claimed vendors by base city" />
      {!mapReady&&!mapError&&<div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-white/90 px-3 py-2 text-sm text-muted">Loading city-level pins…</div>}
    </div>}
    {mapError&&<p role="status" className="text-sm text-red-700">{mapError}</p>}
    <div className="grid gap-4 md:grid-cols-2">
      {groups.map(group=><section key={group.key} className="rounded-2xl border border-border-soft bg-white p-5">
        <h2 className="font-[family-name:var(--font-heading)] text-xl text-plum">{group.city} <span className="text-sm font-normal text-muted">({group.vendors.length})</span></h2>
        <ul className="mt-3 space-y-3">{group.vendors.map(v=><li key={v.id} className="border-t border-border-soft pt-3">
          <Link href={'/vendor/'+encodeURIComponent(v.slug)} className="font-medium text-primary hover:underline">{v.name}</Link>
          <p className="text-xs text-muted">{v.category}{v.serviceAreas.length?' · Serves '+v.serviceAreas.join(', '):' · Service areas not yet specified'}</p>
          <a href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(v.city+', Ontario, Canada')} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-muted underline underline-offset-2">See base city on Google Maps</a>
        </li>)}</ul>
      </section>)}
    </div>
    {!groups.length&&<div className="rounded-xl bg-white p-8 text-center text-muted">No claimed vendors match these filters. Try another category or region.</div>}
  </div>
}
