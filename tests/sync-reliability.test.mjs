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
  const idx = src.indexOf('deleteRoutine:')
  assert.ok(idx > -1, 'deleteRoutine exists')
  assert.match(src.slice(idx, idx + 400), /deleteRoutineFromSupabase\(/, 'deleteRoutine calls the Supabase delete helper')
  assert.match(src, /from\('routines'\)\s*\.delete\(\)/, 'a routines delete query exists')
})
