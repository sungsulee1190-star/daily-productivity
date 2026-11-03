'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase'
import { markPending, clearPending, mergeWithPending } from '@/lib/sync-pending'

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

// supabase-js reports failures via `{ error }`, not exceptions — check it so
// failed writes stay pending and are retried on the next fetch.
async function syncIdeaToSupabase(idea: Idea, userId: string) {
  markPending('ideas', idea.id)
  const supabase = createClient()
  const { error } = await supabase.from('ideas').upsert({
    id: idea.id,
    user_id: userId,
    title: idea.title,
    description: idea.description,
    cli_tool: idea.cli_tool,
    status: idea.status,
    priority: idea.priority,
    generated_script: idea.generated_script,
    created_at: idea.created_at,
    updated_at: idea.updated_at,
  })
  if (error) {
    console.error('[IdeaSync] Upsert failed', { ideaId: idea.id, error: error.message, code: error.code })
    return
  }
  clearPending('ideas', idea.id)
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
          if (data) {
            const { items, toUpload } = mergeWithPending('ideas', data as Idea[], get().ideas)
            set({ ideas: items })
            toUpload.forEach((i) => syncIdeaToSupabase(i, userId))
          }
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
          await syncIdeaToSupabase(newIdea, userId)
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
        const updated = get().ideas.find((i) => i.id === id)
        try {
          if (updated?.user_id) await syncIdeaToSupabase(updated, updated.user_id)
        } catch (e) {
          console.error('updateIdea sync error:', e)
        }
      },

      deleteIdea: async (id) => {
        set((s) => ({ ideas: s.ideas.filter((i) => i.id !== id) }))
        try {
          const supabase = createClient()
          const { error } = await supabase.from('ideas').delete().eq('id', id)
          if (error) console.error('[IdeaSync] Delete failed', { ideaId: id, error: error.message })
          clearPending('ideas', id)
        } catch (e) {
          console.error('deleteIdea sync error:', e)
        }
      },
    }),
    { name: 'daily-productivity-ideas' }
  )
)
