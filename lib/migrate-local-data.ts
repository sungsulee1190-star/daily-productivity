import { createClient } from '@/lib/supabase'

interface LocalTodo {
  id: string
  title: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  deadline?: string
}

interface LocalProject {
  id: string
  title: string
  status: string
  ideaDump?: string
  createdAt: string
  updatedAt: string
}

interface ZustandPersistedState<T> {
  state: T
  version: number
}

function readLocalTodos(): LocalTodo[] {
  try {
    const raw = localStorage.getItem('daily-productivity-todos')
    if (!raw) return []
    const parsed = JSON.parse(raw) as ZustandPersistedState<{ todos: LocalTodo[] }>
    return parsed?.state?.todos ?? []
  } catch {
    return []
  }
}

function readLocalProjects(): LocalProject[] {
  try {
    const raw = localStorage.getItem('daily-productivity-projects')
    if (!raw) return []
    const parsed = JSON.parse(raw) as ZustandPersistedState<{ projects: LocalProject[] }>
    return parsed?.state?.projects ?? []
  } catch {
    return []
  }
}

function toSupabaseProjectStatus(status: string): 'active' | 'paused' | 'done' {
  if (status === 'completed') return 'done'
  if (status === 'paused') return 'paused'
  return 'active'
}

export async function migrateLocalDataToSupabase(
  userId: string
): Promise<{ migrated: boolean; count: number }> {
  // Skip if already migrated
  if (localStorage.getItem('supabase-migration-done') === 'true') {
    return { migrated: false, count: 0 }
  }

  const supabase = createClient()

  // Check if Supabase already has todos for this user
  const { count: existingCount } = await supabase
    .from('todos')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (existingCount && existingCount > 0) {
    // User already has data in Supabase, mark migration done and skip
    localStorage.setItem('supabase-migration-done', 'true')
    return { migrated: false, count: 0 }
  }

  const localTodos = readLocalTodos()
  const localProjects = readLocalProjects()

  let migratedCount = 0

  // Migrate todos
  if (localTodos.length > 0) {
    const todoRows = localTodos.map((t) => ({
      id: t.id,
      user_id: userId,
      title: t.title,
      completed: t.completed,
      priority: t.priority,
      due_date: t.deadline ?? null,
    }))

    const { error } = await supabase.from('todos').insert(todoRows)
    if (!error) {
      migratedCount += localTodos.length
    }
  }

  // Migrate projects
  if (localProjects.length > 0) {
    const projectRows = localProjects.map((p) => ({
      id: p.id,
      user_id: userId,
      name: p.title,
      status: toSupabaseProjectStatus(p.status),
      notes: p.ideaDump ?? null,
      repo_url: null,
      tech_stack: null,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
    }))

    const { error } = await supabase.from('projects').insert(projectRows)
    if (!error) {
      migratedCount += localProjects.length
    }
  }

  localStorage.setItem('supabase-migration-done', 'true')
  return { migrated: migratedCount > 0, count: migratedCount }
}
