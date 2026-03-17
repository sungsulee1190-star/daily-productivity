'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase'

export type ProjectType = 'dev' | 'personal'
export type ProjectStatus = 'active' | 'paused' | 'completed'
export type WorkflowStatus = 'draft' | 'pending_review' | 'in_progress' | 'completed' | 'paused'

export interface PRD {
  background: string
  goal: string
  target: string
  features: string
  metrics: string
  timeline: string
}

export interface Project {
  id: string
  title: string
  type: ProjectType
  status: ProjectStatus
  workflowStatus: WorkflowStatus
  ideaDump: string
  prd: PRD
  createdAt: string
  updatedAt: string
}

interface ProjectStore {
  projects: Project[]
  loading: boolean
  userId: string | null
  setUserId: (userId: string | null) => void
  fetchProjects: (userId: string) => Promise<void>
  addProject: (title: string, type: ProjectType, idea?: string) => string
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'prd'>>) => void
  updatePRD: (id: string, prd: Partial<PRD>) => void
  deleteProject: (id: string) => void
}

const emptyPRD = (): PRD => ({
  background: '',
  goal: '',
  target: '',
  features: '',
  metrics: '',
  timeline: '',
})

// Map ProjectStatus to Supabase status field (schema uses 'done' not 'completed')
function toSupabaseStatus(status: ProjectStatus): 'active' | 'paused' | 'done' {
  if (status === 'completed') return 'done'
  return status
}

async function syncProjectToSupabase(project: Project, userId: string) {
  try {
    const supabase = createClient()
    await supabase.from('projects').upsert({
      id: project.id,
      user_id: userId,
      name: project.title,
      status: toSupabaseStatus(project.status),
      repo_url: null,
      notes: project.ideaDump || null,
      tech_stack: null,
      created_at: project.createdAt,
      updated_at: project.updatedAt,
    })
  } catch {
    // non-blocking
  }
}

async function deleteProjectFromSupabase(id: string) {
  try {
    const supabase = createClient()
    await supabase.from('projects').delete().eq('id', id)
  } catch {
    // non-blocking
  }
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      loading: false,
      userId: null,

      setUserId: (userId) => set({ userId }),

      fetchProjects: async (userId: string) => {
        set({ loading: true, userId })
        try {
          const supabase = createClient()
          const { data } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

          if (data && data.length > 0) {
            const localProjects = get().projects
            const merged = data.map((row) => {
              const local = localProjects.find((p) => p.id === row.id)
              const status: ProjectStatus =
                row.status === 'done' ? 'completed' : (row.status as ProjectStatus)
              return {
                id: row.id,
                title: row.name,
                type: local?.type ?? 'dev',
                status,
                workflowStatus: local?.workflowStatus ?? (status === 'completed' ? 'completed' : 'in_progress'),
                ideaDump: row.notes ?? local?.ideaDump ?? '',
                prd: local?.prd ?? emptyPRD(),
                createdAt: row.created_at,
                updatedAt: row.updated_at,
              } as Project
            })
            set({ projects: merged })
          }
        } catch {
          // non-blocking
        } finally {
          set({ loading: false })
        }
      },

      addProject: (title, type, idea = '') => {
        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        const newProject: Project = {
          id,
          title,
          type,
          status: 'active',
          workflowStatus: 'draft',
          ideaDump: idea,
          prd: emptyPRD(),
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ projects: [...s.projects, newProject] }))
        const { userId } = get()
        if (userId) syncProjectToSupabase(newProject, userId)
        return id
      },

      updateProject: (id, updates) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        }))
        const { userId, projects } = get()
        if (userId) {
          const updated = projects.find((p) => p.id === id)
          if (updated) syncProjectToSupabase(updated, userId)
        }
      },

      updatePRD: (id, prd) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...p, prd: { ...p.prd, ...prd }, updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      deleteProject: (id) => {
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }))
        deleteProjectFromSupabase(id)
      },
    }),
    {
      name: 'daily-productivity-projects',
      // migrate existing projects without workflowStatus
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.projects = state.projects.map((p) => ({
            ...p,
            workflowStatus: p.workflowStatus ?? (p.status === 'completed' ? 'completed' : 'in_progress'),
          }))
        }
      },
    }
  )
)
