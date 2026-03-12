'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ProjectType = 'dev' | 'personal'
export type ProjectStatus = 'active' | 'paused' | 'completed'

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
  ideaDump: string
  prd: PRD
  createdAt: string
  updatedAt: string
}

interface ProjectStore {
  projects: Project[]
  addProject: (title: string, type: ProjectType) => string
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
      addProject: (title, type) => {
        const id = crypto.randomUUID()
        set((s) => ({
          projects: [
            ...s.projects,
            {
              id, title, type, status: 'active',
              ideaDump: '', prd: emptyPRD(),
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
    { name: 'daily-productivity-projects' }
  )
)
