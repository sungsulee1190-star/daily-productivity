'use client'

import { useState } from 'react'
import { CalendarDays, Settings2, ExternalLink, Info } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

export default function CalendarPage() {
  const { calendarEmbedUrl, setCalendarEmbedUrl } = useUIStore()
  const [editing, setEditing] = useState(false)
  const [inputUrl, setInputUrl] = useState(calendarEmbedUrl)

  const handleSave = () => {
    setCalendarEmbedUrl(inputUrl.trim())
    setEditing(false)
  }

  return (
    <div className="p-4 md:p-6 h-full flex flex-col gap-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays size={20} style={{ color: 'var(--accent)' }} />
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>캘린더</h1>
        </div>
        <div className="flex items-center gap-2">
          {calendarEmbedUrl && (
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--surface)' }}
            >
              <ExternalLink size={13} />
              구글 캘린더 열기
            </a>
          )}
          <button
            onClick={() => { setInputUrl(calendarEmbedUrl); setEditing((v) => !v) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--surface)' }}
          >
            <Settings2 size={13} />
            {editing ? '취소' : '설정'}
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {editing && (
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-start gap-2.5">
            <Info size={15} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
            <div className="space-y-1">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>구글 캘린더 임베드 URL 설정</p>
              <ol className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                <li>1. <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Calendar</a> 열기</li>
                <li>2. 설정(⚙) → 내 캘린더 → 캘린더 이름 클릭</li>
                <li>3. 하단 &quot;캘린더 통합&quot; → &quot;이 캘린더 퍼가기&quot; → 링크 복사</li>
                <li>4. 아래에 붙여넣기 후 저장</li>
              </ol>
            </div>
          </div>
          <input
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="https://calendar.google.com/calendar/embed?src=..."
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              저장
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Calendar content */}
      {calendarEmbedUrl ? (
        <div
          className="flex-1 rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--border)', minHeight: '500px' }}
        >
          <iframe
            src={calendarEmbedUrl}
            style={{ border: 0, width: '100%', height: '100%', minHeight: '500px' }}
            frameBorder="0"
            scrolling="no"
            title="Google Calendar"
          />
        </div>
      ) : (
        <div
          className="flex-1 flex flex-col items-center justify-center rounded-2xl gap-4 text-center p-8"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', minHeight: '400px' }}
        >
          <CalendarDays size={48} style={{ color: 'var(--text-muted)' }} />
          <div>
            <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>구글 캘린더 연동</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              설정 버튼을 눌러 Google Calendar 임베드 URL을 입력하면<br />
              여기서 바로 일정을 확인할 수 있어요.
            </p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          >
            지금 설정하기
          </button>
        </div>
      )}
    </div>
  )
}
