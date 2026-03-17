import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase'

export type ClipType = 'work' | 'personal'
export type Priority = 'high' | 'medium' | 'low'

export interface Subtask {
  id: string
  title: string
  completed: boolean
  completedAt?: string
}

export interface Todo {
  id: string
  title: string
  memo?: string
  deadline?: string // ISO date string (YYYY-MM-DD) or datetime
  priority: Priority
  tags: string[]
  completed: boolean
  clip: ClipType
  createdAt: string
  completedAt?: string
  // 서브태스크
  subtasks: Subtask[]
  // 칸반 상태
  kanbanStatus: 'backlog' | 'inprogress' | 'done' | 'hold'
}

interface TodoStore {
  todos: Todo[]
  activeClip: ClipType
  loading: boolean
  userId: string | null
  setActiveClip: (clip: ClipType) => void
  setUserId: (userId: string | null) => void
  fetchTodos: (userId: string) => Promise<void>
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'completed' | 'kanbanStatus' | 'subtasks'>) => void
  updateTodo: (id: string, updates: Partial<Todo>) => void
  deleteTodo: (id: string) => void
  completeTodo: (id: string) => void
  uncompleteTodo: (id: string) => void
  addSubtask: (todoId: string, title: string) => void
  toggleSubtask: (todoId: string, subtaskId: string) => void
  deleteSubtask: (todoId: string, subtaskId: string) => void
}

// Sync a todo to Supabase (upsert). Extended fields not in schema are ignored.
async function syncToSupabase(todo: Todo, userId: string) {
  try {
    const supabase = createClient()
    await supabase.from('todos').upsert({
      id: todo.id,
      user_id: userId,
      title: todo.title,
      completed: todo.completed,
      priority: todo.priority,
      due_date: todo.deadline ?? null,
      created_at: todo.createdAt,
      updated_at: new Date().toISOString(),
    })
  } catch {
    // Supabase sync failure is non-blocking; data is persisted locally
  }
}

async function deleteFromSupabase(id: string) {
  try {
    const supabase = createClient()
    await supabase.from('todos').delete().eq('id', id)
  } catch {
    // non-blocking
  }
}

export const useTodoStore = create<TodoStore>()(
  persist(
    (set, get) => ({
      todos: [],
      activeClip: 'work',
      loading: false,
      userId: null,

      setActiveClip: (clip) => set({ activeClip: clip }),

      setUserId: (userId) => set({ userId }),

      fetchTodos: async (userId: string) => {
        set({ loading: true, userId })
        try {
          const supabase = createClient()
          const { data } = await supabase
            .from('todos')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

          if (data && data.length > 0) {
            // Merge: Supabase is source of truth for core fields;
            // local store preserves extended fields (subtasks, tags, memo, etc.)
            const localTodos = get().todos
            const merged = data.map((row) => {
              const local = localTodos.find((t) => t.id === row.id)
              return {
                id: row.id,
                title: row.title,
                completed: row.completed,
                priority: row.priority as Priority,
                deadline: row.due_date ?? undefined,
                createdAt: row.created_at,
                // Preserve extended local fields or fallback to defaults
                memo: local?.memo,
                tags: local?.tags ?? [],
                clip: local?.clip ?? 'work',
                completedAt: local?.completedAt,
                subtasks: local?.subtasks ?? [],
                kanbanStatus: local?.kanbanStatus ?? (row.completed ? 'done' : 'backlog'),
              } as Todo
            })
            set({ todos: merged })
          }
        } catch {
          // fetchTodos failure is non-blocking; local data remains
        } finally {
          set({ loading: false })
        }
      },

      addTodo: (todo) => {
        const newTodo: Todo = {
          ...todo,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          completed: false,
          kanbanStatus: 'backlog',
          subtasks: [],
        }
        set((state) => ({ todos: [newTodo, ...state.todos] }))
        const { userId } = get()
        if (userId) syncToSupabase(newTodo, userId)
      },

      updateTodo: (id, updates) => {
        set((state) => ({
          todos: state.todos.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }))
        const { userId, todos } = get()
        if (userId) {
          const updated = todos.find((t) => t.id === id)
          if (updated) syncToSupabase(updated, userId)
        }
      },

      deleteTodo: (id) => {
        set((state) => ({
          todos: state.todos.filter((t) => t.id !== id),
        }))
        deleteFromSupabase(id)
      },

      completeTodo: (id) => {
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id
              ? { ...t, completed: true, completedAt: new Date().toISOString(), kanbanStatus: 'done' }
              : t
          ),
        }))
        const { userId, todos } = get()
        if (userId) {
          const updated = todos.find((t) => t.id === id)
          if (updated) syncToSupabase(updated, userId)
        }
      },

      uncompleteTodo: (id) => {
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id
              ? { ...t, completed: false, completedAt: undefined, kanbanStatus: t.deadline ? 'inprogress' : 'backlog' }
              : t
          ),
        }))
        const { userId, todos } = get()
        if (userId) {
          const updated = todos.find((t) => t.id === id)
          if (updated) syncToSupabase(updated, userId)
        }
      },

      addSubtask: (todoId, title) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === todoId
              ? {
                  ...t,
                  subtasks: [
                    ...(t.subtasks ?? []),
                    { id: crypto.randomUUID(), title, completed: false },
                  ],
                }
              : t
          ),
        })),

      toggleSubtask: (todoId, subtaskId) =>
        set((state) => ({
          todos: state.todos.map((t) => {
            if (t.id !== todoId) return t
            const subtasks = (t.subtasks ?? []).map((s) =>
              s.id === subtaskId
                ? { ...s, completed: !s.completed, completedAt: !s.completed ? new Date().toISOString() : undefined }
                : s
            )
            // 모든 서브태스크가 완료되면 부모도 완료
            const allDone = subtasks.length > 0 && subtasks.every((s) => s.completed)
            return {
              ...t,
              subtasks,
              completed: allDone ? true : t.completed,
              completedAt: allDone && !t.completed ? new Date().toISOString() : t.completedAt,
              kanbanStatus: allDone ? 'done' : t.kanbanStatus,
            }
          }),
        })),

      deleteSubtask: (todoId, subtaskId) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === todoId
              ? { ...t, subtasks: (t.subtasks ?? []).filter((s) => s.id !== subtaskId) }
              : t
          ),
        })),
    }),
    {
      name: 'daily-productivity-todos',
    }
  )
)
