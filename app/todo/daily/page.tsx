'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTodoStore } from '@/store/todoStore'
import TodoItem from '@/components/TodoItem'
import TodoForm from '@/components/TodoForm'
import type { Todo } from '@/store/todoStore'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function DailyPage() {
  const { todos, activeClip } = useTodoStore()
  const [showForm, setShowForm] = useState(false)
  const [editTodo, setEditTodo] = useState<Todo | null>(null)
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const clipTodos = todos.filter((t) => t.clip === activeClip)
  const availableTags = Array.from(
    new Set(clipTodos.flatMap((todo) => todo.tags ?? []))
  ).sort((a, b) => a.localeCompare(b))
  const visibleTodos = tagFilter
    ? clipTodos.filter((todo) => todo.tags.some((tag) => tag === tagFilter))
    : clipTodos

  const overdueTodos = visibleTodos.filter(
    (t) => !t.completed && t.deadline && t.deadline < todayStr
  )
  // 마감일 없음도 오늘 할 일로 취급
  const todayTodos = visibleTodos.filter(
    (t) => !t.completed && (!t.deadline || t.deadline === todayStr)
  )
  const completedToday = visibleTodos.filter(
    (t) =>
      t.completed &&
      t.completedAt &&
      t.completedAt.startsWith(todayStr)
  )

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            🗓 오늘 할 일
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {format(new Date(), 'M월 d일 EEEE', { locale: ko })}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
        >
          <Plus size={15} />
          추가
        </button>
      </div>

      {/* 기한 초과 */}
      {availableTags.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          <button
            onClick={() => setTagFilter(null)}
            className="text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap"
            style={
              tagFilter === null
                ? { backgroundColor: 'var(--accent)', color: 'white' }
                : { backgroundColor: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
            }
          >
            전체
          </button>
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className="text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap"
              style={
                tagFilter === tag
                  ? { backgroundColor: 'var(--accent)', color: 'white' }
                  : { backgroundColor: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
              }
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {overdueTodos.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-2"
            style={{ color: '#DC2626' }}>
            ⚠ 기한 초과 ({overdueTodos.length})
          </h2>
          <div className="space-y-2">
            {overdueTodos.map((todo) => (
              <TodoItem key={todo.id} todo={todo}
                onEdit={(t) => { setEditTodo(t); setShowForm(true) }} />
            ))}
          </div>
        </section>
      )}

      {/* 오늘 마감 */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide mb-2"
          style={{ color: 'var(--text-muted)' }}>
          오늘 마감 ({todayTodos.length})
        </h2>
        {todayTodos.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
            오늘 마감 항목이 없습니다
          </p>
        ) : (
          <div className="space-y-2">
            {todayTodos.map((todo) => (
              <TodoItem key={todo.id} todo={todo}
                onEdit={(t) => { setEditTodo(t); setShowForm(true) }} />
            ))}
          </div>
        )}
      </section>

      {/* 오늘 완료 */}
      {completedToday.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-2"
            style={{ color: 'var(--text-muted)' }}>
            ✅ 오늘 완료 ({completedToday.length})
          </h2>
          <div className="space-y-2">
            {completedToday.map((todo) => (
              <TodoItem key={todo.id} todo={todo}
                onEdit={(t) => { setEditTodo(t); setShowForm(true) }} />
            ))}
          </div>
        </section>
      )}

      {showForm && (
        <TodoForm
          onClose={() => { setShowForm(false); setEditTodo(null) }}
          editTodo={editTodo}
        />
      )}
    </div>
  )
}
