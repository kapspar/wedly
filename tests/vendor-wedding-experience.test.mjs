import assert from 'node:assert/strict'
import test from 'node:test'
import {
  categoryExperienceEntries,
  experienceFields,
  experienceOptions,
} from '../src/lib/vendors/wedding-experience.ts'

test('culture and ceremony selections are independent, canonical and deduplicated', () => {
  assert.deepEqual(experienceOptions('cultures', ['Punjabi', 'Tamil', 'Tamil', 'Hindu']), ['Tamil', 'Punjabi'])
  assert.deepEqual(experienceOptions('ceremonies', ['Tamil', 'Catholic', 'Hindu', 'Muslim / Nikah']), ['Hindu', 'Catholic', 'Muslim / Nikah'])
})

test('details stay scoped to each category on a multi-category profile', () => {
  const details = {
    a: { ceremony_spaces: '  Outdoor mandap  ', catering_policy: ' ', coverage: 'Should be ignored' },
    b: { coverage: 'Two-day coverage', deliverables: 'Online gallery' },
  }
  assert.deepEqual(categoryExperienceEntries({ id: 'a', slug: 'venues', name: 'Venues' }, details), [
    { field: 'ceremony_spaces', label: 'Ceremony spaces and setups', value: 'Outdoor mandap' },
  ])
  assert.equal(categoryExperienceEntries({ id: 'b', slug: 'photographers', name: 'Photographers' }, details).length, 2)
  assert.deepEqual(categoryExperienceEntries({ id: 'c', slug: 'djs', name: 'DJs' }, details), [])
})

test('future categories have generic fields and invalid saved values are ignored', () => {
  assert.equal(experienceFields('new-category')[0][0], 'services')
  assert.equal(experienceFields('constructor')[0][0], 'services')
  assert.deepEqual(categoryExperienceEntries(
    { id: 'a', slug: 'new-category', name: 'New category' },
    { a: { services: 42, options: ' ' } },
  ), [])
})
