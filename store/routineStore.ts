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
  if (!userId) {
    console.warn('[RoutineSync] Cannot sync: userId is null', { routineId: routine.id })
    return
  }
  try {
    const supabase = createClient()
    console.debug('[RoutineSync] Upserting routine', { id: routine.id, userId, title: routine.title })
    const { error } = await supabase.from('routines').upsert({
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
    if (error) {
      console.error('[RoutineSync] Upsert failed', {
        routineId: routine.id,
        userId,
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return
    }
    console.debug('[RoutineSync] Upsert successful', { id: routine.id })
  } catch (error) {
    console.error('[RoutineSync] Upsert failed', {
      routineId: routine.id,
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}

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

function syncRoutineById(id: string, get: () => RoutineStore) {
  const { userId, routines } = get()
  if (!userId) {
    console.warn('[RoutineSync] Cannot sync: userId is null', { routineId: id })
    return
  }
  const routine = routines.find((r) => r.id === id)
  if (routine) {
    console.debug('[RoutineSync] Queuing sync for routine', { id })
    syncRoutineToSupabase(routine, userId)
  }
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
          const { data, error } = await supabase
            .from('routines')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })

          if (error) {
            console.error('[RoutineSync] fetchRoutines failed', {
              userId,
              error: error.message,
              details: error.details,
              code: error.code,
            })
          }

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
        } catch (error) {
          console.error('[RoutineSync] fetchRoutines failed', {
            userId,
            error: error instanceof Error ? error.message : String(error),
          })
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
        console.debug('[RoutineSync] Routine created locally', { id: newRoutine.id, userId })
        if (userId) {
          syncRoutineToSupabase(newRoutine, userId)
        } else {
          console.warn('[RoutineSync] Cannot sync new routine: userId not set', { id: newRoutine.id })
        }
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
        deleteRoutineFromSupabase(id)
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
