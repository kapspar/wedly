import assert from 'node:assert/strict'
import test from 'node:test'
import { httpsLink, imageType, moveGalleryPhoto, nextGallerySlot, photoBucket } from '../src/lib/vendors/portfolio.ts'

test('uses one cover slot and a separate, bounded 15-photo gallery', () => {
  assert.equal(photoBucket(0), 'vendor-photos')
  assert.equal(photoBucket(2), 'vendor-photos')
  assert.equal(photoBucket(3), 'vendor-portfolio')
  assert.equal(nextGallerySlot([{ sort_order: 0 }, { sort_order: 2 }]), 3)
  assert.equal(nextGallerySlot([{ sort_order: 3 }, { sort_order: 8 }]), 9)
  assert.equal(nextGallerySlot([{ sort_order: 3 }, { sort_order: 17 }]), 4)
  assert.equal(nextGallerySlot(Array.from({ length: 15 }, (_, i) => ({ sort_order: i + 3 }))), null)
})

test('reorders gallery entries without mutating the saved order', () => {
  const initial = ['a', 'b', 'c']
  assert.deepEqual(moveGalleryPhoto(initial, 2, 1), ['a', 'c', 'b'])
  assert.deepEqual(initial, ['a', 'b', 'c'])
  assert.equal(moveGalleryPhoto(initial, 0, -1), initial)
  assert.equal(moveGalleryPhoto(initial, 2, 3), initial)
})

test('sniffs supported image headers rather than trusting the submitted MIME type', () => {
  assert.equal(imageType(Uint8Array.of(255, 216, 255)), 'image/jpeg')
  assert.equal(imageType(Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10)), 'image/png')
  assert.equal(imageType(Uint8Array.of(82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80, 86, 80, 56)), 'image/webp')
  assert.equal(imageType(new TextEncoder().encode('<svg />')), null)
  assert.equal(imageType(Uint8Array.of(137, 80, 78)), null)
})

test('accepts HTTPS social profile links and rejects unsafe or malformed targets', () => {
  for (const link of ['https://instagram.com/wedly', 'https://www.tiktok.com/@wedly', 'https://www.facebook.com/wedly',
    'https://www.youtube.com/@wedly', 'https://www.pinterest.ca/wedly']) assert.equal(httpsLink(link), link)
  for (const link of ['', 'https://', 'https:example.com', 'https://user:pass@host.test/', 'javascript:alert(1)', 'http://example.com/']) {
    assert.equal(httpsLink(link), null)
  }
})
