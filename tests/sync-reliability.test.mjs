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
