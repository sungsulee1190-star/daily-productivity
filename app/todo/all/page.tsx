'use client'

import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useTodoStore } from '@/store/todoStore'
import TodoItem from '@/components/TodoItem'
import TodoForm from '@/components/TodoForm'
import type { Todo, Priority } from '@/store/todoStore'

type FilterType = 'all' | 'daily' | 'someday' | 'completed'
type SortType = 'createdAt' | 'deadline' | 'priority'

const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

export default function AllTodosPage() {
  const { todos, activeClip } = useTodoStore()
  const [showForm, setShowForm] = useState(false)
  const [editTodo, setEditTodo] = useState<Todo | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('createdAt')
  const [search, setSearch] = useState('')

  const clipTodos = todos.filter((t) => t.clip === activeClip)

  const filtered = clipTodos.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'daily') return !t.completed && !!t.deadline
    if (filter === 'someday') return !t.completed && !t.deadline
    if (filter === 'completed') return t.completed
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'priority') return priorityOrder[a.priority] - priorityOrder[b.priority]
    if (sort === 'deadline') {
      if (!a.deadline && !b.deadline) return 0
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return a.deadline.localeCompare(b.deadline)
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const filterLabels: Record<FilterType, string> = {
    all: `전체 (${clipTodos.length})`,
    daily: `데일리 (${clipTodos.filter((t) => !t.completed && t.deadline).length})`,
    someday: `언젠가 (${clipTodos.filter((t) => !t.completed && !t.deadline).length})`,
    completed: `완료 (${clipTodos.filter((t) => t.completed).length})`,
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          전체 목록
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
        >
          <Plus size={15} />
          추가
        </button>
      </div>

      {/* 검색 */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(Object.keys(filterLabels) as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
            style={
              filter === f
                ? { backgroundColor: 'var(--accent)', color: 'white' }
                : { backgroundColor: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
            }
          >
            {filterLabels[f]}
          </button>
        ))}

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortType)}
          className="ml-auto text-xs px-3 py-1.5 rounded-full outline-none"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          <option value="createdAt">생성일순</option>
          <option value="deadline">마감일순</option>
          <option value="priority">우선순위순</option>
        </select>
      </div>

      {/* 목록 */}
      {sorted.length === 0 ? (
        <p className="text-sm text-center py-10" style={{ color: 'var(--text-muted)' }}>
          항목이 없습니다
        </p>
      ) : (
        <div className="space-y-2">
          {sorted.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onEdit={(t) => { setEditTodo(t); setShowForm(true) }}
            />
          ))}
        </div>
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
