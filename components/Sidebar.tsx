'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import {
  Home, RotateCcw, Kanban, Archive,
  Lightbulb, Settings, FolderKanban, Newspaper,
  Network, ChevronLeft, ChevronRight, X,
  List, Sun, Bot, PlusCircle,
  Clock, PlayCircle, CheckCircle2,
  CalendarDays, Link2, Plus, Trash2, ClipboardList,
} from 'lucide-react'
import { useTodoStore } from '@/store/todoStore'
import { useUIStore } from '@/store/uiStore'
import { useLinkStore } from '@/store/linkStore'

const workNavItems = [
  { href: '/', label: '홈', icon: Home },
  { href: '/todo/daily', label: '오늘 할 일', icon: Sun },
  { href: '/todo/all', label: '전체 목록', icon: List },
  { href: '/routine', label: '루틴', icon: RotateCcw },
  { href: '/tracker', label: 'F/U 트래커', icon: ClipboardList },
  { href: '/links', label: '링크', icon: Link2 },
  { href: '/board', label: '칸반 보드', icon: Kanban },
  { href: '/calendar', label: '캘린더', icon: CalendarDays },
  { href: '/archive', label: '완료 아카이브', icon: Archive },
]

const personalNavItems = [
  { href: '/', label: '홈', icon: Home },
  { href: '/projects', label: '프로젝트', icon: FolderKanban },
  { href: '/ideas', label: '아이디어', icon: Bot },
  { href: '/brainstorm', label: '브레인스토밍', icon: Lightbulb },
  { href: '/mindmap', label: '마인드맵', icon: Network },
  { href: '/routine', label: '루틴', icon: RotateCcw },
  { href: '/tracker', label: 'F/U 트래커', icon: ClipboardList },
  { href: '/links', label: '링크', icon: Link2 },
  { href: '/news', label: '뉴스 & 링크', icon: Newspaper },
]

const projectSubNav = [
  { href: '/projects', label: '프로젝트 홈', icon: FolderKanban, tab: '' },
  { href: '/projects?tab=new', label: '새 프로젝트', icon: PlusCircle, tab: 'new' },
  { href: '/projects?tab=pending', label: '승인 대기', icon: Clock, tab: 'pending' },
  { href: '/projects?tab=active', label: '진행 중', icon: PlayCircle, tab: 'active' },
  { href: '/projects?tab=completed', label: '완료', icon: CheckCircle2, tab: 'completed' },
  { href: '/projects?tab=logs', label: '에이전트 로그', icon: Bot, tab: 'logs' },
]

interface NavLinkProps {
  href: string
  label: string
  icon: React.ElementType
  isActive: boolean
  collapsed: boolean
  activeStyle: React.CSSProperties
  defaultStyle: React.CSSProperties
  onClick?: () => void
  indent?: boolean
}

function NavItem({ href, label, icon: Icon, isActive, collapsed, activeStyle, defaultStyle, onClick, indent }: NavLinkProps) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      onClick={onClick}
      className={[
        'flex items-center gap-2.5 rounded-xl text-sm font-medium transition-all',
        collapsed ? 'justify-center px-2 py-2.5' : `px-3 py-2`,
        indent && !collapsed ? 'text-xs' : '',
      ].join(' ')}
      style={isActive ? activeStyle : defaultStyle}
    >
      <Icon size={indent ? 13 : 15} strokeWidth={1.8} className="flex-shrink-0" />
      {!collapsed && label}
    </Link>
  )
}

const EMOJI_OPTIONS = ['🔗', '📊', '📄', '📁', '🌐', '📧', '📅', '💬', '🎯', '⚙️', '📝', '🔧']

interface AddLinkFormProps {
  onAdd: (link: { title: string; url: string; emoji: string }) => void
  onCancel: () => void
}

function AddLinkForm({ onAdd, onCancel }: AddLinkFormProps) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [emoji, setEmoji] = useState('🔗')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return
    const finalUrl = url.startsWith('http') ? url : `https://${url}`
    onAdd({ title: title.trim(), url: finalUrl, emoji })
  }

  return (
    <form onSubmit={handleSubmit} className="mx-2 mt-1 mb-1 rounded-xl p-2.5 space-y-2" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
      {/* Emoji picker */}
      <div className="flex flex-wrap gap-1">
        {EMOJI_OPTIONS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setEmoji(e)}
            className="text-sm p-1 rounded-lg transition-all"
            style={emoji === e ? { backgroundColor: 'var(--accent-light)' } : {}}
          >{e}</button>
        ))}
      </div>
      <input
        ref={titleRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="이름"
        className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="URL (예: sheets.google.com)"
        className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      />
      <div className="flex gap-1.5">
        <button
          type="submit"
          className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
        >추가</button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
        >취소</button>
      </div>
    </form>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const { activeClip, setActiveClip } = useTodoStore()
  const { sidebarCollapsed, mobileSidebarOpen, toggleSidebar, setMobileSidebarOpen } = useUIStore()
  const { links, addLink, deleteLink } = useLinkStore()
  const [addingLink, setAddingLink] = useState(false)
  const [hoveredLinkId, setHoveredLinkId] = useState<string | null>(null)

  const isOnProjects = pathname.startsWith('/projects')
  const navItems = activeClip === 'work' ? workNavItems : personalNavItems
  const collapsed = sidebarCollapsed

  const accentStyle: React.CSSProperties = { backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }
  const defaultStyle: React.CSSProperties = { color: 'var(--text-secondary)' }
  const closeDrawer = () => setMobileSidebarOpen(false)

  return (
    <>
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={closeDrawer}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{ backgroundColor: 'var(--surface)', borderRight: '1px solid var(--border)' }}
        className={[
          'fixed inset-y-0 left-0 z-50 flex flex-col flex-shrink-0',
          'md:sticky md:top-0 md:z-auto md:h-screen',
          'w-64',
          collapsed ? 'md:w-14' : 'md:w-56',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          'transition-all duration-200',
        ].join(' ')}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)', padding: collapsed ? '16px 8px' : '16px 16px' }}
        >
          {collapsed ? (
            <span className="text-lg font-bold mx-auto" style={{ color: 'var(--accent)' }}>✦</span>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-bold leading-none" style={{ color: 'var(--accent)' }}>✦ 데일리</h1>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>일상 생산성 앱</p>
              </div>
              <button
                onClick={closeDrawer}
                className="md:hidden p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>

        {/* Clip switcher */}
        <div
          className="border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)', padding: collapsed ? '8px 6px' : '10px 12px' }}
        >
          {collapsed ? (
            <div className="flex flex-col gap-1">
              <button
                title="업무"
                onClick={() => setActiveClip('work')}
                className="flex items-center justify-center p-2 rounded-lg transition-all text-sm"
                style={activeClip === 'work'
                  ? { backgroundColor: 'var(--accent)', color: 'white' }
                  : { color: 'var(--text-secondary)' }}
              >🏢</button>
              <button
                title="개인"
                onClick={() => setActiveClip('personal')}
                className="flex items-center justify-center p-2 rounded-lg transition-all text-sm"
                style={activeClip === 'personal'
                  ? { backgroundColor: 'var(--accent)', color: 'white' }
                  : { color: 'var(--text-secondary)' }}
              >🏠</button>
            </div>
          ) : (
            <div className="flex rounded-xl p-1 gap-1" style={{ backgroundColor: 'var(--bg)' }}>
              <button
                onClick={() => setActiveClip('work')}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={activeClip === 'work'
                  ? { backgroundColor: 'var(--accent)', color: 'white' }
                  : { color: 'var(--text-secondary)' }}
              >
                🏢 업무
              </button>
              <button
                onClick={() => setActiveClip('personal')}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={activeClip === 'personal'
                  ? { backgroundColor: 'var(--accent)', color: 'white' }
                  : { color: 'var(--text-secondary)' }}
              >
                🏠 개인
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
          {/* Section label */}
          {!collapsed && (
            <p className="px-3 pt-1 pb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {activeClip === 'work' ? '업무' : '개인'}
            </p>
          )}

          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href.split('?')[0])
            const showActive = isActive && !(href === '/projects' && isOnProjects && !collapsed)
            return (
              <NavItem
                key={href + label}
                href={href}
                label={label}
                icon={Icon}
                isActive={showActive}
                collapsed={collapsed}
                activeStyle={accentStyle}
                defaultStyle={defaultStyle}
                onClick={closeDrawer}
              />
            )
          })}

          {/* Project sub-nav */}
          {isOnProjects && !collapsed && (
            <div
              className="ml-3 mt-0.5 space-y-0.5 border-l-2 pl-2.5 pb-1"
              style={{ borderColor: 'var(--border)' }}
            >
              {projectSubNav.map(({ href, label, icon: Icon }) => {
                const isActive = typeof window !== 'undefined'
                  ? window.location.pathname + window.location.search === href ||
                    (href === '/projects' && window.location.search === '' && pathname === '/projects')
                  : false
                return (
                  <NavItem
                    key={label}
                    href={href}
                    label={label}
                    icon={Icon}
                    isActive={isActive}
                    collapsed={false}
                    activeStyle={accentStyle}
                    defaultStyle={defaultStyle}
                    onClick={closeDrawer}
                    indent
                  />
                )
              })}
            </div>
          )}

          {/* Quick Links — work clip only */}
          {activeClip === 'work' && (
            <div className="pt-2">
              <div className="h-px mb-2" style={{ backgroundColor: 'var(--border)' }} />

              {/* Section header */}
              {collapsed ? (
                <button
                  title="링크 추가"
                  onClick={() => { toggleSidebar(); setTimeout(() => setAddingLink(true), 250) }}
                  className="w-full flex items-center justify-center p-2 rounded-xl transition-all"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Link2 size={14} />
                </button>
              ) : (
                <div className="flex items-center justify-between px-3 pb-1">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    빠른 링크
                  </p>
                  <button
                    onClick={() => setAddingLink((v) => !v)}
                    title="링크 추가"
                    className="p-1 rounded-lg transition-all"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Plus size={13} />
                  </button>
                </div>
              )}

              {/* Link items */}
              {links.map((link) => (
                <div
                  key={link.id}
                  className="relative group"
                  onMouseEnter={() => setHoveredLinkId(link.id)}
                  onMouseLeave={() => setHoveredLinkId(null)}
                >
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={collapsed ? link.title : undefined}
                    className={[
                      'flex items-center gap-2.5 rounded-xl text-sm transition-all w-full',
                      collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2',
                    ].join(' ')}
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span className="flex-shrink-0 text-sm">{link.emoji}</span>
                    {!collapsed && (
                      <span className="truncate flex-1 text-sm">{link.title}</span>
                    )}
                  </a>
                  {/* Delete button (hover, expanded only) */}
                  {!collapsed && hoveredLinkId === link.id && (
                    <button
                      onClick={() => deleteLink(link.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--text-muted)' }}
                      title="삭제"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))}

              {/* Add link form */}
              {addingLink && !collapsed && (
                <AddLinkForm
                  onAdd={(link) => { addLink(link); setAddingLink(false) }}
                  onCancel={() => setAddingLink(false)}
                />
              )}
            </div>
          )}

          {/* Settings */}
          <div className="pt-2">
            {activeClip !== 'work' && <div className="h-px mb-2" style={{ backgroundColor: 'var(--border)' }} />}
            <NavItem
              href="/settings"
              label="설정"
              icon={Settings}
              isActive={pathname === '/settings'}
              collapsed={collapsed}
              activeStyle={accentStyle}
              defaultStyle={defaultStyle}
              onClick={closeDrawer}
            />
          </div>
        </nav>

        {/* Desktop collapse toggle */}
        <div className="hidden md:flex px-2 pb-3 flex-shrink-0">
          <button
            onClick={toggleSidebar}
            title={collapsed ? '사이드바 열기' : '사이드바 접기'}
            className="w-full flex items-center justify-center p-2 rounded-xl transition-all"
            style={{ color: 'var(--text-muted)' }}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>
      </aside>
    </>
  )
}
