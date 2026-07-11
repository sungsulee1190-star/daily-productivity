import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase'
import type { Json } from '@/lib/database.types'

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
  updateSubtask: (todoId: string, subtaskId: string, title: string) => void
  toggleSubtask: (todoId: string, subtaskId: string) => void
  deleteSubtask: (todoId: string, subtaskId: string) => void
}

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
      memo: todo.memo ?? null,
      tags: todo.tags,
      clip: todo.clip,
      completed_at: todo.completedAt ?? null,
      subtasks: todo.subtasks as unknown as Json,
      kanban_status: todo.kanbanStatus,
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

function syncTodoById(id: string, get: () => TodoStore) {
  const { userId, todos } = get()
  if (!userId) return
  const updated = todos.find((t) => t.id === id)
  if (updated) syncToSupabase(updated, userId)
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
            // Supabase is the source of truth; local values fill older rows.
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
                memo: row.memo ?? local?.memo,
                tags: row.tags ?? local?.tags ?? [],
                clip: row.clip ?? local?.clip ?? 'work',
                completedAt: row.completed_at ?? local?.completedAt,
                subtasks: (row.subtasks as Subtask[] | null) ?? local?.subtasks ?? [],
                kanbanStatus: row.kanban_status ?? local?.kanbanStatus ?? (row.completed ? 'done' : 'backlog'),
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

      addSubtask: (todoId, title) => {
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
          }))
          syncTodoById(todoId, get)
      },

      updateSubtask: (todoId, subtaskId, title) => {
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === todoId
              ? {
                  ...t,
                  subtasks: (t.subtasks ?? []).map((s) =>
                    s.id === subtaskId ? { ...s, title } : s
                  ),
                }
              : t
          ),
        }))
        syncTodoById(todoId, get)
      },

      toggleSubtask: (todoId, subtaskId) => {
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
          }))
          syncTodoById(todoId, get)
      },

      deleteSubtask: (todoId, subtaskId) => {
          set((state) => ({
            todos: state.todos.map((t) =>
              t.id === todoId
                ? { ...t, subtasks: (t.subtasks ?? []).filter((s) => s.id !== subtaskId) }
                : t
            ),
          }))
          syncTodoById(todoId, get)
      },
    }),
    {
      name: 'daily-productivity-todos',
    }
  )
)
