import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

const store = new Map<string, string>()
globalThis.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
} as Storage

const { markPending, clearPending, mergeWithPending } = await import('../lib/sync-pending.ts')

beforeEach(() => store.clear())

test('keeps a local row that never reached the server and re-uploads it', () => {
  markPending('todos', 'offline')
  const { items, toUpload } = mergeWithPending('todos', [{ id: 'a' }], [{ id: 'a' }, { id: 'offline' }])
  assert.deepEqual(items.map((i) => i.id).sort(), ['a', 'offline'])
  assert.deepEqual(toUpload.map((i) => i.id), ['offline'])
})

test('drops a confirmed local row missing remotely (deleted on another device)', () => {
  markPending('todos', 'gone')
  clearPending('todos', 'gone')
  const { items, toUpload } = mergeWithPending('todos', [{ id: 'a' }], [{ id: 'a' }, { id: 'gone' }])
  assert.deepEqual(items.map((i) => i.id), ['a'])
  assert.deepEqual(toUpload, [])
})

test('prefers an unsynced local edit over the stale remote copy', () => {
  markPending('links', 'a')
  const { items, toUpload } = mergeWithPending(
    'links',
    [{ id: 'a', title: 'old' }],
    [{ id: 'a', title: 'new' }]
  )
  assert.equal(items[0].title, 'new')
  assert.deepEqual(toUpload.map((i) => i.id), ['a'])
})

test('pending ids are tracked per table', () => {
  markPending('routines', 'x')
  const { items } = mergeWithPending('todos', [], [{ id: 'x' }])
  assert.deepEqual(items, [])
})
