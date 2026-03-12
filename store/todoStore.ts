import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  setActiveClip: (clip: ClipType) => void
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'completed' | 'kanbanStatus' | 'subtasks'>) => void
  updateTodo: (id: string, updates: Partial<Todo>) => void
  deleteTodo: (id: string) => void
  completeTodo: (id: string) => void
  uncompleteTodo: (id: string) => void
  addSubtask: (todoId: string, title: string) => void
  toggleSubtask: (todoId: string, subtaskId: string) => void
  deleteSubtask: (todoId: string, subtaskId: string) => void
}

export const useTodoStore = create<TodoStore>()(
  persist(
    (set) => ({
      todos: [],
      activeClip: 'work',

      setActiveClip: (clip) => set({ activeClip: clip }),

      addTodo: (todo) =>
        set((state) => ({
          todos: [
            ...state.todos,
            {
              ...todo,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              completed: false,
              kanbanStatus: 'backlog',
              subtasks: [],
            },
          ],
        })),

      updateTodo: (id, updates) =>
        set((state) => ({
          todos: state.todos.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      deleteTodo: (id) =>
        set((state) => ({
          todos: state.todos.filter((t) => t.id !== id),
        })),

      completeTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id
              ? { ...t, completed: true, completedAt: new Date().toISOString(), kanbanStatus: 'done' }
              : t
          ),
        })),

      uncompleteTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id
              ? { ...t, completed: false, completedAt: undefined, kanbanStatus: t.deadline ? 'inprogress' : 'backlog' }
              : t
          ),
        })),

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
