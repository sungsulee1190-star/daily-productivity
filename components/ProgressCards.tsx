'use client'

import { useTodoStore } from '@/store/todoStore'
import { format } from 'date-fns'
import { isThisWeek, isThisMonth, isCompletedOn } from '@/lib/utils'

interface StatCardProps {
  label: string
  done: number
  total: number
  highlight?: boolean
}

function ProgressRow({ label, done, total, highlight }: StatCardProps) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-[var(--text-secondary)]">
          {done}/{total}개 완료 <span className="ml-1 font-semibold text-[var(--text-primary)]">{pct}%</span>
        </span>
      </div>
      <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div
          className={`h-full rounded-full motion-safe:transition-[width] ${highlight ? 'bg-[var(--accent-ink)]' : 'bg-[var(--text-secondary)]'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </li>
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
      isCompletedOn(t.completedAt, todayStr)
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
    <section aria-labelledby="home-progress-title" className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
      <h2 id="home-progress-title" className="mb-3 text-[15px] font-semibold">할 일 진행률</h2>
      <ul className="divide-y divide-[var(--border)]">
        <ProgressRow label="오늘" done={dailyDone} total={dailyTotal} highlight />
        <ProgressRow label="이번 주" done={weeklyDone} total={weeklyTotal} />
        <ProgressRow label="이번 달" done={monthlyDone} total={monthlyTotal} />
      </ul>
    </section>
  )
}
