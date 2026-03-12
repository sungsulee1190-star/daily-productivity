'use client'

import { useTodoStore } from '@/store/todoStore'
import type { Todo } from '@/store/todoStore'
import { format } from 'date-fns'
import { getDaysOverdue } from '@/lib/utils'

type KanbanStatus = 'backlog' | 'inprogress' | 'done' | 'hold'

const columns: { id: KanbanStatus; label: string; emoji: string; color: string }[] = [
  { id: 'backlog', label: '백로그', emoji: '📥', color: '#6B7280' },
  { id: 'inprogress', label: '진행 중', emoji: '⚡', color: '#F97316' },
  { id: 'done', label: '완료', emoji: '✅', color: '#22C55E' },
  { id: 'hold', label: '보류', emoji: '⏸', color: '#8B5CF6' },
]

const priorityColor: Record<string, string> = {
  high: '#EF4444', medium: '#F97316', low: '#6B7280',
}

function KanbanCard({ todo, onMove }: { todo: Todo; onMove: (id: string, status: KanbanStatus) => void }) {
  const daysOverdue = todo.deadline && !todo.completed ? getDaysOverdue(todo.deadline) : 0

  return (
    <div
      className="rounded-2xl px-3 py-3 mb-2 cursor-pointer hover:shadow-md transition-shadow"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <p className="text-sm font-medium leading-snug mb-2" style={{ color: 'var(--text-primary)' }}>
        {todo.title}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className="text-xs px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: priorityColor[todo.priority] + '20', color: priorityColor[todo.priority] }}
        >
          {todo.priority === 'high' ? '높음' : todo.priority === 'medium' ? '보통' : '낮음'}
        </span>
        {todo.deadline && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {format(new Date(todo.deadline), 'M/d')}
          </span>
        )}
        {daysOverdue > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
            style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
            D+{daysOverdue}
          </span>
        )}
      </div>
      {/* 이동 버튼 */}
      <div className="flex gap-1 mt-2 flex-wrap">
        {columns
          .filter((c) => c.id !== todo.kanbanStatus)
          .map((c) => (
            <button
              key={c.id}
              onClick={() => onMove(todo.id, c.id)}
              className="text-xs px-2 py-0.5 rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--bg)', color: 'var(--text-muted)' }}
            >
              → {c.emoji} {c.label}
            </button>
          ))}
      </div>
    </div>
  )
}

export default function BoardPage() {
  const { todos, activeClip, updateTodo } = useTodoStore()

  const clipTodos = todos.filter((t) => t.clip === activeClip)

  function handleMove(id: string, status: KanbanStatus) {
    updateTodo(id, {
      kanbanStatus: status,
      completed: status === 'done',
      completedAt: status === 'done' ? new Date().toISOString() : undefined,
    })
  }

  return (
    <div className="px-6 py-8 overflow-x-auto">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
        칸반 보드
      </h1>
      <div className="flex gap-4 min-w-max">
        {columns.map((col) => {
          const colTodos = clipTodos.filter((t) => t.kanbanStatus === col.id)
          return (
            <div key={col.id} className="w-64">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">{col.emoji}</span>
                <span className="text-sm font-semibold" style={{ color: col.color }}>
                  {col.label}
                </span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full ml-auto"
                  style={{ backgroundColor: col.color + '20', color: col.color }}
                >
                  {colTodos.length}
                </span>
              </div>
              <div
                className="min-h-32 rounded-2xl p-2"
                style={{ backgroundColor: 'var(--surface-2)' }}
              >
                {colTodos.map((todo) => (
                  <KanbanCard key={todo.id} todo={todo} onMove={handleMove} />
                ))}
                {colTodos.length === 0 && (
                  <p className="text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>
                    항목 없음
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
