'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'

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
  addRoutine: (title: string, type: 'weekly' | 'monthly' | 'daily') => void
  toggleRoutine: (id: string, key?: string) => void
  hideRoutine: (id: string) => void
  deleteRoutine: (id: string) => void
}

export const useRoutineStore = create<RoutineStore>()(
  persist(
    (set) => ({
      routines: [],
      addRoutine: (title, type) =>
        set((s) => ({
          routines: [
            ...s.routines,
            {
              id: crypto.randomUUID(),
              title,
              type,
              checkedWeeks: [],
              checkedMonths: [],
              checkedDays: [],
              hidden: false,
            },
          ],
        })),
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
      },
      hideRoutine: (id) =>
        set((s) => ({
          routines: s.routines.map((r) =>
            r.id === id ? { ...r, hidden: true } : r
          ),
        })),
      deleteRoutine: (id) =>
        set((s) => ({
          routines: s.routines.filter((r) => r.id !== id),
        })),
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
