'use client'

import { useState } from 'react'
import { Trash2, Pencil, ChevronDown, ChevronUp, Plus, X, Calendar } from 'lucide-react'
import { Todo, Subtask, useTodoStore } from '@/store/todoStore'
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
  const { completeTodo, uncompleteTodo, deleteTodo, addSubtask, updateSubtask, toggleSubtask, deleteSubtask } = useTodoStore()
  const [showMemo, setShowMemo] = useState(false)
  const [showSubtasks, setShowSubtasks] = useState(true)
  const [popping, setPopping] = useState(false)
  
  // 서브태스크 추가 상태
  const [addingSubtask, setAddingSubtask] = useState(false)
  const [subtaskInput, setSubtaskInput] = useState('')
  const [subtaskStartDate, setSubtaskStartDate] = useState('')
  const [subtaskDueDate, setSubtaskDueDate] = useState('')
  const [showSubtaskDates, setShowSubtaskDates] = useState(false)

  // 서브태스크 수정 상태
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editDueDate, setEditDueDate] = useState('')

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
    addSubtask(todo.id, subtaskInput.trim(), subtaskStartDate || undefined, subtaskDueDate || undefined)
    setSubtaskInput('')
    setSubtaskStartDate('')
    setSubtaskDueDate('')
    setShowSubtaskDates(false)
    setAddingSubtask(false)
    setShowSubtasks(true)
  }

  function startEditSubtask(sub: Subtask) {
    setEditingSubtaskId(sub.id)
    setEditTitle(sub.title)
    setEditStartDate(sub.startDate ?? '')
    setEditDueDate(sub.dueDate ?? '')
  }

  function handleSaveEditSubtask(subtaskId: string) {
    if (!editTitle.trim()) return
    updateSubtask(todo.id, subtaskId, {
      title: editTitle.trim(),
      startDate: editStartDate || undefined,
      dueDate: editDueDate || undefined,
    })
    setEditingSubtaskId(null)
  }

  // 기간 문자열 생성
  const dateRangeStr = todo.startDate && todo.deadline
    ? `${formatDate(todo.startDate)} ~ ${formatDate(todo.deadline)}`
    : todo.deadline
    ? `${formatDate(todo.deadline)}`
    : todo.startDate
    ? `${formatDate(todo.startDate)} 시작`
    : null

  return (
    <div
      className="group flex flex-col rounded-2xl px-4 py-3 transition-all shadow-sm"
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
            <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
              <div
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${(subtaskDone / subtasks.length) * 100}%`,
                  backgroundColor: subtaskDone === subtasks.length ? '#22C55E' : 'var(--accent)',
                }}
              />
            </div>
          )}

          {/* 기간 (시작일 ~ 마감일) */}
          {dateRangeStr && (
            <p className="text-xs mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>
              📅 {dateRangeStr}
            </p>
          )}

          {/* 태그 */}
          {todo.tags.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {todo.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
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
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => setAddingSubtask(true)}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="하위 태스크 추가"
            style={{ color: 'var(--text-muted)' }}
          >
            <Plus size={14} strokeWidth={1.8} />
          </button>
          <button
            onClick={() => onEdit(todo)}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="수정"
            style={{ color: 'var(--text-muted)' }}
          >
            <Pencil size={14} strokeWidth={1.8} />
          </button>
          <button
            onClick={() => deleteTodo(todo.id)}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="삭제"
            style={{ color: '#EF4444' }}
          >
            <Trash2 size={14} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* 하위 태스크(서브태스크) 영역 */}
      {(hasSubtasks || addingSubtask) && (
        <div className="mt-3 ml-8 border-t pt-2.5 space-y-2" style={{ borderColor: 'var(--border)' }}>
          {/* 서브태스크 헤더 */}
          {hasSubtasks && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="flex items-center gap-1 text-xs font-semibold"
                style={{ color: 'var(--text-muted)' }}
              >
                {showSubtasks ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                하위 태스크 ({subtaskDone}/{subtasks.length})
              </button>
              {!addingSubtask && (
                <button
                  onClick={() => setAddingSubtask(true)}
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg font-medium"
                  style={{ color: 'var(--accent)', backgroundColor: 'var(--surface-2)' }}
                >
                  <Plus size={11} />
                  추가
                </button>
              )}
            </div>
          )}

          {showSubtasks && (
            <div className="space-y-1.5">
              {subtasks.map((sub) => {
                const isEditing = editingSubtaskId === sub.id
                const subDateRange = sub.startDate && sub.dueDate
                  ? `${formatDate(sub.startDate)} ~ ${formatDate(sub.dueDate)}`
                  : sub.dueDate
                  ? `${formatDate(sub.dueDate)}`
                  : sub.startDate
                  ? `${formatDate(sub.startDate)}~`
                  : null

                if (isEditing) {
                  return (
                    <div
                      key={sub.id}
                      className="p-2.5 rounded-xl space-y-2"
                      style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="하위 태스크 제목"
                        className="w-full text-xs px-2 py-1.5 rounded-lg outline-none"
                        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                      />
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={editStartDate}
                          onChange={(e) => setEditStartDate(e.target.value)}
                          className="flex-1 text-xs px-2 py-1 rounded-lg outline-none"
                          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        />
                        <input
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          className="flex-1 text-xs px-2 py-1 rounded-lg outline-none"
                          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        />
                      </div>
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingSubtaskId(null)}
                          className="px-2.5 py-1 text-xs rounded-lg font-medium"
                          style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEditSubtask(sub.id)}
                          className="px-2.5 py-1 text-xs rounded-lg font-medium"
                          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={sub.id}
                    className="flex items-center gap-2 group/sub py-1 px-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
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
                        color: sub.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: sub.completed ? 'line-through' : 'none',
                      }}
                    >
                      {sub.title}
                    </span>

                    {/* 서브태스크 기간 배지 */}
                    {subDateRange && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-md font-medium flex items-center gap-1"
                        style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)' }}
                      >
                        <Calendar size={10} />
                        {subDateRange}
                      </span>
                    )}

                    {/* 수정 및 삭제 버튼 */}
                    <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditSubtask(sub)}
                        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                        title="하위 태스크 수정"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        onClick={() => deleteSubtask(todo.id, sub.id)}
                        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                        title="하위 태스크 삭제"
                        style={{ color: '#EF4444' }}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* 서브태스크 추가 인풋 */}
          {addingSubtask && (
            <form onSubmit={handleAddSubtask} className="p-2.5 rounded-xl space-y-2 mt-1" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="하위 태스크 제목..."
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setAddingSubtask(false)}
                  className="flex-1 text-xs outline-none bg-transparent"
                  style={{ color: 'var(--text-primary)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowSubtaskDates(!showSubtaskDates)}
                  className="p-1 rounded text-xs flex items-center gap-1"
                  style={{ color: showSubtaskDates ? 'var(--accent)' : 'var(--text-muted)' }}
                  title="기간 설정"
                >
                  <Calendar size={13} />
                </button>
              </div>

              {/* 기간 선택 인풋 */}
              {showSubtaskDates && (
                <div className="flex gap-2 pt-1">
                  <div className="flex-1">
                    <label className="block text-[10px] mb-0.5" style={{ color: 'var(--text-muted)' }}>시작일</label>
                    <input
                      type="date"
                      value={subtaskStartDate}
                      onChange={(e) => setSubtaskStartDate(e.target.value)}
                      className="w-full text-xs px-2 py-1 rounded-lg outline-none"
                      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] mb-0.5" style={{ color: 'var(--text-muted)' }}>마감일</label>
                    <input
                      type="date"
                      value={subtaskDueDate}
                      onChange={(e) => setSubtaskDueDate(e.target.value)}
                      className="w-full text-xs px-2 py-1 rounded-lg outline-none"
                      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setAddingSubtask(false)}
                  className="text-xs px-2.5 py-1 rounded-lg font-medium"
                  style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="text-xs px-2.5 py-1 rounded-lg font-medium"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                >
                  추가
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
