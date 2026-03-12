'use client'

import { useState } from 'react'
import { useTodoStore } from '@/store/todoStore'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function ArchivePage() {
  const { todos, activeClip } = useTodoStore()
  const [search, setSearch] = useState('')

  const completedTodos = todos
    .filter((t) => t.clip === activeClip && t.completed)
    .filter((t) => !search || t.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      new Date(b.completedAt ?? b.createdAt).getTime() -
      new Date(a.completedAt ?? a.createdAt).getTime()
    )

  // 날짜별 그룹핑
  const grouped = completedTodos.reduce<Record<string, typeof completedTodos>>(
    (acc, todo) => {
      const dateKey = todo.completedAt
        ? todo.completedAt.slice(0, 10)
        : todo.createdAt.slice(0, 10)
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(todo)
      return acc
    },
    {}
  )

  const priorityColor: Record<string, string> = {
    high: '#EF4444',
    medium: '#F97316',
    low: '#6B7280',
  }
  const priorityLabel: Record<string, string> = {
    high: '높음', medium: '보통', low: '낮음',
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          완료 아카이브
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          완료된 항목 {completedTodos.length}개
        </p>
      </div>

      {/* 검색 */}
      <input
        type="text"
        placeholder="완료된 항목 검색..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-6"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
        }}
      />

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <p className="text-4xl mb-4">📭</p>
          <p className="text-sm">완료된 항목이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateKey, items]) => (
            <div key={dateKey}>
              <h2 className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: 'var(--text-muted)' }}>
                {format(new Date(dateKey), 'yyyy년 M월 d일 EEEE', { locale: ko })} · {items.length}개 완료
              </h2>
              <div className="space-y-1.5">
                {items.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                        <path d="M1 3.5L3 5.5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="flex-1 text-sm line-through"
                      style={{ color: 'var(--text-muted)' }}>
                      {todo.title}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: priorityColor[todo.priority] + '20',
                        color: priorityColor[todo.priority],
                      }}
                    >
                      {priorityLabel[todo.priority]}
                    </span>
                    {todo.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--bg)', color: 'var(--text-muted)' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
