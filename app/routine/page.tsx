'use client'

import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { format, startOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useAuth } from '@/lib/auth-context'
import { useRoutineStore, Routine } from '@/store/routineStore'


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
  const { user } = useAuth()
  const userId = user?.id
  const { routines, addRoutine, toggleRoutine, hideRoutine, fetchRoutines } = useRoutineStore()
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

  useEffect(() => {
    if (userId) fetchRoutines(userId)
  }, [userId, fetchRoutines])

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
            className="flex-1 text-sm px-3 py-2 rounded-xl outline-none"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as 'weekly' | 'monthly' | 'daily')}
            className="text-sm px-3 py-2 rounded-xl outline-none"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            <option value="weekly">주간 루틴 (매주 체크)</option>
            <option value="monthly">월간 루틴 (주차별 체크)</option>
            <option value="daily">일간 루틴 (매일 체크)</option>
          </select>
          <button
            type="submit"
            className="text-sm px-4 py-2 rounded-xl font-medium"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          >
            추가
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="text-sm px-3 py-2 rounded-xl font-medium"
            style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)' }}
          >
            취소
          </button>
        </form>
      )}

      <div className="space-y-8">
        {/* 일간 루틴 섹션 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <span>☀️</span> 일간 루틴
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                {format(now, 'M월 d일 EEEE', { locale: ko })}
              </span>
            </h2>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {dailyRoutines.filter(isDailyChecked).length}/{dailyRoutines.length} 완료
            </span>
          </div>

          {dailyRoutines.length === 0 ? (
            <div className="text-center py-6 rounded-2xl text-xs" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              등록된 일간 루틴이 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {dailyRoutines.map((routine) => {
                const checked = isDailyChecked(routine)
                return (
                  <div
                    key={routine.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl transition-all group"
                    style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleRoutine(routine.id)}
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                        style={
                          checked
                            ? { backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }
                            : { borderColor: '#D6D3D1', backgroundColor: 'transparent' }
                        }
                      >
                        {checked && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <span
                        className="text-sm font-medium"
                        style={{
                          color: checked ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: checked ? 'line-through' : 'none',
                        }}
                      >
                        {routine.title}
                      </span>
                    </div>

                    <button
                      onClick={() => hideRoutine(routine.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-opacity"
                      style={{ color: 'var(--text-muted)' }}
                      title="숨기기"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 주간 루틴 섹션 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
              <span>📅</span> 이번 주 루틴
            </h2>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {weeklyRoutines.filter(isWeeklyChecked).length}/{weeklyRoutines.length} 완료
            </span>
          </div>

          {weeklyRoutines.length === 0 ? (
            <div className="text-center py-6 rounded-2xl text-xs" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              등록된 주간 루틴이 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {weeklyRoutines.map((routine) => {
                const checked = isWeeklyChecked(routine)
                return (
                  <div
                    key={routine.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl transition-all group"
                    style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleRoutine(routine.id)}
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                        style={
                          checked
                            ? { backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }
                            : { borderColor: '#D6D3D1', backgroundColor: 'transparent' }
                        }
                      >
                        {checked && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                      <span
                        className="text-sm font-medium"
                        style={{
                          color: checked ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: checked ? 'line-through' : 'none',
                        }}
                      >
                        {routine.title}
                      </span>
                    </div>

                    <button
                      onClick={() => hideRoutine(routine.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-opacity"
                      style={{ color: 'var(--text-muted)' }}
                      title="숨기기"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 월간 루틴 섹션 */}
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <span>🗓</span> 이번 달 주차별 루틴
          </h2>

          {monthlyRoutines.length === 0 ? (
            <div className="text-center py-6 rounded-2xl text-xs" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              등록된 월간 루틴이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-xs text-left" style={{ backgroundColor: 'var(--surface)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-2)' }}>
                    <th className="py-3 px-4 font-semibold" style={{ color: 'var(--text-primary)' }}>루틴명</th>
                    {monthWeeks.map((w) => (
                      <th key={w.key} className="py-3 px-2 text-center font-medium" style={{ color: 'var(--text-muted)' }}>
                        {w.label}
                      </th>
                    ))}
                    <th className="py-3 px-3 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyRoutines.map((routine) => (
                    <tr key={routine.id} className="group hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-3 px-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                        {routine.title}
                      </td>
                      {monthWeeks.map((w) => {
                        const checked = isMonthlyWeekChecked(routine, w.key)
                        return (
                          <td key={w.key} className="py-3 px-2 text-center">
                            <button
                              onClick={() => toggleRoutine(routine.id, w.key)}
                              className="w-4 h-4 mx-auto rounded border flex items-center justify-center transition-all"
                              style={
                                checked
                                  ? { backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }
                                  : { borderColor: '#D6D3D1', backgroundColor: 'transparent' }
                              }
                            >
                              {checked && (
                                <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                  <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </button>
                          </td>
                        )
                      })}
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => hideRoutine(routine.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-opacity"
                          style={{ color: 'var(--text-muted)' }}
                          title="숨기기"
                        >
                          <X size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
