'use client'

import { useState, useEffect } from 'react'
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
      updateTodo(editTodo.id, { title: title.trim(), memo, deadline, priority, tags })
    } else {
      addTodo({
        title: title.trim(),
        memo,
        deadline,
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

          {/* 마감기한 + 우선순위 */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                마감기한 (선택)
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
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                우선순위
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="px-3 py-2 rounded-xl text-sm outline-none"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1.5px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="high">높음</option>
                <option value="medium">보통</option>
                <option value="low">낮음</option>
              </select>
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
                className="px-3 py-2 rounded-xl text-sm"
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
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full cursor-pointer"
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

          {/* 마감기한 안내 */}
          {deadline ? (
            <p className="text-xs" style={{ color: 'var(--accent)' }}>
              📅 마감기한 설정 → 해당 날짜 할 일 목록에 표시됩니다
            </p>
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              📌 마감기한 없음 → <strong>오늘 할 일</strong>로 바로 표시됩니다
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
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
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
