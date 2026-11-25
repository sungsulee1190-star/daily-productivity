'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { Plus, CalendarDays, ChevronDown } from 'lucide-react'
import { useTodoStore } from '@/store/todoStore'
import { isCompletedOn } from '@/lib/utils'
import TodoItem from '@/components/TodoItem'
import TodoForm from '@/components/TodoForm'
import ProgressCards from '@/components/ProgressCards'
import HomeRoutineWidget from '@/components/home/HomeRoutineWidget'
import HomeTrackerWidget from '@/components/home/HomeTrackerWidget'
import type { Todo } from '@/store/todoStore'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import AuthGate from '@/components/auth/AuthGate'
import MigrationBanner from '@/components/MigrationBanner'

const DEFAULT_VISIBLE = 8

interface SectionProps {
  title: string
  todos: Todo[]
  onEdit: (t: Todo) => void
  defaultExpanded?: boolean
}

function TodoSection({ title, todos, onEdit, defaultExpanded = true }: SectionProps) {
  const sectionId = useId()
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [showAll, setShowAll] = useState(false)

  const visible = showAll ? todos : todos.slice(0, DEFAULT_VISIBLE)
  const hiddenCount = todos.length - DEFAULT_VISIBLE

  if (todos.length === 0) return null

  return (
    <section>
      <h2>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={sectionId}
          onClick={() => setExpanded(value => !value)}
          className="home-focus flex min-h-11 w-full items-center gap-2 rounded-md px-1 text-left text-[15px] font-semibold"
        >
          {title}
          <span className="text-sm font-normal tabular-nums text-[var(--text-secondary)]">{todos.length}개</span>
          <ChevronDown aria-hidden="true" size={16} className={`ml-auto text-[var(--text-secondary)] ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </h2>

      <div id={sectionId} hidden={!expanded}>
        {expanded && (
          <>
            <div className="space-y-2">
              {visible.map((todo) => (
                <TodoItem key={todo.id} todo={todo} onEdit={onEdit} />
              ))}
            </div>
            {hiddenCount > 0 && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="home-focus w-full mt-2 min-h-11 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px dashed var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                + {hiddenCount}개 더 보기
              </button>
            )}
            {showAll && todos.length > DEFAULT_VISIBLE && (
              <button
                onClick={() => setShowAll(false)}
                className="home-focus w-full mt-2 min-h-11 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px dashed var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                접기
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}

export default function HomePage() {
  const { todos, activeClip } = useTodoStore()
  const [showForm, setShowForm] = useState(false)
  const [editTodo, setEditTodo] = useState<Todo | null>(null)

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')

  const clipTodos = todos.filter((t) => t.clip === activeClip)

  // 오늘 할 일: 마감일 없음(오늘로 취급) + 마감일 <= 오늘, 미완료
  const todayTodos = clipTodos.filter((t) => {
    if (t.completed) return false
    if (!t.deadline) return true
    return t.deadline <= todayStr
  })

  const overdueTodos = todayTodos.filter((t) => t.deadline && t.deadline < todayStr)
  const dueTodayTodos = todayTodos.filter((t) => !t.deadline || t.deadline === todayStr)
  const upcomingTodos = clipTodos.filter(
    (t) => !t.completed && t.deadline && t.deadline > todayStr
  )
  const completedToday = clipTodos.filter(
    (t) => t.completed && isCompletedOn(t.completedAt, todayStr)
  )

  function openEdit(t: Todo) {
    setEditTodo(t)
    setShowForm(true)
  }

  return (
    <AuthGate>
      <MigrationBanner />
      <div className="mx-auto max-w-6xl px-4 py-5 md:px-8 md:py-8">
        <header className="mb-4 border-b border-[var(--border)] pb-4 md:mb-5">
          <p className="flex flex-wrap items-center gap-x-2 text-sm text-[var(--text-secondary)]">
            <time dateTime={todayStr}>{format(today, 'yyyy년 M월 d일 EEEE', { locale: ko })}</time>
            <span aria-hidden="true">·</span>
            <span className="font-medium">{activeClip === 'work' ? '업무 클립' : '개인 클립'}</span>
          </p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">오늘 할 일</h1>
              <p className="mt-1 flex flex-wrap gap-x-2 text-sm text-[var(--text-secondary)]" aria-live="polite">
                <span className="font-medium tabular-nums text-[var(--text-primary)]">{todayTodos.length}개 남음</span>
                {overdueTodos.length > 0 && <span className="font-medium text-red-800">{overdueTodos.length}개 기한 초과</span>}
                {completedToday.length > 0 && <span>{completedToday.length}개 완료</span>}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/calendar" className="home-focus inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-medium hover:bg-[var(--surface-2)]">
                <CalendarDays size={16} aria-hidden="true" />
                캘린더
              </Link>
              <button type="button" onClick={() => setShowForm(true)} className="home-focus inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[var(--accent-ink)] px-4 text-sm font-semibold text-white hover:bg-[#7c2d12]">
                <Plus size={16} aria-hidden="true" />
                할 일 추가
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="min-w-0 space-y-4 lg:col-span-7">
            <TodoSection title="기한 초과" todos={overdueTodos} onEdit={openEdit} />

            {dueTodayTodos.length === 0 && overdueTodos.length === 0 ? (
              <div
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-6"
              >
                <p className="text-sm font-semibold">
                  오늘 할 일이 없습니다
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  새 할 일을 추가하거나 다가오는 일정을 확인하세요.
                </p>
              </div>
            ) : (
              <TodoSection title="오늘 마감 · 마감일 미정" todos={dueTodayTodos} onEdit={openEdit} />
            )}

            <TodoSection
              title="다가오는 일정"
              todos={upcomingTodos}
              onEdit={openEdit}
              defaultExpanded={upcomingTodos.length <= DEFAULT_VISIBLE}
            />

            <TodoSection
              title="오늘 완료"
              todos={completedToday}
              onEdit={openEdit}
              defaultExpanded={false}
            />
          </div>

          <div className="min-w-0 space-y-5 lg:col-span-5">
            <ProgressCards />
            <HomeRoutineWidget />
            <HomeTrackerWidget />
          </div>
        </div>

        {showForm && (
          <TodoForm
            onClose={() => {
              setShowForm(false)
              setEditTodo(null)
            }}
            editTodo={editTodo}
          />
        )}
      </div>
    </AuthGate>
  )
}
