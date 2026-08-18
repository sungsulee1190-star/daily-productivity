'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { Todo, Priority, useTodoStore } from '@/store/todoStore'

interface Props {
  onClose: () => void
  editTodo?: Todo | null
}

export default function TodoForm({ onClose, editTodo }: Props) {
  const { addTodo, updateTodo, activeClip } = useTodoStore()

  const [title, setTitle] = useState(editTodo?.title ?? '')
  const [memo, setMemo] = useState(editTodo?.memo ?? '')
  const [startDate, setStartDate] = useState(editTodo?.startDate ?? '')
  const [deadline, setDeadline] = useState(editTodo?.deadline ?? '')
  const [priority, setPriority] = useState<Priority>(editTodo?.priority ?? 'medium')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(editTodo?.tags ?? [])

  function handleAddTag() {
    const trimmed = tagInput.trim().replace(/^#/, '')
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
    }
    setTagInput('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    if (editTodo) {
      updateTodo(editTodo.id, {
        title: title.trim(),
        memo,
        startDate: startDate || undefined,
        deadline: deadline || undefined,
        priority,
        tags,
      })
    } else {
      addTodo({
        title: title.trim(),
        memo,
        startDate: startDate || undefined,
        deadline: deadline || undefined,
        priority,
        tags,
        clip: activeClip,
      })
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-xl p-6"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {editTodo ? '할 일 수정' : '새 할 일 추가'}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 제목 */}
          <div>
            <input
              autoFocus
              type="text"
              placeholder="할 일을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{
                backgroundColor: 'var(--bg)',
                border: '1.5px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* 기간 (시작일 ~ 마감일) + 우선순위 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                시작일 (선택)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1.5px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                마감일 (선택)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1.5px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          {/* 우선순위 */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
              우선순위
            </label>
            <div className="flex gap-2">
              {[
                { key: 'high', label: '높음', color: '#EF4444', bg: '#FEE2E2' },
                { key: 'medium', label: '보통', color: '#F97316', bg: '#FFEDD5' },
                { key: 'low', label: '낮음', color: '#6B7280', bg: '#F3F4F6' },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPriority(p.key as Priority)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                  style={
                    priority === p.key
                      ? { backgroundColor: p.bg, color: p.color, border: `1.5px solid ${p.color}` }
                      : { backgroundColor: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 태그 */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
              태그 (선택)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="#태그 입력"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1.5px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 rounded-xl text-sm font-medium"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--accent)' }}
              >
                <Plus size={16} />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full cursor-pointer font-medium"
                    style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                  >
                    #{tag} ×
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
              메모 (선택)
            </label>
            <textarea
              placeholder="추가 메모..."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{
                backgroundColor: 'var(--bg)',
                border: '1.5px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* 기간 안내 */}
          {startDate && deadline ? (
            <p className="text-xs" style={{ color: 'var(--accent)' }}>
              📅 기간 설정 ({startDate} ~ {deadline}) → 해당 기간 동안 할 일 목록에 표시됩니다
            </p>
          ) : deadline ? (
            <p className="text-xs" style={{ color: 'var(--accent)' }}>
              📅 마감기한 설정 ({deadline}) → 해당 날짜 할 일 목록에 표시됩니다
            </p>
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              📌 기한 없음 → <strong>오늘 할 일</strong>로 바로 표시됩니다
            </p>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              {editTodo ? '수정하기' : '추가하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
