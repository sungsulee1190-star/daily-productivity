'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase'

export interface QuickLink {
  id: string
  title: string
  url: string
  emoji: string
}

interface LinkStore {
  links: QuickLink[]
  userId: string | null
  fetchLinks: (userId: string) => Promise<void>
  addLink: (link: Omit<QuickLink, 'id'>) => void
  updateLink: (id: string, updates: Partial<Omit<QuickLink, 'id'>>) => void
  deleteLink: (id: string) => void
}

async function syncLinkToSupabase(link: QuickLink, userId: string) {
  try {
    const supabase = createClient()
    await supabase.from('links').upsert({
      id: link.id,
      user_id: userId,
      title: link.title,
      url: link.url,
      emoji: link.emoji,
    })
  } catch {
    // non-blocking
  }
}

export const useLinkStore = create<LinkStore>()(
  persist(
    (set, get) => ({
      links: [],
      userId: null,

      fetchLinks: async (userId: string) => {
        set({ userId })
        try {
          const supabase = createClient()
          const { data } = await supabase
            .from('links')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })

          if (data && data.length > 0) {
            set({
              links: data.map((r) => ({
                id: r.id,
                title: r.title,
                url: r.url,
                emoji: r.emoji,
              })),
            })
          } else {
            // Push existing local links to Supabase on first login
            const local = get().links
            for (const link of local) {
              syncLinkToSupabase(link, userId)
            }
          }
        } catch {
          // non-blocking
        }
      },

      addLink: (link) => {
        const newLink = { ...link, id: crypto.randomUUID() }
        set((s) => ({ links: [...s.links, newLink] }))
        const { userId } = get()
        if (userId) syncLinkToSupabase(newLink, userId)
      },

      updateLink: (id, updates) => {
        set((s) => ({
          links: s.links.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        }))
        const { userId, links } = get()
        if (userId) {
          const updated = links.find((l) => l.id === id)
          if (updated) syncLinkToSupabase(updated, userId)
        }
      },

      deleteLink: (id) => {
        set((s) => ({ links: s.links.filter((l) => l.id !== id) }))
        try {
          const supabase = createClient()
          supabase.from('links').delete().eq('id', id)
        } catch {
          // non-blocking
        }
      },
    }),
    {
      name: 'daily-links',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.links = state.links.filter((l) => l.id !== 'default-sheets')
        }
      },
    }
  )
)
