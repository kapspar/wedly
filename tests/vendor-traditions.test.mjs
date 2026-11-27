import assert from 'node:assert/strict'
import test from 'node:test'
import { safeRedirect } from '../src/lib/auth/redirect.ts'
import { directoryHref, directoryPattern, directorySearch, selectedTraditions, traditionFilter } from '../src/lib/vendors/traditions.ts'

test('Tamil Hindu and Tamil Catholic are distinct explicit claims', () => {
  assert.deepEqual(selectedTraditions(['tamil-catholic', 'tamil-hindu']), [
    ['tamil-hindu', 'Tamil Hindu'], ['tamil-catholic', 'Tamil Catholic'],
  ])
  assert.deepEqual(selectedTraditions(['Tamil', 'Hindu', 'Catholic']), [])
  assert.equal(traditionFilter('punjabi-sikh'), 'punjabi-sikh')
  assert.equal(traditionFilter(['tamil-catholic']), undefined)
})

test('directory filter navigation preserves other filters and encodes punctuation', () => {
  const href = directoryHref('/vendors/venues', { q: 'Roses & Co.', tradition: 'tamil-hindu', city: 'Ajax', service: undefined })
  assert.deepEqual(Object.fromEntries(new URL(href, 'https://example.invalid').searchParams),
    { q: 'Roses & Co.', tradition: 'tamil-hindu', city: 'Ajax' })
  assert.equal(directoryPattern('100%_Ontario'), '%100\\%\\_Ontario%')
  assert.match(directorySearch('Studio (GTA), Inc.'), /name\.ilike\."%Studio \(GTA\), Inc\.%"/)
})

test('the login return path keeps local routes and rejects unsupported input', () => {
  assert.equal(safeRedirect('/vendor/dashboard?tab=photos#profile'), '/vendor/dashboard?tab=photos#profile')
  for (const value of [null, '', 'https://example.invalid', 'vendors', '/bad\npath', '/bad\\path']) {
    assert.equal(safeRedirect(value), '/dashboard')
  }
})
