'use client'

import { Menu } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

export default function MobileHeader() {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUIStore()

  return (
    <div
      className="sticky top-0 z-30 flex items-center gap-2 border-b px-3 py-1.5 md:hidden"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <button
        onClick={() => setMobileSidebarOpen(true)}
        type="button"
        className="home-focus inline-grid size-11 place-items-center rounded-lg transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        aria-label="메뉴 열기"
        aria-expanded={mobileSidebarOpen}
        aria-controls="app-sidebar"
      >
        <Menu size={20} aria-hidden="true" />
      </button>
      <span className="text-base font-semibold">데일리</span>
    </div>
  )
}
