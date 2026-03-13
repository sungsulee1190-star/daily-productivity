'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIStore {
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  calendarEmbedUrl: string
  toggleSidebar: () => void
  setMobileSidebarOpen: (open: boolean) => void
  setCalendarEmbedUrl: (url: string) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      calendarEmbedUrl: '',
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      setCalendarEmbedUrl: (url) => set({ calendarEmbedUrl: url }),
    }),
    {
      name: 'daily-ui',
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, calendarEmbedUrl: s.calendarEmbedUrl }),
    }
  )
)
