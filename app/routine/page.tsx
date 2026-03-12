'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format, startOfWeek, startOfMonth } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Routine {
  id: string
  title: string
  type: 'weekly' | 'monthly'
  checkedWeeks: string[]  // "2024-W01" 형식
  checkedMonths: string[] // "2024-03" 형식
  hidden: boolean
}

interface RoutineStore {
  routines: Routine[]
  addRoutine: (title: string, type: 'weekly' | 'monthly') => void
  toggleRoutine: (id: string) => void
  hideRoutine: (id: string) => void
}

const useRoutineStore = create<RoutineStore>()(
  persist(
    (set) => ({
      routines: [],
      addRoutine: (title, type) =>
        set((s) => ({
          routines: [
            ...s.routines,
            { id: crypto.randomUUID(), title, type, checkedWeeks: [], checkedMonths: [], hidden: false },
          ],
        })),
      toggleRoutine: (id) => {
        const now = new Date()
        const weekKey = `${format(now, 'yyyy')}-W${format(now, 'II')}`
        const monthKey = format(now, 'yyyy-MM')
        set((s) => ({
          routines: s.routines.map((r) => {
            if (r.id !== id) return r
            if (r.type === 'weekly') {
              const checked = r.checkedWeeks.includes(weekKey)
              return { ...r, checkedWeeks: checked ? r.checkedWeeks.filter((k) => k !== weekKey) : [...r.checkedWeeks, weekKey] }
            } else {
              const checked = r.checkedMonths.includes(monthKey)
              return { ...r, checkedMonths: checked ? r.checkedMonths.filter((k) => k !== monthKey) : [...r.checkedMonths, monthKey] }
            }
          }),
        }))
      },
      hideRoutine: (id) =>
        set((s) => ({ routines: s.routines.map((r) => r.id === id ? { ...r, hidden: true } : r) })),
    }),
    { name: 'daily-productivity-routines' }
  )
)

export default function RoutinePage() {
  const { routines, addRoutine, toggleRoutine, hideRoutine } = useRoutineStore()
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<'weekly' | 'monthly'>('weekly')

  const now = new Date()
  const weekKey = `${format(now, 'yyyy')}-W${format(now, 'II')}`
  const monthKey = format(now, 'yyyy-MM')

  const weeklyRoutines = routines.filter((r) => r.type === 'weekly' && !r.hidden)
  const monthlyRoutines = routines.filter((r) => r.type === 'monthly' && !r.hidden)

  function isChecked(r: Routine) {
    return r.type === 'weekly' ? r.checkedWeeks.includes(weekKey) : r.checkedMonths.includes(monthKey)
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    addRoutine(newTitle.trim(), newType)
    setNewTitle('')
    setShowForm(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            루틴 관리
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {format(now, 'yyyy년 M월', { locale: ko })} · {format(startOfWeek(now, { locale: ko }), 'M월 d일')} 주차
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
        >
          <Plus size={15} />
          루틴 추가
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd}
          className="mb-6 p-4 rounded-2xl flex gap-3 items-center"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <input
            autoFocus
            type="text"
            placeholder="루틴 이름..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as 'weekly' | 'monthly')}
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            <option value="weekly">주간</option>
            <option value="monthly">월간</option>
          </select>
          <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}>추가</button>
          <button type="button" onClick={() => setShowForm(false)} style={{ color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </form>
      )}

      {/* 주간 루틴 */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          📅 주간 루틴 — 이번 주
        </h2>
        {weeklyRoutines.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
            주간 루틴을 추가해보세요
          </p>
        ) : (
          <div className="space-y-2">
            {weeklyRoutines.map((r) => (
              <div key={r.id}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                <button
                  onClick={() => toggleRoutine(r.id)}
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0"
                  style={isChecked(r)
                    ? { backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }
                    : { borderColor: '#D6D3D1' }}
                >
                  {isChecked(r) && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className="flex-1 text-sm" style={{
                  color: isChecked(r) ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: isChecked(r) ? 'line-through' : 'none',
                }}>
                  {r.title}
                </span>
                <button onClick={() => hideRoutine(r.id)} style={{ color: 'var(--text-muted)' }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 월간 루틴 */}
      <section>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          🗓 월간 루틴 — 이번 달
        </h2>
        {monthlyRoutines.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
            월간 루틴을 추가해보세요
          </p>
        ) : (
          <div className="space-y-2">
            {monthlyRoutines.map((r) => (
              <div key={r.id}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                <button
                  onClick={() => toggleRoutine(r.id)}
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0"
                  style={isChecked(r)
                    ? { backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }
                    : { borderColor: '#D6D3D1' }}
                >
                  {isChecked(r) && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className="flex-1 text-sm" style={{
                  color: isChecked(r) ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: isChecked(r) ? 'line-through' : 'none',
                }}>
                  {r.title}
                </span>
                <button onClick={() => hideRoutine(r.id)} style={{ color: 'var(--text-muted)' }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
