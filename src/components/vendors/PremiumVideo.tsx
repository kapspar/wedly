'use client'
import { useState } from 'react'
export default function PremiumVideo({url,index}:{url:string;index:number}){
  const [opened,setOpened]=useState(false)
  let embed:string|null=null
  try{
    const parsed=new URL(url)
    if(parsed.hostname==='www.youtube.com'){
      const id=parsed.searchParams.get('v')
      if(id&&/^[A-Za-z0-9_-]{11}$/.test(id))embed=`https://www.youtube-nocookie.com/embed/${id}`
    }else if(parsed.hostname==='vimeo.com'){
      const id=parsed.pathname.split('/').filter(Boolean).pop()
      if(id&&/^\d{1,12}$/.test(id))embed=`https://player.vimeo.com/video/${id}`
    }
  }catch{}
  if(!embed)return null
  return <div className="overflow-hidden rounded-xl bg-plum/5">
    {opened?<iframe src={embed} title={`Vendor portfolio video ${index+1}`} loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen className="aspect-video w-full border-0"/>:
      <button type="button" onClick={()=>setOpened(true)}
        className="flex aspect-video w-full flex-col items-center justify-center gap-2 border border-border-soft bg-primary-soft/40 px-3 text-center text-sm text-plum hover:bg-primary-soft">
        <span className="text-3xl" aria-hidden="true">▶</span>
        Play portfolio video {index+1}
        <span className="text-xs text-muted">Video provider loads only when you choose to play.</span>
      </button>}
  </div>
}
