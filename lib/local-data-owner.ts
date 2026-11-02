/**
 * Local (localStorage) data is shared by everyone using the same browser, so
 * we record which account it belongs to. When a different account logs in,
 * the previous owner's data is wiped instead of being shown or uploaded
 * (backfill / MigrationBanner) under the new account.
 */

const OWNER_KEY = 'daily-local-owner-id'

// Persisted keys holding per-user data. UI preferences (`daily-ui`) are kept.
const USER_DATA_KEYS = [
  'daily-productivity-todos',
  'daily-productivity-projects',
  'daily-productivity-ideas',
  'daily-productivity-routines',
  'daily-productivity-mindmaps',
  'daily-productivity-news',
  'daily-links',
  'daily-tracker',
  'daily-agent-store',
  'openai-api-key',
  'supabase-migration-done',
]

export function clearLocalUserData() {
  try {
    USER_DATA_KEYS.forEach((key) => localStorage.removeItem(key))
    localStorage.removeItem(OWNER_KEY)
  } catch {
    // storage unavailable (private mode etc.) — nothing to clear
  }
}

/**
 * Claims local data for `userId`. Returns true if data belonging to another
 * account was wiped — the caller must reload so in-memory stores reset.
 * Data with no recorded owner (pre-existing installs) is adopted as-is.
 */
export function claimLocalData(userId: string): boolean {
  try {
    const owner = localStorage.getItem(OWNER_KEY)
    if (owner && owner !== userId) {
      clearLocalUserData()
      localStorage.setItem(OWNER_KEY, userId)
      return true
    }
    if (!owner) localStorage.setItem(OWNER_KEY, userId)
  } catch {
    // storage unavailable — nothing persisted to leak
  }
  return false
}
