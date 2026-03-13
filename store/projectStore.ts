'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      projects: [],
      addProject: (title, type, idea = '') => {
        const id = crypto.randomUUID()
        set((s) => ({
          projects: [
            ...s.projects,
            {
              id,
              title,
              type,
              status: 'active',
              workflowStatus: 'draft',
              ideaDump: idea,
              prd: emptyPRD(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }))
        return id
      },
      updateProject: (id, updates) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        })),
      updatePRD: (id, prd) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...p, prd: { ...p.prd, ...prd }, updatedAt: new Date().toISOString() }
              : p
          ),
        })),
      deleteProject: (id) =>
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
    }),
    {
      name: 'daily-productivity-projects',
      // migrate existing projects without workflowStatus
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.projects = state.projects.map((p) => ({
            workflowStatus: p.status === 'completed' ? 'completed' : 'in_progress',
            ...p,
          }))
        }
      },
    }
  )
)
