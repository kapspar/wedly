export const maxUploadBytes = 4 * 1024 * 1024
export const maxGalleryPhotos = 15
export const galleryStart = 3
export const lastPhotoSlot = galleryStart + maxGalleryPhotos - 1

export const imageTypes = ['image/jpeg', 'image/png', 'image/webp'] as const
export type ImageType = typeof imageTypes[number]
export type VendorPhoto = { id: string; storage_path: string; storage_bucket: string; alt_text: string | null; sort_order: number }

export const isGalleryPhoto = (sortOrder: number) => sortOrder >= galleryStart

export function photoBucket(slot: number) {
  return isGalleryPhoto(slot) ? 'vendor-portfolio' : 'vendor-photos'
}

export function photoSrc(photo: VendorPhoto) {
  if (isGalleryPhoto(photo.sort_order)) return `/api/vendor/photos/${photo.id}`
  const path = photo.storage_path.split('/').map(encodeURIComponent).join('/')
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vendor-photos/${path}`
}

export function imageType(bytes: Uint8Array): ImageType | null {
  const matches = (offset: number, signature: number[]) => signature.every((value, index) => bytes[index + offset] === value)
  if (matches(0, [255, 216, 255])) return 'image/jpeg'
  if (matches(0, [137, 80, 78, 71, 13, 10, 26, 10])) return 'image/png'
  if (matches(0, [82, 73, 70, 70]) && matches(8, [87, 69, 66, 80, 86, 80, 56])) return 'image/webp'
  return null
}

export function nextGallerySlot(photos: Pick<VendorPhoto, 'sort_order'>[]) {
  const slots = photos.map(photo => photo.sort_order).filter(isGalleryPhoto)
  const last = Math.max(galleryStart - 1, ...slots)
  if (last < lastPhotoSlot) return last + 1
  for (let slot = galleryStart; slot <= lastPhotoSlot; slot++) {
    if (!slots.includes(slot)) return slot
  }
  return null
}

export function moveGalleryPhoto(ids: string[], from: number, to: number) {
  if (from < 0 || to < 0 || from >= ids.length || to >= ids.length || from === to) return ids
  const order = ids.slice()
  order[from] = ids[to]
  order[to] = ids[from]
  return order
}

export function httpsLink(value: string | null | undefined) {
  if (!value || !/^https:\/\//i.test(value.trim())) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null
  } catch {
    return null
  }
}
