'use client'

import { Menu } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

export default function MobileHeader() {
  const { setMobileSidebarOpen } = useUIStore()

  return (
    <div
      className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className="p-1.5 rounded-lg transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        aria-label="메뉴 열기"
      >
        <Menu size={20} />
      </button>
      <span className="text-base font-bold" style={{ color: 'var(--accent)' }}>✦ 데일리</span>
    </div>
  )
}
