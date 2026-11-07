import type { ReactNode } from 'react'

type Scene = 'traditional' | 'catholic' | 'reception'

/** Lightweight, background-free line drawings; replaceable with final licensed artwork. */
export default function WeddingIllustration({ scene, className = '' }: { scene: Scene; className?: string }) {
  const reception = scene === 'reception'
  const traditional = scene === 'traditional'
  return (
    <svg className={className} viewBox="0 0 440 360" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={traditional ? 'Couple in traditional wedding attire' : reception ? 'Couple dancing at their reception' : 'Couple in Christian wedding attire'}>
      <g stroke="#28212A" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M40 337h65m215 0h75" strokeWidth="1.8"/>
        {/* Groom */}
        <path d={traditional ? 'M101 93q-17-24 10-37 21-18 43 1l-4 28-18 15z' : 'M101 81q-10-31 20-37 27-4 35 22l-13 22z'} fill={traditional ? '#FBF7F9' : '#28212A'}/>
        {traditional && <path d="M100 78q27-32 55-14m-45-9q24-12 38 6"/>}
        <path d="M112 88q-6 25 11 36 22 9 33-19l-8-27q-19-6-36 10z" fill="#FBF7F9"/>
        <path d="M143 103q-8 19-25 8l-1-10m26-5h2m-10 14q6 5 12-1" />
        <path d={reception ? 'M110 127l-31 26-18 76 28 10 15-56 0 137h72l-4-140 23-21-31-30z' : 'M109 128l-32 24-15 80 27 10 14-58-2 137h78l-4-138 14 58 28-10-19-79-34-24z'} fill="#FBF7F9"/>
        {!traditional && <path d="M124 129l17 27 18-27m-18 27-8 74m16-74 8 74m-21-98 5 7 6-7" />}
        {traditional && <><path d="M141 137v160m18-156-2 139m-38-143q25 22 45 0" /><path d="M117 152q23 11 45 0" strokeDasharray="2 7"/></>}
        <path d="M103 321l-5 15h33l5-15m15 0-3 15h35l-7-15"/>
        {/* Bride */}
        <path d="M279 92q-3-39 27-42 29 2 30 43l-17 25-31-4z" fill="#28212A"/>
        <path d="M282 84q5-19 23-20 16 0 25 20l-3 26q-19 24-37 1z" fill="#FBF7F9"/>
        <path d="M297 94h1m22 0h1m-20 15q10 8 17-1"/>
        <path d={reception ? 'M285 123l-27 25 11 70-62 107q104 39 209-1l-70-108 12-68-30-25z' : traditional ? 'M283 124l-25 24-6 73-39 104q90 33 178 0l-44-105-4-71-27-21z' : 'M284 126l-27 25-12 69-43 105q101 33 203 0l-56-110-5-65-25-24z'} fill="#FBF7F9"/>
        <path d="M273 161q35 22 70 0m-65 62q30 12 61 0m-41 3-30 91m44-91 5 97m12-98 38 95" />
        {traditional ? <><path d="M285 127l56 77m-49-78 47 72m-40-73 10 16" /><circle cx="331" cy="93" r="9" fill="#FBF7F9"/></> : <><path d="M336 89q42 52 49 119" strokeWidth="1.7"/><path d="M309 121v10" /></>}
        {/* Holding hands or twirl */}
        {reception ? <><path d="M189 157q34-53 79-82l20 10m-20-10q8-9 17-3l7 9-5 7-19-3" /><path d="M284 126l-14-36 12-11"/></> : <><path d="M199 224q29 6 52-6m-3-1q7-6 13 1l-7 9-10-1"/></>}
        <path d="M207 335h207" strokeWidth="1.2" opacity=".35"/>
        <path d="M220 40l-3-14m15 17 8-11m-31 13-9-9" strokeWidth="2"/>
      </g>
    </svg>
  )
}
