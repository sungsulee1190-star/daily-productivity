'use client'

import { useTodoStore, type Todo } from '@/store/todoStore'
import { format } from 'date-fns'
import { isThisWeek, isThisMonth } from '@/lib/utils'

interface StatCardProps {
  label: string
  done: number
  total: number
  color: string
  emoji: string
}

function StatCard({ label, done, total, color, emoji }: StatCardProps) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <div
      className="flex-1 min-w-0 rounded-2xl px-4 py-3"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
          {emoji} {label}
        </span>
        <span className="text-xs font-bold" style={{ color }}>
          {pct}%
        </span>
      </div>

      {/* 프로그레스 바 */}
      <div className="h-1.5 rounded-full mb-2" style={{ backgroundColor: 'var(--bg)' }}>
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>

      <div className="flex items-end justify-between">
        <span className="text-lg font-bold leading-none" style={{ color: 'var(--text-primary)' }}>
          {done}
          <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
            / {total}
          </span>
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>완료</span>
      </div>
    </div>
  )
}

export default function ProgressCards() {
  const { todos, activeClip } = useTodoStore()
  const clipTodos = todos.filter((t) => t.clip === activeClip)
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  // Daily: 마감일 없거나 <= 오늘인 항목 기준
  const dailyTotal = clipTodos.filter((t) => !t.deadline || t.deadline <= todayStr).length
  const dailyDone = clipTodos.filter(
    (t) =>
      t.completed &&
      t.completedAt &&
      t.completedAt.startsWith(todayStr)
  ).length

  // Weekly: 이번 주 생성됐거나 이번 주 완료된 항목
  const weeklyAll = clipTodos.filter(
    (t) => isThisWeek(t.createdAt) || (t.completedAt && isThisWeek(t.completedAt))
  )
  const weeklyTotal = weeklyAll.length
  const weeklyDone = weeklyAll.filter((t) => t.completed).length

  // Monthly: 이번 달 생성됐거나 이번 달 완료
  const monthlyAll = clipTodos.filter(
    (t) => isThisMonth(t.createdAt) || (t.completedAt && isThisMonth(t.completedAt))
  )
  const monthlyTotal = monthlyAll.length
  const monthlyDone = monthlyAll.filter((t) => t.completed).length

  return (
    <div className="flex gap-3 mb-8">
      <StatCard
        label="데일리"
        done={dailyDone}
        total={dailyTotal}
        color="var(--accent)"
        emoji="☀️"
      />
      <StatCard
        label="위클리"
        done={weeklyDone}
        total={weeklyTotal}
        color="#8B5CF6"
        emoji="📅"
      />
      <StatCard
        label="먼슬리"
        done={monthlyDone}
        total={monthlyTotal}
        color="#22C55E"
        emoji="🗓"
      />
    </div>
  )
}
