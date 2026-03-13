'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface QuickLink {
  id: string
  title: string
  url: string
  emoji: string
}

interface LinkStore {
  links: QuickLink[]
  addLink: (link: Omit<QuickLink, 'id'>) => void
  updateLink: (id: string, updates: Partial<Omit<QuickLink, 'id'>>) => void
  deleteLink: (id: string) => void
}

const defaultLinks: QuickLink[] = [
  { id: 'default-sheets', title: '구글 시트', url: 'https://sheets.google.com', emoji: '📊' },
]

export const useLinkStore = create<LinkStore>()(
  persist(
    (set) => ({
      links: defaultLinks,
      addLink: (link) =>
        set((s) => ({
          links: [...s.links, { ...link, id: crypto.randomUUID() }],
        })),
      updateLink: (id, updates) =>
        set((s) => ({
          links: s.links.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        })),
      deleteLink: (id) =>
        set((s) => ({
          links: s.links.filter((l) => l.id !== id),
        })),
    }),
    { name: 'daily-links' }
  )
)
