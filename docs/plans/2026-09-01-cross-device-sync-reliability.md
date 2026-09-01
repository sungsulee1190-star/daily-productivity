# 크로스 디바이스 동기화 신뢰성 수정 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 현재 커밋되지 않은 "Supabase 동기화 로깅" 작업을 마무리하고, 그 로깅이 드러내려던 실제 동기화 버그(루틴 미동기화, 삭제 부활, 첫 로그인 백필 누락, 완료일 UTC 버그, 계정 전환 데이터 누수)를 수정한다.

**Architecture:** 각 도메인은 `store/*.ts`의 Zustand + `persist`(localStorage) 스토어. 뮤테이션은 로컬 우선 기록 후 fire-and-forget 으로 Supabase upsert. 로그인 시 `components/auth/AuthGate.tsx`가 `fetch*(user.id)`를 호출해 원격 행과 로컬을 병합한다. 이 계획은 새 아키텍처를 추가하지 않고 기존 병합/동기화 경로의 구멍을 메운다.

**Tech Stack:** Next.js 16 App Router · TypeScript · Zustand · `@supabase/ssr` 브라우저 클라이언트 · date-fns · Windows / PowerShell + Git Bash

---

## 0. 현재 진행 중이던 작업 (커밋 전 상태)

`git status` 기준 수정된 파일:

| 파일 | 진행 내용 | 상태 |
|---|---|---|
| `store/routineStore.ts` | silent `catch {}` → `console.error` + `error` 반환값 체크 + `console.debug` 큐잉 로그 | 로깅만 추가됨 |
| `store/todoStore.ts` | 동일 (upsert / delete / fetch) | 로깅만 추가됨 |
| `store/trackerStore.ts` | 동일 + `deleteSession`을 async IIFE로 전환 | 로깅만 추가됨 |
| `.claude/settings.local.json` | 권한 allowlist 확장 | 그대로 둠 |

기준선 검증(현재 커밋 전 상태 포함): `npx tsc --noEmit` PASS · `npm run build` PASS · `npm run lint` 는 **기존부터** error 3건(`react-hooks/set-state-in-effect`, 전부 이 계획 범위 밖 파일) + warning 13건. build를 막지는 않음.

---

## 1. 발견된 문제 (증거 포함)

### P1 — (Critical) `AuthGate`가 `fetchRoutines`를 호출하지 않음
`components/auth/AuthGate.tsx:24-34`의 로그인 effect는 todos/habits/projects/notes/ideas/links/sessions만 fetch한다. `routineStore`는 어디서도 부팅되지 않고, `userId`는 사용자가 `/routine` 페이지를 열 때만(`app/routine/page.tsx:60` → `fetchRoutines`) 설정된다.
- 결과 1: 홈(`/`)의 `components/home/HomeRoutineWidget.tsx`에서 `addRoutine`/`toggleRoutine` 하면 `userId === null` → `[RoutineSync] Cannot sync: userId not set` 로그만 남고 클라우드 저장 안 됨.
- 결과 2: 다른 기기에서 만든 루틴이 홈 위젯에 안 보임(`/routine` 방문 전까지 fetch 자체가 안 일어남).

### P2 — (Critical) `deleteRoutine`가 Supabase 삭제를 안 함
`store/routineStore.ts:194-198` — 로컬 배열에서만 제거. 다른 기기(또는 같은 기기 재로그인)에서 `fetchRoutines`가 원격 행으로 로컬을 덮어쓰므로 **삭제한 루틴이 부활**한다. 비교: `todoStore.deleteTodo`는 `deleteFromSupabase(id)` 호출함(정상).

### P3 — (High) 첫 로그인 시 로컬 데이터 상향 백필 누락
`store/todoStore.ts:169`은 `data && data.length > 0`일 때만 병합한다. Supabase가 비어 있으면 **기존 localStorage 데이터를 클라우드로 올리지 않는다.** `routineStore.fetchRoutines`도 동일(상향 push 코드 없음). 오직 `trackerStore.fetchSessions:129-135`만 "빈 원격이면 로컬을 push"를 한다.
- 결과: 기존에 로컬로만 쓰던 사용자가 처음 로그인해도 todos/routines가 클라우드에 안 올라가고, 두 번째 기기는 계속 빈 상태.

### P4 — (High) `completedAt`을 UTC로 저장 → KST 오전 완료건 "오늘 완료"에서 누락
`store/todoStore.ts:243,315,324`가 `new Date().toISOString()`(UTC)로 `completedAt`을 찍는다. 소비 측은 `completedAt.startsWith(todayStr)`로 버킷하는데 `todayStr`은 로컬 날짜(`app/page.tsx` 근방, `components/ProgressCards.tsx`). KST(UTC+9)에서 08:00에 완료하면 `...T23:00:00.000Z`(전날 UTC) → 매칭 실패로 "오늘 완료"에서 사라짐. (`.omc/plans/autopilot-impl.md` §1.1에서도 동일 지적.)

### P5 — (Medium) `userId`를 localStorage에 persist → 계정 전환 데이터 누수
`store/trackerStore.ts:308`(`{ name: 'daily-tracker' }` — partialize 없음), `store/routineStore.ts`, `store/todoStore.ts` 모두 `userId`를 통째로 persist한다. 사용자 A 로그아웃 → B 로그인 시, `fetch*`가 끝나기 전 뮤테이션이 **A의 `user_id`로 upsert**될 수 있다.

### P6 — (Medium) `tracker_sessions` 병합이 `startDate`/`endDate`를 로컬 의존
`store/trackerStore.ts:56-64` upsert 페이로드에 기간 컬럼이 없고, `fetchSessions:121-122`는 `local?.startDate`만 읽는다. 스키마(`lib/database.types.ts:284-312`)와 마이그레이션(`scripts/migration_add_links_tracker.sql`)에도 `start_date`/`end_date` 컬럼이 없음 → 프로젝트 기간이 기기 간 전파 안 됨.

### P7 — (Low) 로깅 작업이 절반만 됨
`store/linkStore.ts`(33,70,98), `store/projectStore.ts`(73,82,126)에 silent `catch {}` 6곳이 남아 있음. 동일 패턴으로 정리해야 로그 관측이 일관됨.

### P8 — (검증 BLOCKED) 마이그레이션 적용 여부 확인 불가
`routines` / `tracker_sessions` / `links` 테이블이 실제 Supabase 프로젝트에 생성됐는지, 자격증명·네트워크가 없어 이 환경에서 확인 불가. **사용자 확인 필요** (§2).

---

## 2. 착수 전 사용자 확인 (BLOCKING)

계획 실행 전에 아래를 사용자에게 물어 확정한다. 미확정 시 해당 태스크는 `BLOCKED` 처리.

- **Q1.** Supabase SQL Editor에서 `scripts/migration_add_todo_extended_fields.sql`(routines 포함)와 `scripts/migration_add_links_tracker.sql`이 이미 실행됐는가? 안 됐다면 이번에 실행할 것인가?
- **Q2.** P3(첫 로그인 시 로컬→클라우드 상향 백필)을 todos/routines에도 적용하는 것에 동의하는가? (기존 trackerStore 동작과 일치. 리스크: 오래된/오염된 localStorage가 클라우드로 올라갈 수 있음.)
- **Q3.** P6(tracker 세션 기간 동기화)은 `tracker_sessions`에 `start_date` / `end_date` 컬럼 추가(마이그레이션)를 수반한다. 이번 범위에 포함할 것인가, 별도로 뺄 것인가?
- **Q4.** `.env.local`에 유효한 Supabase 값이 있는 dev 환경에서 사용자가 직접 로그인해 콘솔 로그를 확인해줄 수 있는가? (실사용 경로 검증에 필요.)

---

## 3. 범위

**In scope:** P1, P2, P3(Q2 승인 시), P4, P5, P7. P6은 Q3 승인 시.
**Out of scope:** 신규 기능 3종(`.omc/plans/autopilot-impl.md` — §9 참조). 기존 lint error 3건. Realtime 구독. `weekKey` ISO 주차 계산 버그(`format(now,'yyyy')` + `'II'` 불일치).

**테스트 전략:** 이 저장소엔 테스트 러너가 없다(`tests/*.test.mjs`는 `node --test`로 도는 정적 검사). 각 태스크는 (a) `tests/sync-reliability.test.mjs`에 정적 assertion 추가 → 실패 확인 → 구현 → 통과, (b) `npx tsc --noEmit` + `npm run build`, (c) 해당 시 dev 서버 수동 확인으로 검증한다.

---

## 4. Task 1 — 로깅 작업 마무리 (P7) 및 현재 변경분 커밋

**Files:**
- Modify: `store/linkStore.ts:33`, `:70`, `:98`
- Modify: `store/projectStore.ts:73`, `:82`, `:126`

**Step 1: 대상 확인**

Run: `cd "C:/0_이성수책임/00-프로젝트저장소/daily-productivity" && grep -n "} catch {" store/linkStore.ts store/projectStore.ts`
Expected: 6줄 출력.

**Step 2: 각 silent catch를 도메인 태그 로깅으로 교체**

`store/todoStore.ts:91-98`의 패턴을 그대로 사용. 각 함수의 `try` 블록 안 Supabase 호출도 `const { error } = await ...` 형태로 바꾸고 `error` 존재 시 `console.error('[LinkSync] ... failed', { ...id, error: error.message, details: error.details, hint: error.hint, code: error.code })` 후 `return`. `catch (error)` 블록은:

```ts
} catch (error) {
  console.error('[LinkSync] <op> failed', {
    <entity>Id: <id>,
    error: error instanceof Error ? error.message : String(error),
  })
}
```

`projectStore.ts`는 태그 `[ProjectSync]`. `fetch*` 함수에는 `hint`/`stack` 생략(todoStore fetch 패턴과 동일하게 `error.message`, `error.details`, `error.code`만).

**Step 3: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 통과(출력 없음).

**Step 4: 빌드**

Run: `npm run build`
Expected: `✓ Compiled successfully`, 20 라우트.

**Step 5: 커밋** (현재 스토어 3종 변경분 + 이번 정리분 함께)

```bash
git add store/routineStore.ts store/todoStore.ts store/trackerStore.ts store/linkStore.ts store/projectStore.ts
git commit -m "chore(sync): surface Supabase sync errors with tagged logging across stores"
```

`.claude/settings.local.json`은 커밋하지 않는다(로컬 권한 파일).

---

## 5. Task 2 — 루틴 스토어를 로그인 시 부팅 (P1)

**Files:**
- Modify: `components/auth/AuthGate.tsx:10-22` (import + destructure), `:24-34` (effect)
- Test: `tests/sync-reliability.test.mjs` (신규)

**Step 1: 실패 테스트 작성** — `tests/sync-reliability.test.mjs` 생성

```mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('AuthGate boots the routine store on login', () => {
  const src = read('components/auth/AuthGate.tsx')
  assert.match(src, /useRoutineStore/, 'imports useRoutineStore')
  assert.match(src, /fetchRoutines\(user\.id\)/, 'calls fetchRoutines in the login effect')
})
```

**Step 2: 실패 확인**

Run: `node --test tests/sync-reliability.test.mjs`
Expected: FAIL — "imports useRoutineStore".

**Step 3: 구현** — `AuthGate.tsx`

- import 추가: `import { useRoutineStore } from '@/store/routineStore'`
- 구조분해 추가: `const { fetchRoutines } = useRoutineStore()`
- effect 안(`fetchSessions(user.id)` 다음 줄)에 `fetchRoutines(user.id)` 추가.

**Step 4: 통과 확인 + 타입/빌드**

Run: `node --test tests/sync-reliability.test.mjs && npx tsc --noEmit && npm run build`
Expected: 테스트 PASS, tsc 통과, 빌드 성공.

**Step 5: 커밋**

```bash
git add components/auth/AuthGate.tsx tests/sync-reliability.test.mjs
git commit -m "fix(sync): boot routine store on login so home widget syncs (P1)"
```

---

## 6. Task 3 — `deleteRoutine`가 Supabase 행을 삭제하도록 (P2)

**Files:**
- Modify: `store/routineStore.ts` (`deleteRoutine` 및 새 `deleteRoutineFromSupabase` 헬퍼)
- Test: `tests/sync-reliability.test.mjs`

**Step 1: 실패 테스트 추가**

```mjs
test('deleteRoutine removes the row from Supabase', () => {
  const src = read('store/routineStore.ts')
  const fn = src.slice(src.indexOf('deleteRoutine:'))
  assert.match(fn.slice(0, 400), /from\('routines'\)\s*\.delete\(\)/, 'deleteRoutine issues a Supabase delete')
})
```

**Step 2: 실패 확인**

Run: `node --test tests/sync-reliability.test.mjs`
Expected: FAIL — "deleteRoutine issues a Supabase delete".

**Step 3: 구현** — `store/routineStore.ts`

`syncRoutineToSupabase` 아래에 헬퍼 추가(`todoStore.deleteFromSupabase` 패턴):

```ts
async function deleteRoutineFromSupabase(id: string) {
  try {
    const supabase = createClient()
    console.debug('[RoutineSync] Deleting routine', { id })
    const { error } = await supabase.from('routines').delete().eq('id', id)
    if (error) {
      console.error('[RoutineSync] Delete failed', {
        routineId: id,
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return
    }
    console.debug('[RoutineSync] Delete successful', { id })
  } catch (error) {
    console.error('[RoutineSync] Delete failed', {
      routineId: id,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
```

`deleteRoutine` 수정:

```ts
deleteRoutine: (id) => {
  set((s) => ({ routines: s.routines.filter((r) => r.id !== id) }))
  deleteRoutineFromSupabase(id)
},
```

**Step 4: 통과 + 타입/빌드**

Run: `node --test tests/sync-reliability.test.mjs && npx tsc --noEmit && npm run build`
Expected: 전부 통과.

**Step 5: 커밋**

```bash
git add store/routineStore.ts tests/sync-reliability.test.mjs
git commit -m "fix(sync): delete routine row from Supabase so it does not resurrect (P2)"
```

---

## 7. Task 4 — 완료일을 로컬 날짜 기준으로 (P4)

**Files:**
- Modify: `lib/utils.ts` (헬퍼 추가)
- Modify: `store/todoStore.ts` (완료 시각 3곳은 그대로 ISO 저장하되, 소비 측 비교를 로컬 기준으로)
- Modify: `app/page.tsx`, `components/ProgressCards.tsx` (비교 호출부)
- Test: `tests/sync-reliability.test.mjs`

> 저장 포맷(`completedAt`)은 ISO(UTC 순간) 유지 — 여러 기기·타임존에서 의미가 명확한 절대시각이라야 함. 고치는 건 **"오늘"을 판정하는 비교 로직**이다.

**Step 1: `lib/utils.ts` 현재 내용 확인**

Run: `sed -n '1,20p' lib/utils.ts`
Expected: 1행 date-fns import 확인.

**Step 2: 실패 테스트 추가**

```mjs
test('utils exposes a local-date completion check', () => {
  const src = read('lib/utils.ts')
  assert.match(src, /export function isCompletedOn/, 'isCompletedOn helper exists')
})
test('home + progress cards use isCompletedOn, not startsWith on completedAt', () => {
  for (const p of ['app/page.tsx', 'components/ProgressCards.tsx']) {
    const src = read(p)
    assert.doesNotMatch(src, /completedAt[^\n]*\.startsWith\(/, `${p} no longer buckets completedAt by startsWith`)
  }
})
```

**Step 3: 실패 확인**

Run: `node --test tests/sync-reliability.test.mjs`
Expected: FAIL — "isCompletedOn helper exists".

**Step 4: 구현**

`lib/utils.ts` — 1행 import에 `format`, `parseISO` 추가(이미 있으면 생략) 후 말미에:

```ts
export function toLocalDateKey(iso: string): string {
  return format(parseISO(iso), 'yyyy-MM-dd')
}

export function isCompletedOn(completedAt: string | undefined, dateKey: string): boolean {
  if (!completedAt) return false
  return toLocalDateKey(completedAt) === dateKey
}
```

`app/page.tsx` / `components/ProgressCards.tsx` — `t.completedAt?.startsWith(todayStr)` 형태의 비교를 `isCompletedOn(t.completedAt, todayStr)`로 교체. `import { isCompletedOn } from '@/lib/utils'` 추가. (정확한 위치는 `grep -n "completedAt" app/page.tsx components/ProgressCards.tsx`로 확인.)

**Step 5: 통과 + 타입/빌드**

Run: `node --test tests/sync-reliability.test.mjs && npx tsc --noEmit && npm run build`
Expected: 전부 통과.

**Step 6: 커밋**

```bash
git add lib/utils.ts app/page.tsx components/ProgressCards.tsx tests/sync-reliability.test.mjs
git commit -m "fix: bucket completed todos by local date, not UTC prefix (P4)"
```

---

## 8. Task 5 — 첫 로그인 시 로컬 데이터 상향 백필 (P3) — *Q2 승인 시*

**Files:**
- Modify: `store/todoStore.ts` (`fetchTodos`의 `data.length > 0` 분기에 `else`)
- Modify: `store/routineStore.ts` (`fetchRoutines`의 `data` 분기에 빈 배열 처리)
- Test: `tests/sync-reliability.test.mjs`

**Step 1: 실패 테스트 추가**

```mjs
test('empty remote triggers local backfill for todos and routines', () => {
  assert.match(read('store/todoStore.ts'), /data\.length === 0[\s\S]{0,200}syncToSupabase/, 'todoStore backfills on empty remote')
  assert.match(read('store/routineStore.ts'), /length === 0[\s\S]{0,200}syncRoutineToSupabase/, 'routineStore backfills on empty remote')
})
```

**Step 2: 실패 확인**

Run: `node --test tests/sync-reliability.test.mjs`
Expected: FAIL.

**Step 3: 구현** — `trackerStore.fetchSessions:129-135` 패턴을 그대로 이식

`todoStore.fetchTodos`:

```ts
if (data && data.length > 0) {
  // ...기존 병합...
  set({ todos: merged })
} else if (data && data.length === 0) {
  const local = get().todos
  for (const todo of local) syncToSupabase(todo, userId)
}
```

`routineStore.fetchRoutines`:

```ts
if (data && data.length > 0) {
  set({ routines: data.map(/* ...기존... */) })
} else if (data && data.length === 0) {
  const local = get().routines
  for (const r of local) syncRoutineToSupabase(r, userId)
}
```

**Step 4: 통과 + 타입/빌드**

Run: `node --test tests/sync-reliability.test.mjs && npx tsc --noEmit && npm run build`
Expected: 전부 통과.

**Step 5: 커밋**

```bash
git add store/todoStore.ts store/routineStore.ts tests/sync-reliability.test.mjs
git commit -m "fix(sync): backfill local todos/routines to Supabase on first login (P3)"
```

---

## 9. Task 6 — `userId`를 localStorage에서 제외 (P5)

**Files:**
- Modify: `store/todoStore.ts:343-345`, `store/routineStore.ts:200-210`, `store/trackerStore.ts:308`
- (검토) `store/linkStore.ts`, `store/projectStore.ts`, `store/habitStore.ts`, `store/noteStore.ts`, `store/ideaStore.ts` — 동일하게 `userId`를 persist하면 함께 처리
- Test: `tests/sync-reliability.test.mjs`

**Step 1: 실제로 persist되는 스토어 조사**

Run: `grep -n "userId" store/*.ts | grep -i "partialize\|persist\|name:"`
그리고 각 스토어 persist 옵션에 `partialize`가 없는지 확인.

**Step 2: 실패 테스트 추가**

```mjs
test('stores do not persist userId to localStorage', () => {
  for (const p of ['store/todoStore.ts', 'store/routineStore.ts', 'store/trackerStore.ts']) {
    assert.match(read(p), /partialize:\s*\(s\w*\)\s*=>/, `${p} has a partialize that excludes userId`)
  }
})
```

**Step 3: 실패 확인**

Run: `node --test tests/sync-reliability.test.mjs`
Expected: FAIL.

**Step 4: 구현** — 각 persist 옵션 객체에 `partialize` 추가

- `todoStore`: `{ name: 'daily-productivity-todos', partialize: (s) => ({ todos: s.todos, activeClip: s.activeClip }) }`
- `trackerStore`: `{ name: 'daily-tracker', partialize: (s) => ({ sessions: s.sessions }) }`
- `routineStore`: 기존 `onRehydrateStorage`는 유지하고 `partialize: (s) => ({ routines: s.routines })` 추가.

localStorage 키는 그대로 유지(마이그레이션 불필요, 다음 저장 때 `userId`만 빠짐). rehydrate 후 `userId`는 `null`로 시작하고, `AuthGate`/페이지의 `fetch*`가 로그인 시 다시 세팅한다 — 로그인된 사용자가 `fetch*` 완료 전 뮤테이션하면 그 1건은 로컬에만 남고 이후 백필(P3)로 회수됨. 허용 가능한 트레이드오프.

**Step 5: 통과 + 타입/빌드 + 수동 확인**

Run: `node --test tests/sync-reliability.test.mjs && npx tsc --noEmit && npm run build`
그리고 dev 서버에서 로그인 → DevTools > Application > Local Storage에서 `daily-tracker` 등 값에 `userId`가 없는지 확인.

**Step 6: 커밋**

```bash
git add store/todoStore.ts store/routineStore.ts store/trackerStore.ts tests/sync-reliability.test.mjs
git commit -m "fix(sync): stop persisting userId to localStorage to prevent account bleed (P5)"
```

---

## 10. Task 7 — tracker 세션 기간 동기화 (P6) — *Q3 승인 시*

**Files:**
- Create: `scripts/migration_add_tracker_dates.sql`
- Modify: `lib/database.types.ts` (`tracker_sessions`의 Row/Insert/Update에 `start_date`, `end_date`)
- Modify: `store/trackerStore.ts` (`syncSessionToSupabase` 페이로드 + `fetchSessions` 매핑)
- Test: `tests/sync-reliability.test.mjs`

**Step 1: 마이그레이션 SQL 작성** — `scripts/migration_add_tracker_dates.sql`

```sql
-- Migration: add project period columns to tracker_sessions
-- Run in Supabase Dashboard > SQL Editor
alter table public.tracker_sessions
  add column if not exists start_date text,
  add column if not exists end_date text;
```

**Step 2: 실패 테스트 추가**

```mjs
test('tracker session sync carries start/end date', () => {
  const src = read('store/trackerStore.ts')
  assert.match(src, /start_date: session\.startDate/, 'upsert sends start_date')
  assert.match(src, /end_date: session\.endDate/, 'upsert sends end_date')
  assert.match(src, /startDate: r\.start_date/, 'fetch maps start_date back')
})
```

**Step 3: 실패 확인**

Run: `node --test tests/sync-reliability.test.mjs`
Expected: FAIL.

**Step 4: 구현**

`lib/database.types.ts` — `tracker_sessions` Row에 `start_date: string | null` / `end_date: string | null`, Insert/Update에 `start_date?: string | null` / `end_date?: string | null` 추가.

`store/trackerStore.ts` `syncSessionToSupabase` upsert 객체에:
```ts
      start_date: session.startDate ?? null,
      end_date: session.endDate ?? null,
```
`fetchSessions` 매핑에서 `startDate: r.start_date ?? local?.startDate` / `endDate: r.end_date ?? local?.endDate`.

**Step 5: 통과 + 타입/빌드**

Run: `node --test tests/sync-reliability.test.mjs && npx tsc --noEmit && npm run build`
Expected: 전부 통과.

**Step 6: 커밋**

```bash
git add scripts/migration_add_tracker_dates.sql lib/database.types.ts store/trackerStore.ts tests/sync-reliability.test.mjs
git commit -m "feat(sync): sync tracker session start/end dates across devices (P6)"
```

**Step 7:** 사용자에게 `scripts/migration_add_tracker_dates.sql`을 Supabase에서 실행하라고 안내.

---

## 11. Task 8 — 통합 검증 및 실사용 경로 확인

**Step 1: 전체 정적 검증**

```bash
npx tsc --noEmit
npm run lint          # 신규 error 0 (기존 error 3건은 그대로일 수 있음)
npm run build
node --test tests/sync-reliability.test.mjs tests/todo-feature-static.test.mjs
```
Expected: tsc 통과, build 성공, 테스트 전부 PASS, lint 신규 error 없음.

**Step 2: dev 서버 실사용 경로** (Q4 = 사용자 협조 필요)

Run: `npm run dev` → 사용자가 수행:
1. 로그인 → DevTools 콘솔에 `[TodoSync]`/`[RoutineSync]`/`[TrackerSync]` `Upsert successful` 로그가 뜨는지, `code: '42P01'`(테이블 없음)/`42501`(RLS) 등 에러가 없는지.
2. 홈에서 루틴 추가/체크 → `[RoutineSync] Upsert successful` 확인 (P1).
3. 루틴 삭제 → `[RoutineSync] Delete successful` → 새로고침 후 부활 안 함 (P2).
4. 두 번째 브라우저(또는 시크릿 창)에서 같은 계정 로그인 → 1번에서 만든 데이터가 보이는지 (P3, P1).
5. 오전(KST 09:00 이전) 완료 처리한 todo가 "오늘 완료"에 남는지 — 불가하면 시스템 시계를 조정하거나 코드로 `completedAt`을 과거 UTC로 넣어 확인 (P4).

**Step 3: 최종 리뷰 보고** (CLAUDE.md 형식)

`판정: COMPLETE / PASS WITH RISKS / FAIL / BLOCKED` + 변경 파일 + 검증(명령/결과/실제 경로 여부) + 위험. Supabase 실경로(로그인+동기화)를 사용자가 확인하지 못하면 `COMPLETE` 대신 `PASS WITH RISKS` 또는 `BLOCKED`.

---

## 12. Part B — 신규 기능 3종 (별도 실행)

`.omc/plans/autopilot-impl.md`에 이미 상세 설계(24개 신규 파일, ~4,470 LOC, Wave 0–5)가 있다. **이 계획(Part A)을 먼저 머지·검증한 뒤** 착수한다. Part B 착수 전 확정 필요:

- **D1** 다크모드: `app/globals.css`에 `@media (prefers-color-scheme: dark)` 토큰 블록 추가 여부 (현재 다크모드 토큰 없음).
- **D2** 팀 RLS: MVP는 owner-scoped(`auth.uid() = owner_id`), `member_ids uuid[]`는 컬럼만.
- **D3** 칸반/산출물 저장: jsonb 배열 대신 정규화 테이블(`team_tasks`, `team_deliverables`).
- **D4** "git 커밋 기반 AI 인사이트": Phase A는 수동 텍스트 필드, Phase B(선택)는 `app/api/github/insight/route.ts`.

Part B의 선행 수정(`lib/utils.ts` 로컬 날짜 헬퍼)은 이 계획 Task 4에서 이미 처리되므로 중복 제거할 것.

---

## 13. 커밋 요약 (예상)

1. `chore(sync): surface Supabase sync errors with tagged logging across stores`
2. `fix(sync): boot routine store on login so home widget syncs (P1)`
3. `fix(sync): delete routine row from Supabase so it does not resurrect (P2)`
4. `fix: bucket completed todos by local date, not UTC prefix (P4)`
5. `fix(sync): backfill local todos/routines to Supabase on first login (P3)` *(Q2)*
6. `fix(sync): stop persisting userId to localStorage to prevent account bleed (P5)`
7. `feat(sync): sync tracker session start/end dates across devices (P6)` *(Q3)*
