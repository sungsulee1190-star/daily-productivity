'use client'

import { useState } from 'react'
import { Plus, X, ChevronDown, ChevronUp, Trash2, Clock, CheckCircle2, AlertCircle, Circle } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useTrackerStore, TrackerItem, TrackerStatus } from '@/store/trackerStore'

const STATUS_CONFIG: Record<TrackerStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:     { label: '대기중',  color: '#6b7280', bg: '#f3f4f6', icon: Circle },
  in_progress: { label: '진행중',  color: '#d97706', bg: '#fef3c7', icon: Clock },
  done:        { label: '완료',    color: '#16a34a', bg: '#dcfce7', icon: CheckCircle2 },
  blocked:     { label: '블로킹',  color: '#dc2626', bg: '#fee2e2', icon: AlertCircle },
}

function StatusBadge({ status }: { status: TrackerStatus }) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  )
}

interface AddSessionModalProps {
  onAdd: (name: string, month: string) => void
  onClose: () => void
}

function AddSessionModal({ onAdd, onClose }: AddSessionModalProps) {
  const [name, setName] = useState('')
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name.trim(), month)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="rounded-2xl p-6 w-full max-w-sm mx-4" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>새 세션 만들기</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="세션 이름 (예: 2025년 3월 회의 F/U)"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>월 선택</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl text-sm font-medium"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >만들기</button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-sm font-medium"
              style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
            >취소</button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface AddItemFormProps {
  onAdd: (item: Omit<TrackerItem, 'id' | 'createdAt' | 'updatedAt' | 'history'>) => void
  onCancel: () => void
}

function AddItemForm({ onAdd, onCancel }: AddItemFormProps) {
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [tags, setTags] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<TrackerStatus>('pending')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({
      title: title.trim(),
      status,
      assignee: assignee.trim() || undefined,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
      tags: tags.trim() ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-4 space-y-3 mb-4"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="업무 제목"
        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
        style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      />
      <div className="flex gap-2">
        <input
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          placeholder="담당자"
          className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
          style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
          style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
      </div>
      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="태그 (쉼표로 구분)"
        className="w-full rounded-xl px-3 py-2 text-sm outline-none"
        style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="메모 (선택)"
        rows={2}
        className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none"
        style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      />
      <div className="flex gap-1 flex-wrap">
        {(Object.entries(STATUS_CONFIG) as [TrackerStatus, typeof STATUS_CONFIG[TrackerStatus]][]).map(([key, cfg]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatus(key)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
            style={status === key
              ? { backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }
              : { backgroundColor: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
            }
          >{cfg.label}</button>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 py-2 rounded-xl text-sm font-medium"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
        >추가</button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-sm font-medium"
          style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
        >취소</button>
      </div>
    </form>
  )
}

interface ItemCardProps {
  item: TrackerItem
  sessionId: string
}

function ItemCard({ item, sessionId }: ItemCardProps) {
  const { updateItem, deleteItem, addHistory } = useTrackerStore()
  const [expanded, setExpanded] = useState(false)
  const [newNote, setNewNote] = useState('')

  const handleStatusChange = (status: TrackerStatus) => {
    updateItem(sessionId, item.id, { status })
  }

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return
    addHistory(sessionId, item.id, newNote.trim())
    setNewNote('')
  }

  return (
    <div
      className="rounded-2xl p-4 transition-all"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <StatusBadge status={item.status} />
            {item.assignee && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>@{item.assignee}</span>
            )}
            {item.dueDate && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                마감: {format(new Date(item.dueDate), 'M월 d일', { locale: ko })}
              </span>
            )}
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
          {item.tags && item.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 rounded-md"
                  style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: 'var(--text-muted)' }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={() => deleteItem(sessionId, item.id)}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: 'var(--text-muted)' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          {/* Status change */}
          <div>
            <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>상태 변경</p>
            <div className="flex gap-1 flex-wrap">
              {(Object.entries(STATUS_CONFIG) as [TrackerStatus, typeof STATUS_CONFIG[TrackerStatus]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                  style={item.status === key
                    ? { backgroundColor: cfg.bg, color: cfg.color }
                    : { backgroundColor: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                  }
                >{cfg.label}</button>
              ))}
            </div>
          </div>

          {/* Notes */}
          {item.notes && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.notes}</p>
          )}

          {/* Add note / history */}
          <form onSubmit={handleNoteSubmit} className="flex gap-2">
            <input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="히스토리 메모 추가..."
              className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl text-sm font-medium"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >추가</button>
          </form>

          {/* History */}
          {item.history.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>히스토리</p>
              {item.history.slice().reverse().map((h, idx) => (
                <div
                  key={idx}
                  className="flex gap-2 text-xs rounded-xl px-3 py-2"
                  style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{h.date}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{h.note}</span>
                  <StatusBadge status={h.status as TrackerStatus} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function TrackerPage() {
  const { sessions, addSession, deleteSession, addItem } = useTrackerStore()
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? null

  const handleAddSession = (name: string, month: string) => {
    const id = addSession(name, month)
    setSelectedSessionId(id)
  }

  const stats = selectedSession ? {
    total: selectedSession.items.length,
    done: selectedSession.items.filter((i) => i.status === 'done').length,
    inProgress: selectedSession.items.filter((i) => i.status === 'in_progress').length,
    blocked: selectedSession.items.filter((i) => i.status === 'blocked').length,
  } : null

  return (
    <div className="flex-1 min-w-0 flex flex-col md:flex-row h-full" style={{ minHeight: 0 }}>
      {/* Left panel - session list */}
      <div
        className="w-full md:w-64 flex-shrink-0 flex flex-col border-b md:border-b-0 md:border-r"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
      >
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <h1 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>📋 업무 F/U 트래커</h1>
          <button
            onClick={() => setShowSessionModal(true)}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl font-medium"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          >
            <Plus size={12} />
            새 세션
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>세션이 없습니다</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>새 세션을 만들어보세요</p>
            </div>
          ) : (
            sessions.map((sess) => (
              <div
                key={sess.id}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer group"
                style={selectedSessionId === sess.id
                  ? { backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }
                  : { color: 'var(--text-secondary)' }
                }
                onClick={() => setSelectedSessionId(sess.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{sess.name}</p>
                  <p className="text-xs" style={{ color: selectedSessionId === sess.id ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {sess.month} · {sess.items.length}개
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSession(sess.id); if (selectedSessionId === sess.id) setSelectedSessionId(null) }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-opacity"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right panel - items */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {!selectedSession ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl mb-2">📋</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>세션을 선택하거나 새 세션을 만드세요</p>
            </div>
          </div>
        ) : (
          <>
            {/* Session header */}
            <div className="p-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedSession.name}</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{selectedSession.month}</p>
                </div>
                <button
                  onClick={() => setShowAddItem((v) => !v)}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl font-medium flex-shrink-0"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                >
                  <Plus size={13} />
                  항목 추가
                </button>
              </div>

              {/* Progress */}
              {stats && stats.total > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-4 text-xs mb-2">
                    <span style={{ color: 'var(--text-muted)' }}>전체 {stats.total}개</span>
                    <span style={{ color: '#16a34a' }}>완료 {stats.done}개</span>
                    <span style={{ color: '#d97706' }}>진행중 {stats.inProgress}개</span>
                    {stats.blocked > 0 && <span style={{ color: '#dc2626' }}>블로킹 {stats.blocked}개</span>}
                  </div>
                  <div className="w-full rounded-full h-1.5" style={{ backgroundColor: 'var(--bg)' }}>
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${(stats.done / stats.total) * 100}%`, backgroundColor: 'var(--accent)' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {showAddItem && (
                <AddItemForm
                  onAdd={(item) => { addItem(selectedSession.id, item); setShowAddItem(false) }}
                  onCancel={() => setShowAddItem(false)}
                />
              )}

              {selectedSession.items.length === 0 && !showAddItem ? (
                <div
                  className="rounded-2xl p-8 text-center"
                  style={{ backgroundColor: 'var(--surface)', border: '1px dashed var(--border)' }}
                >
                  <p className="text-2xl mb-2">📝</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>항목을 추가해보세요</p>
                </div>
              ) : (
                selectedSession.items.map((item) => (
                  <ItemCard key={item.id} item={item} sessionId={selectedSession.id} />
                ))
              )}
            </div>
          </>
        )}
      </div>

      {showSessionModal && (
        <AddSessionModal
          onAdd={handleAddSession}
          onClose={() => setShowSessionModal(false)}
        />
      )}
    </div>
  )
}
