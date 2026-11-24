'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

type Vendor = {id:string;name:string;slug:string;city:string;area:string|null;serviceAreas:string[];category:string;claimed:boolean;isVenue:boolean;streetAddress:string|null;latitude:number|null;longitude:number|null}
type MapResults = { geometry: { location: unknown } }[]
type GoogleApi = {
  maps: {
    Map: new (node:HTMLElement, options:Record<string,unknown>) => { fitBounds:(bounds:unknown)=>void; setZoom:(zoom:number)=>void }
    Marker: new (options:Record<string,unknown>) => { addListener:(name:string,listener:()=>void)=>void }
    InfoWindow: new (options:Record<string,unknown>) => { open:(options:Record<string,unknown>)=>void; close:()=>void }
    LatLngBounds: new ()=> {extend:(loc:unknown)=>void}
    Geocoder: new ()=>{geocode:(request:{address:string},callback:(results:MapResults|null,status:string)=>void)=>void}
  }
}
declare global { interface Window {google?:GoogleApi; __planwedlyGoogleMapReady?:()=>void } }
type CityGroup = { key:string; city:string; label:string; vendors:Vendor[]; exactPosition?:{lat:number;lng:number} }
const canonical=(s:string)=>s.trim().toLocaleLowerCase('en-CA')
/**
 * Approximate city centres, not storefront or home addresses.
 * Use local coordinates for core GTA cities to avoid paid geocoding requests
 * and keep the map functional if the Geocoding API is disabled.
 */
const CITY_CENTRES: Record<string, {lat:number;lng:number}> = {
  'toronto':{lat:43.6532,lng:-79.3832},
  'scarborough':{lat:43.7731,lng:-79.2578},
  'north york':{lat:43.7615,lng:-79.4111},
  'etobicoke':{lat:43.6205,lng:-79.5132},
  'east york':{lat:43.6912,lng:-79.3272},
  'mississauga':{lat:43.5890,lng:-79.6441},
  'brampton':{lat:43.7315,lng:-79.7624},
  'vaughan':{lat:43.8361,lng:-79.4983},
  'woodbridge':{lat:43.7820,lng:-79.5920},
  'markham':{lat:43.8561,lng:-79.3370},
  'richmond hill':{lat:43.8828,lng:-79.4403},
  'thornhill':{lat:43.8161,lng:-79.4245},
  'stouffville':{lat:43.9703,lng:-79.2500},
  'whitchurch-stouffville':{lat:43.9703,lng:-79.2500},
  'aurora':{lat:44.0065,lng:-79.4504},
  'newmarket':{lat:44.0592,lng:-79.4613},
  'pickering':{lat:43.8384,lng:-79.0868},
  'ajax':{lat:43.8509,lng:-79.0204},
  'whitby':{lat:43.8975,lng:-78.9429},
  'oshawa':{lat:43.8971,lng:-78.8658},
  'clarington':{lat:43.9358,lng:-78.6080},
  'bowmanville':{lat:43.9126,lng:-78.6880},
  'oakville':{lat:43.4675,lng:-79.6877},
  'burlington':{lat:43.3255,lng:-79.7990},
  'milton':{lat:43.5183,lng:-79.8774},
  'halton hills':{lat:43.6502,lng:-79.9030},
  'georgetown':{lat:43.6502,lng:-79.9030},
  'caledon':{lat:43.8668,lng:-79.8664},
  'hamilton':{lat:43.2557,lng:-79.8711},
  'barrie':{lat:44.3894,lng:-79.6903},
  'guelph':{lat:43.5448,lng:-80.2482},
  'kitchener':{lat:43.4516,lng:-80.4925},
  'waterloo':{lat:43.4643,lng:-80.5204},
  'cambridge':{lat:43.3616,lng:-80.3144}
}
const cityCentre=(city:string)=>{
  const normalized=canonical(city).replace(/,?\\s+(ontario|on|canada)\\b.*$/,'').replace(/,.*$/,'').trim()
  return CITY_CENTRES[normalized]
}
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
    for(const vendor of filtered){
      const exact=vendor.isVenue && vendor.streetAddress && vendor.latitude!==null && vendor.longitude!==null
      const key=exact?'venue:'+vendor.id:'city:'+canonical(vendor.city)
      const group=grouped.get(key)
      if(group)group.vendors.push(vendor)
      else grouped.set(key,{key,city:vendor.city,label:exact?vendor.name:vendor.city,vendors:[vendor],...(exact?{exactPosition:{lat:vendor.latitude!,lng:vendor.longitude!}}:{})})
    }
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
        const bounds=new maps.LatLngBounds()
        let completed=0, successes=0
        let failedLookups=0
        const markCity=(group:CityGroup,position:unknown)=>{
          const marker=new maps.Marker({map,position,title:group.label+': '+group.vendors.length+' wedding listing(s)'})
          bounds.extend(position)
          marker.addListener('click',()=>{
            const popup=document.createElement('div')
            popup.textContent=group.label+' — '+group.vendors.map(v=>v.name+(v.isVenue&&!v.claimed?' (unclaimed venue)':'')).join(', ')
            const cityInfo=new maps.InfoWindow({content:popup})
            cityInfo.open({map,anchor:marker})
          })
          successes++
        }
        const finishCity=()=>{
          completed++
          if(completed!==groups.length)return
          if(successes){
            map.fitBounds(bounds)
            if(successes===1)map.setZoom(10)
            setMapReady(true)
            if(failedLookups>0)setMapError('Some cities could not be located. The vendor list below is complete.')
          }else setMapError('No approximate city locations could be placed on the map. Use the vendor links below.')
        }
        // Geocoding is only a fallback for cities not in our verified GTA centre list.
        let geocoder:InstanceType<typeof maps.Geocoder>|null=null
        for(const group of groups){
          const known=group.exactPosition ?? cityCentre(group.city)
          if(known){
            markCity(group,known)
            finishCity()
            continue
          }
          geocoder ??= new maps.Geocoder()
          geocoder.geocode({address:group.city+', Ontario, Canada'},(results,status)=>{
            if(!active)return
            if(status==='OK'&&results?.[0])markCity(group,results[0].geometry.location)
            else {failedLookups++;console.warn('PlanWedly map lookup failed for',group.city,'status:',status)}
            finishCity()
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
    <p className="text-sm text-muted">{filtered.length} vendor listing{filtered.length===1?'':'s'} across {groups.length} map location{groups.length===1?'':'s'}</p>
    {!apiKey&&<p className="rounded-xl border border-primary/20 bg-primary-soft/30 p-4 text-sm text-ink">Map pins will appear once Google Maps is configured. You can still explore every claimed vendor below.</p>}
    {apiKey&&groups.length>0&&<div className="relative overflow-hidden rounded-2xl border border-border-soft bg-primary-soft/30">
      <div ref={root} className="h-[420px] w-full" aria-label="Map of verified venue locations and claimed vendors by approximate base city" />
      {!mapReady&&!mapError&&<div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-white/90 px-3 py-2 text-sm text-muted">Loading city-level pins…</div>}
    </div>}
    {mapError&&<p role="status" className="text-sm text-red-700">{mapError}</p>}
    <div className="grid gap-4 md:grid-cols-2">
      {groups.map(group=><section key={group.key} className="rounded-2xl border border-border-soft bg-white p-5">
        <h2 className="font-[family-name:var(--font-heading)] text-xl text-plum">{group.label} <span className="text-sm font-normal text-muted">({group.vendors.length})</span></h2>
        <ul className="mt-3 space-y-3">{group.vendors.map(v=><li key={v.id} className="border-t border-border-soft pt-3">
          <Link href={'/vendor/'+encodeURIComponent(v.slug)} className="font-medium text-primary hover:underline">{v.name}</Link>
          <p className="text-xs text-muted">{v.category}{v.isVenue&&!v.claimed?' · Unclaimed listing':''}{v.isVenue&&v.streetAddress?' · '+v.streetAddress:''}{!v.isVenue?(v.serviceAreas.length?' · Serves '+v.serviceAreas.join(', '):' · Service areas not yet specified'):''}</p>
          <a href={'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(v.isVenue&&v.streetAddress?v.streetAddress+', '+v.city+', Ontario, Canada':v.city+', Ontario, Canada')} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-muted underline underline-offset-2">{v.isVenue?'See venue address on Google Maps':'See base city on Google Maps'}</a>
        </li>)}</ul>
      </section>)}
    </div>
    {!groups.length&&<div className="rounded-xl bg-white p-8 text-center text-muted">No venue or claimed vendor matches these filters. Try another category or region.</div>}
  </div>
}
