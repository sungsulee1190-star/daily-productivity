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

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const clipTodos = todos.filter((t) => t.clip === activeClip)

  const overdueTodos = clipTodos.filter(
    (t) => !t.completed && t.deadline && t.deadline < todayStr
  )
  // 마감일 없음도 오늘 할 일로 취급
  const todayTodos = clipTodos.filter(
    (t) => !t.completed && (!t.deadline || t.deadline === todayStr)
  )
  const completedToday = clipTodos.filter(
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
