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
  items: TrackerItem[]
  createdAt: string
  updatedAt: string
}

interface TrackerStore {
  sessions: TrackerSession[]
  userId: string | null
  fetchSessions: (userId: string) => Promise<void>
  addSession: (name: string, month: string) => string
  deleteSession: (id: string) => void
  addItem: (sessionId: string, item: Omit<TrackerItem, 'id' | 'createdAt' | 'updatedAt' | 'history'>) => void
  updateItem: (sessionId: string, itemId: string, updates: Partial<TrackerItem>) => void
  deleteItem: (sessionId: string, itemId: string) => void
  addHistory: (sessionId: string, itemId: string, note: string) => void
}

async function syncSessionToSupabase(session: TrackerSession, userId: string) {
  try {
    const supabase = createClient()
    await supabase.from('tracker_sessions').upsert({
      id: session.id,
      user_id: userId,
      name: session.name,
      month: session.month,
      items: session.items as unknown as import('@/lib/database.types').Json,
      created_at: session.createdAt,
      updated_at: session.updatedAt,
    })
  } catch {
    // non-blocking
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
          const { data } = await supabase
            .from('tracker_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

          if (data && data.length > 0) {
            set({
              sessions: data.map((r) => ({
                id: r.id,
                name: r.name,
                month: r.month,
                items: r.items as unknown as TrackerItem[],
                createdAt: r.created_at,
                updatedAt: r.updated_at,
              })),
            })
          } else {
            // Push existing local sessions to Supabase on first login
            const local = get().sessions
            for (const session of local) {
              syncSessionToSupabase(session, userId)
            }
          }
        } catch {
          // non-blocking
        }
      },

      addSession: (name, month) => {
        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        const newSession: TrackerSession = { id, name, month, items: [], createdAt: now, updatedAt: now }
        set((s) => ({ sessions: [...s.sessions, newSession] }))
        const { userId } = get()
        if (userId) syncSessionToSupabase(newSession, userId)
        return id
      },

      deleteSession: (id) => {
        set((s) => ({ sessions: s.sessions.filter((sess) => sess.id !== id) }))
        try {
          const supabase = createClient()
          supabase.from('tracker_sessions').delete().eq('id', id)
        } catch {
          // non-blocking
        }
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
    { name: 'daily-tracker' }
  )
)
