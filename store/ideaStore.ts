'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase'

export type CliTool = 'claude' | 'codex' | 'gemini' | 'auto'
export type IdeaStatus = 'inbox' | 'ready' | 'in_progress' | 'done'
export type IdeaPriority = 'low' | 'medium' | 'high'

export interface Idea {
  id: string
  user_id?: string
  title: string
  description: string | null
  cli_tool: CliTool
  status: IdeaStatus
  priority: IdeaPriority
  generated_script: string | null
  created_at: string
  updated_at: string
}

interface IdeaStore {
  ideas: Idea[]
  fetchIdeas: (userId: string) => Promise<void>
  addIdea: (idea: Omit<Idea, 'id' | 'created_at' | 'updated_at'>, userId: string) => Promise<void>
  updateIdea: (id: string, updates: Partial<Idea>) => Promise<void>
  deleteIdea: (id: string) => Promise<void>
}

export const useIdeaStore = create<IdeaStore>()(
  persist(
    (set, get) => ({
      ideas: [],

      fetchIdeas: async (userId: string) => {
        try {
          const supabase = createClient()
          const { data, error } = await supabase
            .from('ideas')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
          if (error) throw error
          if (data) set({ ideas: data as Idea[] })
        } catch (e) {
          console.error('fetchIdeas error:', e)
        }
      },

      addIdea: async (idea, userId) => {
        const now = new Date().toISOString()
        const newIdea: Idea = {
          id: crypto.randomUUID(),
          user_id: userId,
          ...idea,
          created_at: now,
          updated_at: now,
        }
        set((s) => ({ ideas: [newIdea, ...s.ideas] }))
        try {
          const supabase = createClient()
          await supabase.from('ideas').insert({
            id: newIdea.id,
            user_id: userId,
            title: newIdea.title,
            description: newIdea.description,
            cli_tool: newIdea.cli_tool,
            status: newIdea.status,
            priority: newIdea.priority,
            generated_script: newIdea.generated_script,
          })
        } catch (e) {
          console.error('addIdea sync error:', e)
        }
      },

      updateIdea: async (id, updates) => {
        const now = new Date().toISOString()
        set((s) => ({
          ideas: s.ideas.map((i) =>
            i.id === id ? { ...i, ...updates, updated_at: now } : i
          ),
        }))
        try {
          const supabase = createClient()
          await supabase.from('ideas').update({ ...updates, updated_at: now }).eq('id', id)
        } catch (e) {
          console.error('updateIdea sync error:', e)
        }
      },

      deleteIdea: async (id) => {
        set((s) => ({ ideas: s.ideas.filter((i) => i.id !== id) }))
        try {
          const supabase = createClient()
          await supabase.from('ideas').delete().eq('id', id)
        } catch (e) {
          console.error('deleteIdea sync error:', e)
        }
      },
    }),
    { name: 'daily-productivity-ideas' }
  )
)
