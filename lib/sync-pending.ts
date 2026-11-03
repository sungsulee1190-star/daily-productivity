/**
 * Tracks local rows whose upsert to Supabase has not been confirmed yet
 * (offline, network/RLS failure, tab closed mid-request).
 *
 * On fetch, a local row missing from the remote result is ambiguous: it was
 * either never uploaded, or deleted on another device. Pending rows are the
 * former — keep them and re-upload. Everything else is the latter — drop it,
 * so deletions don't resurrect.
 */

export type SyncTable = 'todos' | 'projects' | 'routines' | 'links' | 'tracker_sessions' | 'ideas'

export const SYNC_PENDING_KEY = 'daily-sync-pending'

type PendingMap = Partial<Record<SyncTable, string[]>>

function read(): PendingMap {
  try {
    return JSON.parse(localStorage.getItem(SYNC_PENDING_KEY) ?? '{}') as PendingMap
  } catch {
    return {}
  }
}

function write(map: PendingMap) {
  try {
    localStorage.setItem(SYNC_PENDING_KEY, JSON.stringify(map))
  } catch {
    // storage unavailable — worst case a failed upload is not retried
  }
}

/** Call before an upsert starts. */
export function markPending(table: SyncTable, id: string) {
  const map = read()
  const ids = map[table] ?? []
  if (!ids.includes(id)) write({ ...map, [table]: [...ids, id] })
}

/** Call once Supabase confirmed the upsert (or the row was deleted). */
export function clearPending(table: SyncTable, id: string) {
  const map = read()
  const ids = map[table]
  if (ids?.includes(id)) write({ ...map, [table]: ids.filter((x) => x !== id) })
}

/**
 * Merges the remote result with local rows the server hasn't seen yet.
 * Returns the rows to show and the local-only rows to re-upload.
 */
export function mergeWithPending<T extends { id: string }>(
  table: SyncTable,
  remote: T[],
  local: T[]
): { items: T[]; toUpload: T[] } {
  const pending = new Set(read()[table] ?? [])
  const remoteIds = new Set(remote.map((r) => r.id))
  const toUpload = local.filter((l) => !remoteIds.has(l.id) && pending.has(l.id))
  // A pending row that also exists remotely may hold newer local edits.
  const pendingEdits = local.filter((l) => remoteIds.has(l.id) && pending.has(l.id))
  const localById = new Map(pendingEdits.map((l) => [l.id, l]))
  const items = [...toUpload, ...remote.map((r) => localById.get(r.id) ?? r)]
  return { items, toUpload: [...toUpload, ...pendingEdits] }
}
