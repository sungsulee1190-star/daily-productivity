'use client'

import { useState } from 'react'
import { Plus, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { useTodoStore } from '@/store/todoStore'
import TodoItem from '@/components/TodoItem'
import TodoForm from '@/components/TodoForm'
import ProgressCards from '@/components/ProgressCards'
import type { Todo } from '@/store/todoStore'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import AuthGate from '@/components/auth/AuthGate'

const DEFAULT_VISIBLE = 8

interface SectionProps {
  title: string
  todos: Todo[]
  onEdit: (t: Todo) => void
  defaultExpanded?: boolean
}

function TodoSection({ title, todos, onEdit, defaultExpanded = true }: SectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [showAll, setShowAll] = useState(false)

  const visible = showAll ? todos : todos.slice(0, DEFAULT_VISIBLE)
  const hiddenCount = todos.length - DEFAULT_VISIBLE

  if (todos.length === 0) return null

  return (
    <section className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full mb-3"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {title}
          </h2>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)' }}
          >
            {todos.length}
          </span>
        </div>
        <span style={{ color: 'var(--text-muted)' }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

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
              className="w-full mt-2 py-2 rounded-xl text-xs font-medium"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px dashed var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              + {hiddenCount}개 더 보기
            </button>
          )}
          {showAll && todos.length > DEFAULT_VISIBLE && (
            <button
              onClick={() => setShowAll(false)}
              className="w-full mt-2 py-2 rounded-xl text-xs font-medium"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px dashed var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              접기
            </button>
          )}
        </>
      )}
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
    (t) => t.completed && t.completedAt?.startsWith(todayStr)
  )

  function openEdit(t: Todo) {
    setEditTodo(t)
    setShowForm(true)
  }

  return (
    <AuthGate>
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            {format(today, 'yyyy년 M월 d일 EEEE', { locale: ko })}
          </p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {activeClip === 'work' ? '🏢 업무 클립' : '🏠 개인 클립'}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              오늘 {todayTodos.length}개 남음
            </span>
            {overdueTodos.length > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
              >
                {overdueTodos.length}개 기한 초과
              </span>
            )}
            {completedToday.length > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}
              >
                오늘 {completedToday.length}개 완료
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium flex-shrink-0"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
        >
          <Plus size={15} />
          추가
        </button>
      </div>

      <ProgressCards />

      <TodoSection title="⚠️ 기한 초과" todos={overdueTodos} onEdit={openEdit} />

      {dueTodayTodos.length === 0 && overdueTodos.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-12 rounded-2xl text-center mb-6"
          style={{ backgroundColor: 'var(--surface)', border: '1.5px dashed var(--border)' }}
        >
          <Calendar size={32} strokeWidth={1.2} style={{ color: 'var(--text-muted)' }} className="mb-3" />
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            오늘 할 일이 없습니다
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            할 일을 추가해보세요
          </p>
        </div>
      ) : (
        <TodoSection title="🗓 오늘 할 일" todos={dueTodayTodos} onEdit={openEdit} />
      )}

      <TodoSection
        title="📅 다가오는 일정"
        todos={upcomingTodos}
        onEdit={openEdit}
        defaultExpanded={upcomingTodos.length <= DEFAULT_VISIBLE}
      />

      <TodoSection
        title="✅ 오늘 완료"
        todos={completedToday}
        onEdit={openEdit}
        defaultExpanded={false}
      />

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
