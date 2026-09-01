'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase'

export type TrackerStatus = 'pending' | 'in_progress' | 'done' | 'blocked'

export interface TrackerItem {
  id: string
  title: string
  status: TrackerStatus
  assignee?: string
  startDate?: string
  dueDate?: string
  notes?: string
  tags?: string[]
  history: Array<{ date: string; note: string; status: string }>
  createdAt: string
  updatedAt: string
}

export interface TrackerSession {
  id: string
  name: string
  month: string
  startDate?: string
  endDate?: string
  items: TrackerItem[]
  createdAt: string
  updatedAt: string
}

interface TrackerStore {
  sessions: TrackerSession[]
  userId: string | null
  fetchSessions: (userId: string) => Promise<void>
  addSession: (name: string, month: string, startDate?: string, endDate?: string) => string
  updateSession: (id: string, updates: Partial<TrackerSession>) => void
  deleteSession: (id: string) => void
  addItem: (sessionId: string, item: Omit<TrackerItem, 'id' | 'createdAt' | 'updatedAt' | 'history'>) => void
  updateItem: (sessionId: string, itemId: string, updates: Partial<TrackerItem>) => void
  deleteItem: (sessionId: string, itemId: string) => void
  addHistory: (sessionId: string, itemId: string, note: string) => void
}

async function syncSessionToSupabase(session: TrackerSession, userId: string) {
  if (!userId) {
    console.warn('[TrackerSync] Cannot sync: userId is null', { sessionId: session.id })
    return
  }
  try {
    const supabase = createClient()
    console.debug('[TrackerSync] Upserting session', { id: session.id, userId, name: session.name })
    const { error } = await supabase.from('tracker_sessions').upsert({
      id: session.id,
      user_id: userId,
      name: session.name,
      month: session.month,
      start_date: session.startDate ?? null,
      end_date: session.endDate ?? null,
      items: session.items as unknown as import('@/lib/database.types').Json,
      created_at: session.createdAt,
      updated_at: session.updatedAt,
    })
    if (error) {
      console.error('[TrackerSync] Upsert failed', {
        sessionId: session.id,
        userId,
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return
    }
    console.debug('[TrackerSync] Upsert successful', { id: session.id })
  } catch (error) {
    console.error('[TrackerSync] Upsert failed', {
      sessionId: session.id,
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}

export const useTrackerStore = create<TrackerStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      userId: null,

      fetchSessions: async (userId: string) => {
        set({ userId })
        try {
          const supabase = createClient()
          const { data, error } = await supabase
            .from('tracker_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

          if (error) {
            console.error('[TrackerSync] fetchSessions failed', {
              userId,
              error: error.message,
              details: error.details,
              code: error.code,
            })
          }

          if (data && data.length > 0) {
            const localSessions = get().sessions
            set({
              sessions: data.map((r) => {
                const local = localSessions.find((s) => s.id === r.id)
                return {
                  id: r.id,
                  name: r.name,
                  month: r.month,
                  startDate: r.start_date ?? local?.startDate,
                  endDate: r.end_date ?? local?.endDate,
                  items: r.items as unknown as TrackerItem[],
                  createdAt: r.created_at,
                  updatedAt: r.updated_at,
                }
              }),
            })
          } else if (data && data.length === 0) {
            // Push existing local sessions to Supabase on first login
            const local = get().sessions
            for (const session of local) {
              syncSessionToSupabase(session, userId)
            }
          }
        } catch (error) {
          console.error('[TrackerSync] fetchSessions failed', {
            userId,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      },

      addSession: (name, month, startDate, endDate) => {
        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        const newSession: TrackerSession = {
          id,
          name,
          month,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          items: [],
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ sessions: [...s.sessions, newSession] }))
        const { userId } = get()
        console.debug('[TrackerSync] Session created locally', { id, userId })
        if (userId) {
          syncSessionToSupabase(newSession, userId)
        } else {
          console.warn('[TrackerSync] Cannot sync new session: userId not set', { id })
        }
        return id
      },

      updateSession: (id, updates) => {
        const now = new Date().toISOString()
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === id ? { ...sess, ...updates, updatedAt: now } : sess
          ),
        }))
        const { userId, sessions } = get()
        if (userId) {
          const updated = sessions.find((s) => s.id === id)
          if (updated) syncSessionToSupabase(updated, userId)
        }
      },

      deleteSession: (id) => {
        set((s) => ({ sessions: s.sessions.filter((sess) => sess.id !== id) }))
        void (async () => {
          try {
            const supabase = createClient()
            console.debug('[TrackerSync] Deleting session', { id })
            const { error } = await supabase.from('tracker_sessions').delete().eq('id', id)
            if (error) {
              console.error('[TrackerSync] Delete failed', {
                sessionId: id,
                error: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
              })
              return
            }
            console.debug('[TrackerSync] Delete successful', { id })
          } catch (error) {
            console.error('[TrackerSync] Delete failed', {
              sessionId: id,
              error: error instanceof Error ? error.message : String(error),
            })
          }
        })()
      },

      addItem: (sessionId, item) => {
        const now = new Date().toISOString()
        const newItem: TrackerItem = {
          ...item,
          id: crypto.randomUUID(),
          history: [],
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? { ...sess, items: [...sess.items, newItem], updatedAt: now }
              : sess
          ),
        }))
        const { userId, sessions } = get()
        if (userId) {
          const updated = sessions.find((s) => s.id === sessionId)
          if (updated) syncSessionToSupabase(updated, userId)
        }
      },

      updateItem: (sessionId, itemId, updates) => {
        const now = new Date().toISOString()
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? {
                  ...sess,
                  updatedAt: now,
                  items: sess.items.map((item) =>
                    item.id === itemId
                      ? { ...item, ...updates, updatedAt: now }
                      : item
                  ),
                }
              : sess
          ),
        }))
        const { userId, sessions } = get()
        if (userId) {
          const updated = sessions.find((s) => s.id === sessionId)
          if (updated) syncSessionToSupabase(updated, userId)
        }
      },

      deleteItem: (sessionId, itemId) => {
        const now = new Date().toISOString()
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? {
                  ...sess,
                  updatedAt: now,
                  items: sess.items.filter((item) => item.id !== itemId),
                }
              : sess
          ),
        }))
        const { userId, sessions } = get()
        if (userId) {
          const updated = sessions.find((s) => s.id === sessionId)
          if (updated) syncSessionToSupabase(updated, userId)
        }
      },

      addHistory: (sessionId, itemId, note) => {
        const now = new Date().toISOString()
        const session = get().sessions.find((s) => s.id === sessionId)
        const item = session?.items.find((i) => i.id === itemId)
        if (!item) return
        const historyEntry = {
          date: format(new Date(), 'yyyy-MM-dd HH:mm'),
          note,
          status: item.status,
        }
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? {
                  ...sess,
                  updatedAt: now,
                  items: sess.items.map((i) =>
                    i.id === itemId
                      ? { ...i, history: [...i.history, historyEntry], updatedAt: now }
                      : i
                  ),
                }
              : sess
          ),
        }))
        const { userId, sessions } = get()
        if (userId) {
          const updated = sessions.find((s) => s.id === sessionId)
          if (updated) syncSessionToSupabase(updated, userId)
        }
      },
    }),
    { name: 'daily-tracker', partialize: (s) => ({ sessions: s.sessions }) }
  )
)
