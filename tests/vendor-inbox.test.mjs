import assert from 'node:assert/strict'
import test from 'node:test'
import { publicVendorMapEnabled } from '../src/lib/feature-flags.ts'
import { inboxFilter, inboxMetricCards, inboxPage, weddingDateLabel } from '../src/lib/vendors/inbox.ts'

test('public map defaults off and requires an explicit true flag', () => {
  for (const value of ['', '0', 'false', 'TRUE', 'yes']) assert.equal(publicVendorMapEnabled(value), false)
  assert.equal(publicVendorMapEnabled('true'), true)
})

test('free inbox keeps read and unread filters and rejects Premium stage filters', () => {
  for (const filter of ['read', 'unread']) assert.equal(inboxFilter(filter, false), filter)
  assert.equal(inboxFilter('quoted', false), 'all')
  assert.equal(inboxFilter('quoted', true), 'quoted')
  assert.equal(inboxFilter('invalid', true), 'all')
})

test('inbox pagination rejects invalid or excessive page numbers', () => {
  assert.equal(inboxPage('12'), 12)
  for (const value of [undefined, '-1', '0', '3.5', 'NaN', '10001', '9007199254740992']) {
    assert.equal(inboxPage(value), 1)
  }
})

test('Premium lead metrics are omitted entirely from free views', () => {
  const metrics = { vendor_id: 'fixture', total: 6, unread: 2, open_leads: 4, due: 1, booked: 2 }
  assert.deepEqual(inboxMetricCards(metrics, false), [['Inquiries', 6], ['Unread', 2]])
  assert.deepEqual(inboxMetricCards(metrics, true), [
    ['Inquiries', 6], ['Unread', 2], ['Open leads', 4], ['Follow-ups due', 1], ['Booked', 2],
  ])
})

test('wedding date does not shift to the previous day in Toronto', () => {
  assert.equal(weddingDateLabel('2027-01-01'), 'Jan 1, 2027')
})
