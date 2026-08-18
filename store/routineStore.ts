'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase'

export interface Routine {
  id: string
  title: string
  type: 'weekly' | 'monthly' | 'daily'
  checkedWeeks: string[]   // "2024-W01" or "2025-03-W1" format
  checkedMonths: string[]  // "2024-03" format
  checkedDays: string[]    // "2025-03-27" format
  hidden: boolean
}

export interface RoutineStore {
  routines: Routine[]
  userId: string | null
  setUserId: (userId: string | null) => void
  fetchRoutines: (userId: string) => Promise<void>
  addRoutine: (title: string, type: 'weekly' | 'monthly' | 'daily') => void
  toggleRoutine: (id: string, key?: string) => void
  hideRoutine: (id: string) => void
  deleteRoutine: (id: string) => void
}

export async function syncRoutineToSupabase(routine: Routine, userId: string) {
  try {
    const supabase = createClient()
    await supabase.from('routines').upsert({
      id: routine.id,
      user_id: userId,
      title: routine.title,
      type: routine.type,
      checked_weeks: routine.checkedWeeks,
      checked_months: routine.checkedMonths,
      checked_days: routine.checkedDays,
      hidden: routine.hidden,
      updated_at: new Date().toISOString(),
    })
  } catch {
    // Local fallback remains available through persisted Zustand state.
  }
}

function syncRoutineById(id: string, get: () => RoutineStore) {
  const { userId, routines } = get()
  if (!userId) return
  const routine = routines.find((r) => r.id === id)
  if (routine) syncRoutineToSupabase(routine, userId)
}

export const useRoutineStore = create<RoutineStore>()(
  persist(
    (set, get) => ({
      routines: [],
      userId: null,
      setUserId: (userId) => set({ userId }),
      fetchRoutines: async (userId: string) => {
        set({ userId })
        try {
          const supabase = createClient()
          const { data } = await supabase
            .from('routines')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })

          if (data) {
            set({
              routines: data.map((row) => ({
                id: row.id,
                title: row.title,
                type: row.type as 'weekly' | 'monthly' | 'daily',
                checkedWeeks: row.checked_weeks ?? [],
                checkedMonths: row.checked_months ?? [],
                checkedDays: row.checked_days ?? [],
                hidden: row.hidden,
              })),
            })
          }
        } catch {
          // keep local fallback
        }
      },
      addRoutine: (title, type) => {
        const newRoutine: Routine = {
          id: crypto.randomUUID(),
          title,
          type,
          checkedWeeks: [],
          checkedMonths: [],
          checkedDays: [],
          hidden: false,
        }
        set((s) => ({ routines: [...s.routines, newRoutine] }))
        const { userId } = get()
        if (userId) syncRoutineToSupabase(newRoutine, userId)
      },
      toggleRoutine: (id, key) => {
        const now = new Date()
        const weekKey = key ?? `${format(now, 'yyyy')}-W${format(now, 'II')}`
        const monthKey = format(now, 'yyyy-MM')
        const dayKey = format(now, 'yyyy-MM-dd')
        set((s) => ({
          routines: s.routines.map((r) => {
            if (r.id !== id) return r
            if (r.type === 'weekly') {
              const checked = r.checkedWeeks.includes(weekKey)
              return {
                ...r,
                checkedWeeks: checked
                  ? r.checkedWeeks.filter((k) => k !== weekKey)
                  : [...r.checkedWeeks, weekKey],
              }
            } else if (r.type === 'monthly') {
              const mKey = key ?? monthKey
              const checked = r.checkedWeeks.includes(mKey)
              return {
                ...r,
                checkedWeeks: checked
                  ? r.checkedWeeks.filter((k) => k !== mKey)
                  : [...r.checkedWeeks, mKey],
              }
            } else {
              // daily
              const checked = r.checkedDays.includes(dayKey)
              return {
                ...r,
                checkedDays: checked
                  ? r.checkedDays.filter((k) => k !== dayKey)
                  : [...r.checkedDays, dayKey],
              }
            }
          }),
        }))
        syncRoutineById(id, get)
      },
      hideRoutine: (id) => {
        set((s) => ({
          routines: s.routines.map((r) =>
            r.id === id ? { ...r, hidden: true } : r
          ),
        }))
        syncRoutineById(id, get)
      },
      deleteRoutine: (id) => {
        set((s) => ({
          routines: s.routines.filter((r) => r.id !== id),
        }))
      },
    }),
    {
      name: 'daily-productivity-routines',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.routines = state.routines.map((r) => ({
            ...r,
            checkedDays: r.checkedDays ?? [],
          }))
        }
      },
    }
  )
)
