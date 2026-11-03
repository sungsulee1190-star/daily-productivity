import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase'
import type { Json } from '@/lib/database.types'
import { markPending, clearPending, mergeWithPending } from '@/lib/sync-pending'

export type ClipType = 'work' | 'personal'
export type Priority = 'high' | 'medium' | 'low'

export interface Subtask {
  id: string
  title: string
  completed: boolean
  startDate?: string
  dueDate?: string
  completedAt?: string
}

export interface Todo {
  id: string
  title: string
  memo?: string
  startDate?: string // ISO date string (YYYY-MM-DD)
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
  addSubtask: (todoId: string, title: string, startDate?: string, dueDate?: string) => void
  updateSubtask: (todoId: string, subtaskId: string, updates: Partial<Subtask> | string) => void
  toggleSubtask: (todoId: string, subtaskId: string) => void
  deleteSubtask: (todoId: string, subtaskId: string) => void
}

async function syncToSupabase(todo: Todo, userId: string) {
  markPending('todos', todo.id)
  if (!userId) {
    console.warn('[TodoSync] Cannot sync: userId is null', { todoId: todo.id })
    return
  }
  try {
    const supabase = createClient()
    console.debug('[TodoSync] Upserting todo', { id: todo.id, userId, title: todo.title })
    const { error } = await supabase.from('todos').upsert({
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
    if (error) {
      console.error('[TodoSync] Upsert failed', {
        todoId: todo.id,
        userId,
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return
    }
    clearPending('todos', todo.id)
    console.debug('[TodoSync] Upsert successful', { id: todo.id })
  } catch (error) {
    console.error('[TodoSync] Upsert failed', {
      todoId: todo.id,
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}

async function deleteFromSupabase(id: string) {
  try {
    const supabase = createClient()
    console.debug('[TodoSync] Deleting todo', { id })
    const { error } = await supabase.from('todos').delete().eq('id', id)
    if (error) {
      console.error('[TodoSync] Delete failed', {
        todoId: id,
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return
    }
    console.debug('[TodoSync] Delete successful', { id })
  } catch (error) {
    console.error('[TodoSync] Delete failed', {
      todoId: id,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

function syncTodoById(id: string, get: () => TodoStore) {
  const { userId, todos } = get()
  if (!userId) {
    console.warn('[TodoSync] Cannot sync: userId is null', { todoId: id })
    return
  }
  const updated = todos.find((t) => t.id === id)
  if (updated) {
    console.debug('[TodoSync] Queuing sync for todo', { id })
    syncToSupabase(updated, userId)
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
          const { data, error } = await supabase
            .from('todos')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

          if (error) {
            console.error('[TodoSync] fetchTodos failed', {
              userId,
              error: error.message,
              details: error.details,
              code: error.code,
            })
          }

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
                startDate: local?.startDate,
                memo: row.memo ?? local?.memo,
                tags: row.tags ?? local?.tags ?? [],
                clip: row.clip ?? local?.clip ?? 'work',
                completedAt: row.completed_at ?? local?.completedAt,
                subtasks: (row.subtasks as Subtask[] | null) ?? local?.subtasks ?? [],
                kanbanStatus: row.kanban_status ?? local?.kanbanStatus ?? (row.completed ? 'done' : 'backlog'),
              } as Todo
            })
            // Keep local todos whose upload never reached the server and retry them.
            const { items, toUpload } = mergeWithPending('todos', merged, localTodos)
            set({ todos: items })
            toUpload.forEach((t) => syncToSupabase(t, userId))
          } else if (data && data.length === 0) {
            // First login for an existing local-only user: push local todos up.
            const local = get().todos
            for (const todo of local) {
              syncToSupabase(todo, userId)
            }
          }
        } catch (error) {
          console.error('[TodoSync] fetchTodos failed', {
            userId,
            error: error instanceof Error ? error.message : String(error),
          })
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
        console.debug('[TodoSync] Todo created locally', { id: newTodo.id, userId })
        if (userId) {
          syncToSupabase(newTodo, userId)
        } else {
          console.warn('[TodoSync] Cannot sync new todo: userId not set', { id: newTodo.id })
        }
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

      addSubtask: (todoId, title, startDate, dueDate) => {
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === todoId
              ? {
                  ...t,
                  subtasks: [
                    ...(t.subtasks ?? []),
                    {
                      id: crypto.randomUUID(),
                      title,
                      completed: false,
                      startDate: startDate || undefined,
                      dueDate: dueDate || undefined,
                    },
                  ],
                }
              : t
          ),
        }))
        syncTodoById(todoId, get)
      },

      updateSubtask: (todoId, subtaskId, updates) => {
        const updateObj = typeof updates === 'string' ? { title: updates } : updates
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === todoId
              ? {
                  ...t,
                  subtasks: (t.subtasks ?? []).map((s) =>
                    s.id === subtaskId ? { ...s, ...updateObj } : s
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
      partialize: (s) => ({ todos: s.todos, activeClip: s.activeClip }),
    }
  )
)
