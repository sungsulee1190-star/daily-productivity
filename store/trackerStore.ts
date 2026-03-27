'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'

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
  addSession: (name: string, month: string) => string
  deleteSession: (id: string) => void
  addItem: (sessionId: string, item: Omit<TrackerItem, 'id' | 'createdAt' | 'updatedAt' | 'history'>) => void
  updateItem: (sessionId: string, itemId: string, updates: Partial<TrackerItem>) => void
  deleteItem: (sessionId: string, itemId: string) => void
  addHistory: (sessionId: string, itemId: string, note: string) => void
}

export const useTrackerStore = create<TrackerStore>()(
  persist(
    (set, get) => ({
      sessions: [],

      addSession: (name, month) => {
        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        set((s) => ({
          sessions: [
            ...s.sessions,
            { id, name, month, items: [], createdAt: now, updatedAt: now },
          ],
        }))
        return id
      },

      deleteSession: (id) =>
        set((s) => ({ sessions: s.sessions.filter((sess) => sess.id !== id) })),

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
      },
    }),
    { name: 'daily-tracker' }
  )
)
