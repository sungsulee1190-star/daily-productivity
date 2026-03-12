'use client'

import { useState } from 'react'
import { Trash2, Pencil, ChevronDown, ChevronUp, Plus, X } from 'lucide-react'
import { Todo, useTodoStore } from '@/store/todoStore'
import { getDaysOverdue, formatDate } from '@/lib/utils'

interface Props {
  todo: Todo
  onEdit: (todo: Todo) => void
}

const priorityLabel: Record<string, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
}

const priorityColor: Record<string, string> = {
  high: '#EF4444',
  medium: '#F97316',
  low: '#6B7280',
}

export default function TodoItem({ todo, onEdit }: Props) {
  const { completeTodo, uncompleteTodo, deleteTodo, addSubtask, toggleSubtask, deleteSubtask } = useTodoStore()
  const [showMemo, setShowMemo] = useState(false)
  const [showSubtasks, setShowSubtasks] = useState(true)
  const [popping, setPopping] = useState(false)
  const [addingSubtask, setAddingSubtask] = useState(false)
  const [subtaskInput, setSubtaskInput] = useState('')

  const subtasks = todo.subtasks ?? []
  const subtaskDone = subtasks.filter((s) => s.completed).length
  const hasSubtasks = subtasks.length > 0

  const daysOverdue = todo.deadline && !todo.completed ? getDaysOverdue(todo.deadline) : 0

  function handleCheck() {
    setPopping(true)
    setTimeout(() => setPopping(false), 200)
    if (todo.completed) {
      uncompleteTodo(todo.id)
    } else {
      completeTodo(todo.id)
    }
  }

  function handleAddSubtask(e: React.FormEvent) {
    e.preventDefault()
    if (!subtaskInput.trim()) return
    addSubtask(todo.id, subtaskInput.trim())
    setSubtaskInput('')
    setAddingSubtask(false)
    setShowSubtasks(true)
  }

  return (
    <div
      className="group flex flex-col rounded-2xl px-4 py-3 transition-all"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        opacity: todo.completed ? 0.6 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        {/* 체크박스 */}
        <button
          onClick={handleCheck}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${popping ? 'check-pop' : ''}`}
          style={
            todo.completed
              ? { backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }
              : { borderColor: '#D6D3D1' }
          }
        >
          {todo.completed && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-sm font-medium leading-snug"
              style={{
                textDecoration: todo.completed ? 'line-through' : 'none',
                color: todo.completed ? 'var(--text-muted)' : 'var(--text-primary)',
              } as React.CSSProperties}
            >
              {todo.title}
            </span>

            {/* 우선순위 배지 */}
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: priorityColor[todo.priority] + '20',
                color: priorityColor[todo.priority],
              }}
            >
              {priorityLabel[todo.priority]}
            </span>

            {/* 서브태스크 진척 배지 */}
            {hasSubtasks && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: subtaskDone === subtasks.length ? '#DCFCE7' : 'var(--surface-2)',
                  color: subtaskDone === subtasks.length ? '#16A34A' : 'var(--text-muted)',
                }}
              >
                {subtaskDone}/{subtasks.length}
              </span>
            )}

            {/* D+N 경과 배지 */}
            {daysOverdue > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
              >
                D+{daysOverdue}
              </span>
            )}

            {/* 오늘 마감 배지 */}
            {daysOverdue === 0 && todo.deadline && !todo.completed && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}
              >
                오늘 마감
              </span>
            )}
          </div>

          {/* 서브태스크 진행 바 */}
          {hasSubtasks && (
            <div className="mt-2 h-1 rounded-full" style={{ backgroundColor: 'var(--bg)' }}>
              <div
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${(subtaskDone / subtasks.length) * 100}%`,
                  backgroundColor: subtaskDone === subtasks.length ? '#22C55E' : 'var(--accent)',
                }}
              />
            </div>
          )}

          {/* 마감일 */}
          {todo.deadline && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              📅 {formatDate(todo.deadline)}
            </p>
          )}

          {/* 태그 */}
          {todo.tags.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {todo.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 메모 토글 */}
          {todo.memo && (
            <button
              onClick={() => setShowMemo(!showMemo)}
              className="flex items-center gap-1 text-xs mt-1.5"
              style={{ color: 'var(--text-muted)' }}
            >
              {showMemo ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              메모
            </button>
          )}
          {showMemo && todo.memo && (
            <p
              className="text-xs mt-1.5 leading-relaxed whitespace-pre-wrap px-3 py-2 rounded-xl"
              style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}
            >
              {todo.memo}
            </p>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setAddingSubtask(true)}
            className="p-1.5 rounded-lg"
            title="서브태스크 추가"
            style={{ color: 'var(--text-muted)' }}
          >
            <Plus size={14} strokeWidth={1.8} />
          </button>
          <button
            onClick={() => onEdit(todo)}
            className="p-1.5 rounded-lg"
            style={{ color: 'var(--text-muted)' }}
          >
            <Pencil size={14} strokeWidth={1.8} />
          </button>
          <button
            onClick={() => deleteTodo(todo.id)}
            className="p-1.5 rounded-lg"
            style={{ color: '#EF4444' }}
          >
            <Trash2 size={14} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* 서브태스크 영역 */}
      {(hasSubtasks || addingSubtask) && (
        <div className="mt-3 ml-8">
          {/* 서브태스크 헤더 */}
          {hasSubtasks && (
            <button
              onClick={() => setShowSubtasks(!showSubtasks)}
              className="flex items-center gap-1 text-xs mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              {showSubtasks ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              서브태스크 {subtaskDone}/{subtasks.length}
            </button>
          )}

          {showSubtasks && (
            <div className="space-y-1">
              {subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 group/sub">
                  <button
                    onClick={() => toggleSubtask(todo.id, sub.id)}
                    className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all"
                    style={
                      sub.completed
                        ? { backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }
                        : { borderColor: '#D6D3D1', backgroundColor: 'transparent' }
                    }
                  >
                    {sub.completed && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <span
                    className="flex-1 text-xs"
                    style={{
                      color: sub.completed ? 'var(--text-muted)' : 'var(--text-secondary)',
                      textDecoration: sub.completed ? 'line-through' : 'none',
                    }}
                  >
                    {sub.title}
                  </span>
                  <button
                    onClick={() => deleteSubtask(todo.id, sub.id)}
                    className="opacity-0 group-hover/sub:opacity-100 transition-opacity"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 서브태스크 추가 인풋 */}
          {addingSubtask && (
            <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-1">
              <div className="w-4 h-4 rounded border flex-shrink-0" style={{ borderColor: '#D6D3D1' }} />
              <input
                autoFocus
                type="text"
                placeholder="서브태스크 입력..."
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setAddingSubtask(false)}
                className="flex-1 text-xs outline-none bg-transparent"
                style={{ color: 'var(--text-primary)' }}
              />
              <button type="submit" className="text-xs px-2 py-0.5 rounded-lg"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                추가
              </button>
              <button type="button" onClick={() => setAddingSubtask(false)}
                style={{ color: 'var(--text-muted)' }}>
                <X size={12} />
              </button>
            </form>
          )}

          {/* 서브태스크가 있을 때 추가 버튼 */}
          {hasSubtasks && !addingSubtask && (
            <button
              onClick={() => setAddingSubtask(true)}
              className="flex items-center gap-1 text-xs mt-1.5"
              style={{ color: 'var(--text-muted)' }}
            >
              <Plus size={11} />
              서브태스크 추가
            </button>
          )}
        </div>
      )}
    </div>
  )
}
