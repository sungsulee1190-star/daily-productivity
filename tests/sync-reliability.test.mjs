import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('AuthGate boots the routine store on login (P1)', () => {
  const src = read('components/auth/AuthGate.tsx')
  assert.match(src, /useRoutineStore/, 'imports useRoutineStore')
  assert.match(src, /fetchRoutines\(user\.id\)/, 'calls fetchRoutines in the login effect')
})

test('deleteRoutine removes the row from Supabase (P2)', () => {
  const src = read('store/routineStore.ts')
  assert.match(src, /async function deleteRoutineFromSupabase\s*\(/, 'delete helper defined')
  assert.match(src, /from\('routines'\)\s*\.delete\(\)\s*\.eq\(\s*'id',\s*id\s*\)/, 'routines delete query exists')
  const idx = src.indexOf('deleteRoutine: (id) =>')
  assert.ok(idx > -1, 'deleteRoutine action exists')
  assert.match(src.slice(idx, idx + 300), /deleteRoutineFromSupabase\(id\)/, 'deleteRoutine action calls the helper')
})

test('utils exposes a local-date completion check (P4)', () => {
  const src = read('lib/utils.ts')
  assert.match(src, /export function isCompletedOn\s*\(/, 'isCompletedOn helper exists')
  assert.match(src, /export function toLocalDateKey\s*\(/, 'toLocalDateKey helper exists')
})

test('home + progress cards no longer bucket completedAt with startsWith (P4)', () => {
  for (const p of ['app/page.tsx', 'components/ProgressCards.tsx', 'app/todo/daily/page.tsx']) {
    const src = read(p)
    assert.doesNotMatch(src, /completedAt[^\n]{0,40}\.startsWith\(/, `${p} does not use completedAt.startsWith`)
    assert.match(src, /isCompletedOn\(/, `${p} uses isCompletedOn`)
  }
})

test('empty remote triggers local backfill for todos and routines (P3)', () => {
  assert.match(read('store/todoStore.ts'), /data\.length === 0[\s\S]{0,240}syncToSupabase\(/, 'todoStore backfills todos on empty remote')
  assert.match(read('store/routineStore.ts'), /data\.length === 0[\s\S]{0,240}syncRoutineToSupabase\(/, 'routineStore backfills routines on empty remote')
})

test('stores do not persist userId to localStorage (P5)', () => {
  for (const p of ['store/todoStore.ts', 'store/routineStore.ts', 'store/trackerStore.ts', 'store/linkStore.ts', 'store/projectStore.ts']) {
    assert.match(read(p), /partialize:\s*\(/, `${p} has a partialize`)
    assert.doesNotMatch(read(p), /partialize:\s*\([^)]*\)\s*=>\s*\(\{[^}]*userId/, `${p} partialize omits userId`)
  }
})
