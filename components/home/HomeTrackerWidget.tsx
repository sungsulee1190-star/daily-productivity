'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Calendar, User } from 'lucide-react'
import { useTrackerStore, TrackerStatus } from '@/store/trackerStore'
import { formatDate, getDaysOverdue } from '@/lib/utils'

const STATUS_CONFIG: Record<TrackerStatus, { label: string; color: string; bg: string }> = {
  pending:     { label: '대기',  color: '#6b7280', bg: '#f3f4f6' },
  in_progress: { label: '진행',  color: '#d97706', bg: '#fef3c7' },
  done:        { label: '완료',  color: '#16a34a', bg: '#dcfce7' },
  blocked:     { label: '블로킹', color: '#dc2626', bg: '#fee2e2' },
}

export default function HomeTrackerWidget() {
  const { sessions, updateItem } = useTrackerStore()
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  // 기본으로 첫 번째 세션 선택
  const activeSession = sessions.find((s) => s.id === (selectedSessionId || sessions[0]?.id)) ?? null

  const items = activeSession?.items ?? []
  const activeItems = items.filter((i) => i.status !== 'done')
  const doneItems = items.filter((i) => i.status === 'done')
  const totalCount = items.length
  const pct = totalCount > 0 ? Math.round((doneItems.length / totalCount) * 100) : 0

  const handleNextStatus = (sessionId: string, itemId: string, currentStatus: TrackerStatus) => {
    const order: TrackerStatus[] = ['pending', 'in_progress', 'done', 'blocked']
    const nextIdx = (order.indexOf(currentStatus) + 1) % order.length
    updateItem(sessionId, itemId, { status: order[nextIdx] })
  }

  return (
    <div
      className="rounded-2xl p-4 shadow-sm transition-all"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              업무 F/U 트래커
            </h3>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {activeSession ? `${activeSession.name} (${pct}%)` : '세션 없음'}
            </p>
          </div>
        </div>

        <Link
          href="/tracker"
          className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-0.5 text-xs font-medium"
          style={{ color: 'var(--accent)' }}
          title="F/U 트래커로 이동"
        >
          <span>전체보기</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* 세션 선택 셀렉트 */}
      {sessions.length > 1 && (
        <div className="mb-3">
          <select
            value={activeSession?.id ?? ''}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-xl outline-none"
            style={{
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            {sessions.map((sess) => (
              <option key={sess.id} value={sess.id}>
                {sess.name} ({sess.items.length}개)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 세션 진척도 */}
      {activeSession && totalCount > 0 && (
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

      {/* 태스크 목록 */}
      {!activeSession || items.length === 0 ? (
        <div className="py-6 text-center rounded-xl" style={{ backgroundColor: 'var(--bg)', border: '1px dashed var(--border)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            진행 중인 F/U 프로젝트가 없습니다
          </p>
          <Link
            href="/tracker"
            className="text-xs mt-1.5 inline-block font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            + F/U 세션 만들기
          </Link>
        </div>
      ) : activeItems.length === 0 ? (
        <div className="py-5 text-center rounded-xl" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold" style={{ color: '#16A34A' }}>
            🎉 모든 F/U 태스크를 완료했습니다!
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            총 {totalCount}개 항목 완료
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {activeItems.map((item) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending
            const daysOverdue = item.dueDate ? getDaysOverdue(item.dueDate) : 0
            const dateRangeStr = item.startDate && item.dueDate
              ? `${formatDate(item.startDate)} ~ ${formatDate(item.dueDate)}`
              : item.dueDate
              ? `${formatDate(item.dueDate)}`
              : null

            return (
              <div
                key={item.id}
                className="p-2.5 rounded-xl space-y-1.5 transition-all"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold leading-snug flex-1" style={{ color: 'var(--text-primary)' }}>
                    {item.title}
                  </span>
                  <button
                    onClick={() => handleNextStatus(activeSession.id, item.id, item.status)}
                    className="text-[10px] px-2 py-0.5 rounded-md font-bold transition-transform active:scale-95 flex-shrink-0"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}
                    title="클릭하여 상태 변경"
                  >
                    {cfg.label}
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-[11px]">
                  {item.assignee && (
                    <span className="flex items-center gap-0.5" style={{ color: 'var(--text-secondary)' }}>
                      <User size={10} />
                      {item.assignee}
                    </span>
                  )}
                  {dateRangeStr && (
                    <span className="flex items-center gap-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>
                      <Calendar size={10} />
                      {dateRangeStr}
                    </span>
                  )}
                  {daysOverdue > 0 && (
                    <span className="font-bold px-1.5 py-0.2 rounded text-[10px]" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                      D+{daysOverdue}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
