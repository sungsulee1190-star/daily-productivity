import { create } from 'zustand'
import { createClient } from '@/lib/supabase'

export interface Habit {
  id: string
  name: string
  color: string
  icon: string
}

export interface HabitLog {
  id: string
  habitId: string
  date: string
  done: boolean
}

interface HabitStore {
  habits: Habit[]
  habitLogs: HabitLog[]
  loading: boolean
  fetchHabits: (userId: string) => Promise<void>
  addHabit: (userId: string, habit: Omit<Habit, 'id'>) => Promise<void>
  deleteHabit: (id: string) => Promise<void>
  toggleHabitLog: (userId: string, habitId: string, date: string) => Promise<void>
}

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  habitLogs: [],
  loading: false,

  fetchHabits: async (userId: string) => {
    set({ loading: true })
    const supabase = createClient()

    const [habitsRes, logsRes] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('habit_logs').select('*').eq('user_id', userId),
    ])

    const habits: Habit[] = (habitsRes.data ?? []).map((h) => ({
      id: h.id,
      name: h.name,
      color: h.color,
      icon: h.icon,
    }))

    const habitLogs: HabitLog[] = (logsRes.data ?? []).map((l) => ({
      id: l.id,
      habitId: l.habit_id,
      date: l.date,
      done: l.done,
    }))

    set({ habits, habitLogs, loading: false })
  },

  addHabit: async (userId: string, habit: Omit<Habit, 'id'>) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('habits')
      .insert({ user_id: userId, name: habit.name, color: habit.color, icon: habit.icon })
      .select()
      .single()

    if (error || !data) return

    set((state) => ({
      habits: [
        ...state.habits,
        { id: data.id, name: data.name, color: data.color, icon: data.icon },
      ],
    }))
  },

  deleteHabit: async (id: string) => {
    const supabase = createClient()
    await supabase.from('habits').delete().eq('id', id)
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
      habitLogs: state.habitLogs.filter((l) => l.habitId !== id),
    }))
  },

  toggleHabitLog: async (userId: string, habitId: string, date: string) => {
    const supabase = createClient()
    const existing = get().habitLogs.find((l) => l.habitId === habitId && l.date === date)

    if (existing) {
      const newDone = !existing.done
      await supabase.from('habit_logs').update({ done: newDone }).eq('id', existing.id)
      set((state) => ({
        habitLogs: state.habitLogs.map((l) =>
          l.id === existing.id ? { ...l, done: newDone } : l
        ),
      }))
    } else {
      const { data, error } = await supabase
        .from('habit_logs')
        .insert({ habit_id: habitId, user_id: userId, date, done: true })
        .select()
        .single()

      if (error || !data) return

      set((state) => ({
        habitLogs: [
          ...state.habitLogs,
          { id: data.id, habitId: data.habit_id, date: data.date, done: data.done },
        ],
      }))
    }
  },
}))
