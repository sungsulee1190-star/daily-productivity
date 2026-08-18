'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { useRoutineStore } from '@/store/routineStore'

export default function HomeRoutineWidget() {
  const { routines, toggleRoutine, addRoutine } = useRoutineStore()
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<'daily' | 'weekly'>('daily')

  const now = new Date()
  const dayKey = format(now, 'yyyy-MM-dd')
  const weekKey = `${format(now, 'yyyy')}-W${format(now, 'II')}`

  const dailyList = routines.filter((r) => r.type === 'daily' && !r.hidden)
  const weeklyList = routines.filter((r) => r.type === 'weekly' && !r.hidden)
  const allActive = [...dailyList, ...weeklyList]

  const doneCount =
    dailyList.filter((r) => r.checkedDays.includes(dayKey)).length +
    weeklyList.filter((r) => r.checkedWeeks.includes(weekKey)).length
  const totalCount = allActive.length
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    addRoutine(newTitle.trim(), newType)
    setNewTitle('')
    setShowAdd(false)
  }

  return (
    <div
      className="rounded-2xl p-4 shadow-sm transition-all"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">☀️</span>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              오늘의 루틴
            </h3>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {doneCount}/{totalCount} 완료 ({pct}%)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="루틴 빠른 추가"
            style={{ color: 'var(--text-muted)' }}
          >
            <Plus size={15} />
          </button>
          <Link
            href="/routine"
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="루틴 관리 페이지 이동"
            style={{ color: 'var(--text-muted)' }}
          >
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>

      {/* 진척률 바 */}
      {totalCount > 0 && (
        <div className="w-full h-1.5 rounded-full mb-3.5 overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              backgroundColor: pct === 100 ? '#22C55E' : 'var(--accent)',
            }}
          />
        </div>
      )}

      {/* 빠른 추가 폼 */}
      {showAdd && (
        <form onSubmit={handleAdd} className="mb-3 p-2.5 rounded-xl space-y-2" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
          <input
            autoFocus
            type="text"
            placeholder="루틴 이름..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full text-xs px-2 py-1.5 rounded-lg outline-none bg-transparent"
            style={{ color: 'var(--text-primary)' }}
          />
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setNewType('daily')}
                className="text-[11px] px-2 py-0.5 rounded-md font-medium"
                style={newType === 'daily'
                  ? { backgroundColor: 'var(--accent)', color: 'white' }
                  : { backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }
                }
              >
                일간
              </button>
              <button
                type="button"
                onClick={() => setNewType('weekly')}
                className="text-[11px] px-2 py-0.5 rounded-md font-medium"
                style={newType === 'weekly'
                  ? { backgroundColor: 'var(--accent)', color: 'white' }
                  : { backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }
                }
              >
                주간
              </button>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="text-xs px-2 py-1 rounded-lg"
                style={{ color: 'var(--text-muted)' }}
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
          </div>
        </form>
      )}

      {/* 루틴 리스트 */}
      {allActive.length === 0 ? (
        <div className="py-6 text-center rounded-xl" style={{ backgroundColor: 'var(--bg)', border: '1px dashed var(--border)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            등록된 루틴이 없습니다
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="text-xs mt-1.5 font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            + 첫 루틴 추가하기
          </button>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {dailyList.map((r) => {
            const isDone = r.checkedDays.includes(dayKey)
            return (
              <div
                key={r.id}
                onClick={() => toggleRoutine(r.id)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  opacity: isDone ? 0.65 : 1,
                }}
              >
                <div
                  className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all"
                  style={
                    isDone
                      ? { backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }
                      : { borderColor: '#D6D3D1', backgroundColor: 'transparent' }
                  }
                >
                  {isDone && (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span
                  className="flex-1 text-xs truncate"
                  style={{
                    color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: isDone ? 'line-through' : 'none',
                  }}
                >
                  {r.title}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                  일간
                </span>
              </div>
            )
          })}

          {weeklyList.map((r) => {
            const isDone = r.checkedWeeks.includes(weekKey)
            return (
              <div
                key={r.id}
                onClick={() => toggleRoutine(r.id)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  opacity: isDone ? 0.65 : 1,
                }}
              >
                <div
                  className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all"
                  style={
                    isDone
                      ? { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }
                      : { borderColor: '#D6D3D1', backgroundColor: 'transparent' }
                  }
                >
                  {isDone && (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span
                  className="flex-1 text-xs truncate"
                  style={{
                    color: isDone ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: isDone ? 'line-through' : 'none',
                  }}
                >
                  {r.title}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{ backgroundColor: '#EDE9FE', color: '#7C3AED' }}>
                  주간
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
