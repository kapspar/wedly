'use client'

/* eslint-disable @next/next/no-img-element -- Local previews and authenticated media use browser URLs. */
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { imageTypes, isGalleryPhoto, maxGalleryPhotos, maxUploadBytes, moveGalleryPhoto, nextGallerySlot, photoSrc, type VendorPhoto } from '@/lib/vendors/portfolio'

const placements = [
  { slot: 0, label: 'Directory cover', crop: 'Wide image for the directory and listing cover.' },
  { slot: 1, label: 'Business logo', crop: 'Square logo displayed beside your business name.' },
  { slot: 2, label: 'Profile banner', crop: 'Wide image displayed across the top of your listing.' },
]
const control = 'inline-flex min-h-11 items-center justify-center rounded-xl border border-border-soft px-3 text-sm font-medium text-plum disabled:opacity-40'
const action = 'inline-flex min-h-11 items-center justify-center rounded-xl bg-plum px-4 text-sm font-semibold text-white disabled:opacity-50'

async function requestPhoto(method: string, body: FormData | object) {
  const isForm = body instanceof FormData
  const response = await fetch('/api/vendor/photos', {
    method,
    body: isForm ? body : JSON.stringify(body),
    ...(isForm ? {} : { headers: { 'Content-Type': 'application/json' } }),
  })
  const payload = await response.json().catch(() => ({})) as { photo?: VendorPhoto; error?: string }
  if (!response.ok) throw new Error(payload.error ?? 'Unable to save photo changes. Please try again.')
  return payload
}

async function prepareImage(file: File) {
  if (file.size <= maxUploadBytes) return file
  const image = await createImageBitmap(file)
  try {
    const scale = Math.min(1, 2000 / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Unable to resize the image. Choose a file under 4 MB.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.86))
    if (!blob || blob.size > maxUploadBytes) throw new Error('Choose a smaller image.')
    return new File([blob], 'photo.' + (blob.type === 'image/webp' ? 'webp' : 'png'), { type: blob.type })
  } finally {
    image.close()
  }
}

export default function VendorPortfolioEditor({ vendorId, initialPhotos, premium }: {
  vendorId: string
  initialPhotos: VendorPhoto[]
  premium: boolean
}) {
  const router = useRouter()
  const [photos, setPhotos] = useState(initialPhotos)
  const [pending, setPending] = useState<{ file: File; slot: number; url: string; label: string } | null>(null)
  const [large, setLarge] = useState<{ src: string; label: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const pendingUrl = pending?.url
  useEffect(() => () => { if (pendingUrl) URL.revokeObjectURL(pendingUrl) }, [pendingUrl])

  const gallery = photos.filter(photo => isGalleryPhoto(photo.sort_order)).sort((a, b) => a.sort_order - b.sort_order)
  const availableSlot = nextGallerySlot(gallery)

  function choose(file: File | undefined, slot: number, label: string) {
    if (!file || busy) return
    if (!imageTypes.some(type => type === file.type) || file.size === 0 || file.size > 20 * 1024 * 1024) {
      setNotice({ text: 'Choose a JPG, PNG or WebP image up to 20 MB.', error: true })
      return
    }
    setNotice(null)
    setPending({ file, slot, label, url: URL.createObjectURL(file) })
  }

  async function run(change: () => Promise<void>, success: string) {
    setBusy(true)
    setNotice(null)
    try {
      await change()
      setNotice({ text: success, error: false })
      router.refresh()
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : 'Unable to save photo changes.', error: true })
    } finally {
      setBusy(false)
    }
  }

  async function upload() {
    if (!pending) return
    await run(async () => {
      const file = await prepareImage(pending.file)
      const form = new FormData()
      form.set('vendorId', vendorId)
      form.set('slot', String(pending.slot))
      form.set('file', file)
      const { photo } = await requestPhoto('POST', form)
      if (!photo) throw new Error('The upload result is unavailable. Refresh the page.')
      setPhotos(previous => [...previous, photo])
      setPending(null)
    }, 'Photo uploaded.')
  }

  async function remove(photo: VendorPhoto) {
    if (!window.confirm('Remove this image from your listing?')) return
    await run(async () => {
      await requestPhoto('DELETE', { vendorId, photoId: photo.id })
      setPhotos(previous => previous.filter(item => item.id !== photo.id))
    }, 'Photo removed.')
  }

  async function reorder(from: number, to: number) {
    const current = gallery.map(photo => photo.id)
    const order = moveGalleryPhoto(current, from, to)
    if (order === current) return
    await run(async () => {
      await requestPhoto('PATCH', { vendorId, current, order })
      const slots = new Map(order.map((id, index) => [id, gallery[index].sort_order]))
      setPhotos(previous => previous.map(photo =>
        slots.has(photo.id) ? { ...photo, sort_order: slots.get(photo.id)! } : photo))
    }, 'Gallery order saved.')
  }

  function picker(slot: number, label: string) {
    return (
      <label className={`${control} cursor-pointer focus-within:outline-2 focus-within:outline-offset-2`}>
        {label}
        <input type="file" className="sr-only" accept={imageTypes.join(',')} disabled={busy || !!pending}
          onChange={event => { choose(event.target.files?.[0], slot, label); event.target.value = '' }} />
      </label>
    )
  }

  function thumbnail(photo: VendorPhoto, label: string, fit: string) {
    return (
      <button type="button" className="block w-full rounded-lg focus-visible:outline-2" aria-label={`Preview ${label}`}
        onClick={() => { setLarge({ src: photoSrc(photo), label }); dialog.current?.showModal() }}>
        <img className={`h-36 w-full rounded-lg bg-ivory ${fit}`} loading="lazy" src={photoSrc(photo)} alt={label} />
      </button>
    )
  }

  return (
    <section id="listing-images" className="mt-6 scroll-mt-24 space-y-5 rounded-2xl border border-border-soft bg-white p-4 sm:p-8">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-xl text-plum">Photos &amp; portfolio</h2>
        <p className="mt-2 text-sm text-muted">Free listings include one cover photo. Premium adds a logo, banner and up to 15 gallery photos.</p>
        <p className="mt-1 text-sm text-muted">JPG, PNG or WebP. Images above 4 MB are resized before upload.</p>
      </div>
      {pending && (
        <div className="space-y-3 rounded-xl border border-border-soft p-3">
          <h3 className="font-semibold text-plum">Before you upload</h3>
          <p className="text-sm text-muted [overflow-wrap:anywhere]">{pending.file.name}</p>
          <img src={pending.url} alt="Selected image preview" className="max-h-64 w-full rounded-lg bg-ivory object-contain" />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void upload()} disabled={busy} className={action}>{busy ? 'Uploading…' : pending.label}</button>
            <button type="button" onClick={() => setPending(null)} disabled={busy} className={control}>Cancel</button>
          </div>
        </div>
      )}
      {notice && <p role={notice.error ? 'alert' : 'status'} className={notice.error ? 'text-sm text-red-700' : 'text-sm text-plum'}>{notice.text}</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        {placements.map(({ slot, label, crop }) => {
          const photo = photos.find(item => item.sort_order === slot)
          return (
            <div key={slot} className="min-w-0 space-y-2 rounded-xl border border-border-soft p-3">
              <h3 className="font-semibold text-plum">{label}</h3>
              <p className="text-sm text-muted">{crop}</p>
              {photo ? (
                <>
                  {thumbnail(photo, label, slot === 1 ? 'object-contain' : 'object-cover')}
                  <button type="button" className={control} disabled={busy || !!pending} onClick={() => void remove(photo)}>Remove {label.toLowerCase()}</button>
                </>
              ) : (slot === 0 || premium) ? picker(slot, `Upload ${label.toLowerCase()}`) : <p className="text-sm text-muted">Premium Preview</p>}
            </div>
          )
        })}
      </div>
      <div className="space-y-3">
        <h3 className="font-semibold text-plum">Gallery <span className="font-normal text-muted">({gallery.length}/{maxGalleryPhotos})</span></h3>
        {premium
          ? <p className="text-sm text-muted">Move photos earlier or later to set the order couples see.</p>
          : <p className="text-sm text-muted">An active Premium Preview subscription is required to add, reorder or display gallery photos. You can still preview and remove saved photos.</p>}
        {premium && availableSlot !== null && picker(availableSlot, 'Upload gallery photo')}
        <ol className="grid gap-3 sm:grid-cols-2">
          {gallery.map((photo, index) => (
            <li key={photo.id} className="min-w-0 space-y-2 rounded-xl border border-border-soft p-3">
              {thumbnail(photo, `gallery photo ${index + 1}`, 'object-cover')}
              <div className="flex flex-wrap gap-2">
                {premium && <>
                  <button type="button" onClick={() => void reorder(index, index - 1)} disabled={busy || !!pending || index === 0} className={control} aria-label={`Move photo ${index + 1} earlier`}>Earlier</button>
                  <button type="button" onClick={() => void reorder(index, index + 1)} disabled={busy || !!pending || index === gallery.length - 1} className={control} aria-label={`Move photo ${index + 1} later`}>Later</button>
                </>}
                <button type="button" onClick={() => void remove(photo)} disabled={busy || !!pending} className={control} aria-label={`Remove photo ${index + 1}`}>Remove</button>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <dialog ref={dialog} aria-label="Photo preview" className="m-auto w-[min(92vw,52rem)] rounded-2xl bg-white p-4 backdrop:bg-black/65">
        <form method="dialog" className="mb-3 flex justify-end"><button className={control}>Close preview</button></form>
        {large && <img src={large.src} alt={large.label} className="max-h-[72dvh] w-full object-contain" />}
      </dialog>
    </section>
  )
}
