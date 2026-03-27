'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format, startOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Routine {
  id: string
  title: string
  type: 'weekly' | 'monthly' | 'daily'
  checkedWeeks: string[]   // "2024-W01" or "2025-03-W1" format
  checkedMonths: string[]  // "2024-03" format
  checkedDays: string[]    // "2025-03-27" format
  hidden: boolean
}

interface RoutineStore {
  routines: Routine[]
  addRoutine: (title: string, type: 'weekly' | 'monthly' | 'daily') => void
  toggleRoutine: (id: string, key?: string) => void
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
            {
              id: crypto.randomUUID(),
              title,
              type,
              checkedWeeks: [],
              checkedMonths: [],
              checkedDays: [],
              hidden: false,
            },
          ],
        })),
      toggleRoutine: (id, key) => {
        const now = new Date()
        const weekKey = key ?? `${format(now, 'yyyy')}-W${format(now, 'II')}`
        const monthKey = format(now, 'yyyy-MM')
        const dayKey = format(now, 'yyyy-MM-dd')
        set((s) => ({
          routines: s.routines.map((r) => {
            if (r.id !== id) return r
            if (r.type === 'weekly') {
              const checked = r.checkedWeeks.includes(weekKey)
              return { ...r, checkedWeeks: checked ? r.checkedWeeks.filter((k) => k !== weekKey) : [...r.checkedWeeks, weekKey] }
            } else if (r.type === 'monthly') {
              // key is the month-week key like "2025-03-W1"
              const mKey = key ?? monthKey
              const checked = r.checkedWeeks.includes(mKey)
              return { ...r, checkedWeeks: checked ? r.checkedWeeks.filter((k) => k !== mKey) : [...r.checkedWeeks, mKey] }
            } else {
              // daily
              const checked = r.checkedDays.includes(dayKey)
              return { ...r, checkedDays: checked ? r.checkedDays.filter((k) => k !== dayKey) : [...r.checkedDays, dayKey] }
            }
          }),
        }))
      },
      hideRoutine: (id) =>
        set((s) => ({ routines: s.routines.map((r) => r.id === id ? { ...r, hidden: true } : r) })),
    }),
    {
      name: 'daily-productivity-routines',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.routines = state.routines.map((r) => ({
            ...r,
            checkedDays: r.checkedDays ?? [],
          }))
        }
      },
    }
  )
)

function getMonthWeeks(year: number, month: number): Array<{ label: string; key: string; start: Date; end: Date }> {
  const firstDay = startOfMonth(new Date(year, month - 1))
  const lastDay = endOfMonth(new Date(year, month - 1))
  const weeks: Array<{ label: string; key: string; start: Date; end: Date }> = []

  let weekStart = startOfWeek(firstDay, { weekStartsOn: 1 })
  let weekNum = 1

  while (weekStart <= lastDay) {
    const weekEnd = addDays(weekStart, 6)
    const clampedStart = weekStart < firstDay ? firstDay : weekStart
    const clampedEnd = weekEnd > lastDay ? lastDay : weekEnd
    const startInMonth = clampedStart.getMonth() === month - 1
    const endInMonth = clampedEnd.getMonth() === month - 1

    if (startInMonth || endInMonth) {
      const key = `${year}-${String(month).padStart(2, '0')}-W${weekNum}`
      const labelStart = format(clampedStart, 'M/d')
      const labelEnd = format(clampedEnd, 'M/d')
      weeks.push({ label: `${labelStart}~${labelEnd}`, key, start: clampedStart, end: clampedEnd })
      weekNum++
    }
    weekStart = addDays(weekStart, 7)
  }
  return weeks
}

export default function RoutinePage() {
  const { routines, addRoutine, toggleRoutine, hideRoutine } = useRoutineStore()
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<'weekly' | 'monthly' | 'daily'>('weekly')

  const now = new Date()
  const weekKey = `${format(now, 'yyyy')}-W${format(now, 'II')}`
  const dayKey = format(now, 'yyyy-MM-dd')
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const weeklyRoutines = routines.filter((r) => r.type === 'weekly' && !r.hidden)
  const monthlyRoutines = routines.filter((r) => r.type === 'monthly' && !r.hidden)
  const dailyRoutines = routines.filter((r) => r.type === 'daily' && !r.hidden)

  const monthWeeks = getMonthWeeks(currentYear, currentMonth)

  function isWeeklyChecked(r: Routine) {
    return r.checkedWeeks.includes(weekKey)
  }

  function isMonthlyWeekChecked(r: Routine, weekCellKey: string) {
    return r.checkedWeeks.includes(weekCellKey)
  }

  function isDailyChecked(r: Routine) {
    return r.checkedDays.includes(dayKey)
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    addRoutine(newTitle.trim(), newType)
    setNewTitle('')
    setShowForm(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            루틴 관리
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {format(now, 'yyyy년 M월', { locale: ko })} · {format(startOfWeek(now, { weekStartsOn: 1 }), 'M월 d일', { locale: ko })} 주차
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
            onChange={(e) => setNewType(e.target.value as 'weekly' | 'monthly' | 'daily')}
            className="px-3 py-2 rounded-xl text-sm outline-none"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            <option value="daily">일간</option>
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

      {/* 일간 루틴 */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          ☀️ 일간 루틴 — 오늘 ({format(now, 'M월 d일', { locale: ko })})
        </h2>
        {dailyRoutines.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
            일간 루틴을 추가해보세요
          </p>
        ) : (
          <div className="space-y-2">
            {dailyRoutines.map((r) => (
              <div key={r.id}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                <button
                  onClick={() => toggleRoutine(r.id)}
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0"
                  style={isDailyChecked(r)
                    ? { backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }
                    : { borderColor: '#D6D3D1' }}
                >
                  {isDailyChecked(r) && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className="flex-1 text-sm" style={{
                  color: isDailyChecked(r) ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: isDailyChecked(r) ? 'line-through' : 'none',
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
                  style={isWeeklyChecked(r)
                    ? { backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }
                    : { borderColor: '#D6D3D1' }}
                >
                  {isWeeklyChecked(r) && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className="flex-1 text-sm" style={{
                  color: isWeeklyChecked(r) ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: isWeeklyChecked(r) ? 'line-through' : 'none',
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th
                    className="text-left px-4 py-2 text-xs font-semibold rounded-tl-xl"
                    style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface)', minWidth: '140px' }}
                  >
                    루틴
                  </th>
                  {monthWeeks.map((week, idx) => (
                    <th
                      key={week.key}
                      className="px-3 py-2 text-xs font-semibold text-center"
                      style={{
                        color: 'var(--text-muted)',
                        backgroundColor: 'var(--surface)',
                        borderLeft: '1px solid var(--border)',
                        minWidth: '80px',
                        borderRadius: idx === monthWeeks.length - 1 ? '0 0.75rem 0 0' : 0,
                      }}
                    >
                      <div>{week.label}</div>
                      <div style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{idx + 1}주차</div>
                    </th>
                  ))}
                  <th
                    className="px-2 py-2 text-xs rounded-tr-xl"
                    style={{ backgroundColor: 'var(--surface)', borderLeft: '1px solid var(--border)', width: '40px' }}
                  />
                </tr>
              </thead>
              <tbody>
                {monthlyRoutines.map((r, rowIdx) => (
                  <tr key={r.id}>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text-primary)',
                        borderTop: '1px solid var(--border)',
                        borderRadius: rowIdx === monthlyRoutines.length - 1 ? '0 0 0 0.75rem' : 0,
                      }}
                    >
                      {r.title}
                    </td>
                    {monthWeeks.map((week) => {
                      const checked = isMonthlyWeekChecked(r, week.key)
                      return (
                        <td
                          key={week.key}
                          className="px-3 py-3 text-center"
                          style={{
                            backgroundColor: 'var(--surface)',
                            borderTop: '1px solid var(--border)',
                            borderLeft: '1px solid var(--border)',
                          }}
                        >
                          <button
                            onClick={() => toggleRoutine(r.id, week.key)}
                            className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all mx-auto"
                            style={checked
                              ? { backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }
                              : { borderColor: '#D6D3D1' }}
                          >
                            {checked && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </button>
                        </td>
                      )
                    })}
                    <td
                      className="px-2 py-3 text-center"
                      style={{
                        backgroundColor: 'var(--surface)',
                        borderTop: '1px solid var(--border)',
                        borderLeft: '1px solid var(--border)',
                        borderRadius: rowIdx === monthlyRoutines.length - 1 ? '0 0 0.75rem 0' : 0,
                      }}
                    >
                      <button onClick={() => hideRoutine(r.id)} style={{ color: 'var(--text-muted)' }}>
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
