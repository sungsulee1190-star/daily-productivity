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
  if (!userId) {
    console.warn('[LinkSync] Cannot sync: userId is null', { linkId: link.id })
    return
  }
  try {
    const supabase = createClient()
    console.debug('[LinkSync] Upserting link', { id: link.id, userId, title: link.title })
    const { error } = await supabase.from('links').upsert({
      id: link.id,
      user_id: userId,
      title: link.title,
      url: link.url,
      emoji: link.emoji,
    })
    if (error) {
      console.error('[LinkSync] Upsert failed', {
        linkId: link.id,
        userId,
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      return
    }
    console.debug('[LinkSync] Upsert successful', { id: link.id })
  } catch (error) {
    console.error('[LinkSync] Upsert failed', {
      linkId: link.id,
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
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
          const { data, error } = await supabase
            .from('links')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })

          if (error) {
            console.error('[LinkSync] fetchLinks failed', {
              userId,
              error: error.message,
              details: error.details,
              code: error.code,
            })
          }

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
        } catch (error) {
          console.error('[LinkSync] fetchLinks failed', {
            userId,
            error: error instanceof Error ? error.message : String(error),
          })
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
        void (async () => {
          try {
            const supabase = createClient()
            console.debug('[LinkSync] Deleting link', { id })
            const { error } = await supabase.from('links').delete().eq('id', id)
            if (error) {
              console.error('[LinkSync] Delete failed', {
                linkId: id,
                error: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
              })
              return
            }
            console.debug('[LinkSync] Delete successful', { id })
          } catch (error) {
            console.error('[LinkSync] Delete failed', {
              linkId: id,
              error: error instanceof Error ? error.message : String(error),
            })
          }
        })()
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
