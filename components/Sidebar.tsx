'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CheckSquare, RotateCcw, Kanban, Archive, Lightbulb, Settings } from 'lucide-react'
import { useTodoStore } from '@/store/todoStore'

const workNav = [
  { href: '/', label: '홈', icon: Home },
  { href: '/todo/daily', label: '오늘 할 일', icon: CheckSquare },
  { href: '/todo/all', label: '전체 목록', icon: CheckSquare },
  { href: '/routine', label: '루틴', icon: RotateCcw },
  { href: '/board', label: '칸반 보드', icon: Kanban },
  { href: '/archive', label: '완료 아카이브', icon: Archive },
]

const personalNav = [
  { href: '/', label: '홈', icon: Home },
  { href: '/todo/daily', label: '오늘 할 일', icon: CheckSquare },
  { href: '/todo/all', label: '전체 목록', icon: CheckSquare },
  { href: '/routine', label: '루틴', icon: RotateCcw },
  { href: '/board', label: '칸반 보드', icon: Kanban },
  { href: '/archive', label: '완료 아카이브', icon: Archive },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { activeClip, setActiveClip } = useTodoStore()

  const navItems = activeClip === 'work' ? workNav : personalNav

  return (
    <aside
      style={{ backgroundColor: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      className="w-56 flex-shrink-0 flex flex-col h-screen sticky top-0"
    >
      {/* 앱 로고 */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <h1 className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
          ✦ 데일리
        </h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          일상 생산성 앱
        </p>
      </div>

      {/* 클립 전환 */}
      <div className="px-3 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ backgroundColor: 'var(--bg)' }}
        >
          <button
            onClick={() => setActiveClip('work')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
            style={
              activeClip === 'work'
                ? { backgroundColor: 'var(--accent)', color: 'white' }
                : { color: 'var(--text-secondary)' }
            }
          >
            🏢 업무
          </button>
          <button
            onClick={() => setActiveClip('personal')}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
            style={
              activeClip === 'personal'
                ? { backgroundColor: 'var(--accent)', color: 'white' }
                : { color: 'var(--text-secondary)' }
            }
          >
            🏠 개인
          </button>
        </div>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href + label}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={
                isActive
                  ? { backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              <Icon size={16} strokeWidth={1.8} />
              {label}
            </Link>
          )
        })}

        <div className="pt-2">
          <div className="h-px mb-2" style={{ backgroundColor: 'var(--border)' }} />
          <Link
            href="/brainstorm"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={
              pathname === '/brainstorm'
                ? { backgroundColor: '#FEF3C7', color: '#D97706' }
                : { color: 'var(--text-secondary)' }
            }
          >
            <Lightbulb size={16} strokeWidth={1.8} />
            브레인스토밍
          </Link>
        </div>
      </nav>

      {/* 설정 */}
      <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Settings size={16} strokeWidth={1.8} />
          설정
        </Link>
      </div>
    </aside>
  )
}
