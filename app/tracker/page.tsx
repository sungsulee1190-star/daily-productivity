'use client'

import { useState, useEffect } from 'react'
import { Plus, X, ChevronDown, ChevronUp, Trash2, Clock, CheckCircle2, AlertCircle, Circle, Pencil, Calendar, User, Tag } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useTrackerStore, TrackerItem, TrackerSession, TrackerStatus } from '@/store/trackerStore'
import { useAuth } from '@/lib/auth-context'
import { formatDate, getDaysOverdue } from '@/lib/utils'

const STATUS_CONFIG: Record<TrackerStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:     { label: '대기중',  color: '#6b7280', bg: '#f3f4f6', icon: Circle },
  in_progress: { label: '진행중',  color: '#d97706', bg: '#fef3c7', icon: Clock },
  done:        { label: '완료',    color: '#16a34a', bg: '#dcfce7', icon: CheckCircle2 },
  blocked:     { label: '블로킹',  color: '#dc2626', bg: '#fee2e2', icon: AlertCircle },
}

function StatusBadge({ status }: { status: TrackerStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const Icon = cfg.icon
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <Icon size={11} strokeWidth={2.2} />
      {cfg.label}
    </span>
  )
}

interface AddSessionModalProps {
  onAdd: (name: string, month: string, startDate?: string, endDate?: string) => void
  onClose: () => void
}

function AddSessionModal({ onAdd, onClose }: AddSessionModalProps) {
  const [name, setName] = useState('')
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name.trim(), month, startDate || undefined, endDate || undefined)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>새 프로젝트(세션) 만들기</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>프로젝트 이름</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 26.6월 중등 운영 계획_PNM"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>기준 월</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>시작일 (선택)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>종료/마감일 (선택)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
            >취소</button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-medium shadow-sm"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >만들기</button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface EditSessionModalProps {
  session: TrackerSession
  onUpdate: (updates: Partial<TrackerSession>) => void
  onClose: () => void
}

function EditSessionModal({ session, onUpdate, onClose }: EditSessionModalProps) {
  const [name, setName] = useState(session.name)
  const [month, setMonth] = useState(session.month)
  const [startDate, setStartDate] = useState(session.startDate ?? '')
  const [endDate, setEndDate] = useState(session.endDate ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onUpdate({
      name: name.trim(),
      month,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>프로젝트 정보 수정</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>프로젝트 이름</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>기준 월</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>종료/마감일</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
            >취소</button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-medium shadow-sm"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >수정 저장</button>
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
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [tags, setTags] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<TrackerStatus>('in_progress')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({
      title: title.trim(),
      status,
      assignee: assignee.trim() || undefined,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
      tags: tags.trim() ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-5 space-y-3.5 mb-4 shadow-sm"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: 'var(--border)' }}>
        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>새 하위 태스크 추가</h4>
        <button type="button" onClick={onCancel} style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
      </div>

      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="태스크 제목 (예: PNM_중등 운영 계획 수립)"
        className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
        style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <input
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          placeholder="담당자 (예: 환홍 선임)"
          className="rounded-xl px-3 py-2 text-sm outline-none"
          style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            title="시작일"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            title="마감일"
          />
        </div>
      </div>

      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="태그 (쉼표로 구분, 예: 기획, 보고, 오세아)"
        className="w-full rounded-xl px-3 py-2 text-sm outline-none"
        style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      />

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="상세 내용 및 비고 (선택)"
        rows={2}
        className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none"
        style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      />

      <div>
        <label className="block text-xs mb-1 font-medium" style={{ color: 'var(--text-muted)' }}>초기 상태</label>
        <div className="flex gap-1.5 flex-wrap">
          {(Object.entries(STATUS_CONFIG) as [TrackerStatus, typeof STATUS_CONFIG[TrackerStatus]][]).map(([key, cfg]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={status === key
                ? { backgroundColor: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.color}` }
                : { backgroundColor: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
              }
            >{cfg.label}</button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium"
          style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
        >취소</button>
        <button
          type="submit"
          className="flex-1 py-2.5 rounded-xl text-sm font-medium shadow-sm"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
        >태스크 등록</button>
      </div>
    </form>
  )
}

interface EditItemModalProps {
  item: TrackerItem
  onSave: (updates: Partial<TrackerItem>) => void
  onClose: () => void
}

function EditItemModal({ item, onSave, onClose }: EditItemModalProps) {
  const [title, setTitle] = useState(item.title)
  const [assignee, setAssignee] = useState(item.assignee ?? '')
  const [startDate, setStartDate] = useState(item.startDate ?? '')
  const [dueDate, setDueDate] = useState(item.dueDate ?? '')
  const [tags, setTags] = useState(item.tags ? item.tags.join(', ') : '')
  const [notes, setNotes] = useState(item.notes ?? '')
  const [status, setStatus] = useState<TrackerStatus>(item.status)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      status,
      assignee: assignee.trim() || undefined,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
      tags: tags.trim() ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>하위 태스크 수정</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>태스크 제목</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>담당자</label>
            <input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="예: 환홍 선임"
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>마감일</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>진행 상태</label>
            <div className="flex gap-1.5 flex-wrap">
              {(Object.entries(STATUS_CONFIG) as [TrackerStatus, typeof STATUS_CONFIG[TrackerStatus]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatus(key)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={status === key
                    ? { backgroundColor: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.color}` }
                    : { backgroundColor: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                  }
                >{cfg.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>태그 (쉼표 구분)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>메모 및 비고</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
            >취소</button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-medium shadow-sm"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >수정 완료</button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface ItemCardProps {
  item: TrackerItem
  sessionId: string
}

function ItemCard({ item, sessionId }: ItemCardProps) {
  const { updateItem, deleteItem, addHistory } = useTrackerStore()
  const [expanded, setExpanded] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)

  const handleStatusChange = (status: TrackerStatus) => {
    updateItem(sessionId, item.id, { status })
  }

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return
    addHistory(sessionId, item.id, newNote.trim())
    setNewNote('')
  }

  const daysOverdue = item.dueDate && item.status !== 'done' ? getDaysOverdue(item.dueDate) : 0

  const dateRangeStr = item.startDate && item.dueDate
    ? `${formatDate(item.startDate)} ~ ${formatDate(item.dueDate)}`
    : item.dueDate
    ? `${formatDate(item.dueDate)} 마감`
    : item.startDate
    ? `${formatDate(item.startDate)} 시작`
    : null

  return (
    <div
      className="rounded-2xl p-4 transition-all shadow-sm group"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <StatusBadge status={item.status} />

            {item.assignee && (
              <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-medium"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                <User size={11} />
                {item.assignee}
              </span>
            )}

            {dateRangeStr && (
              <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-medium"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                <Calendar size={11} />
                {dateRangeStr}
              </span>
            )}

            {daysOverdue > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                D+{daysOverdue}
              </span>
            )}
          </div>

          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {item.title}
          </p>

          {item.tags && item.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-md font-medium"
                  style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setShowEditModal(true)}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="하위 태스크 수정"
            style={{ color: 'var(--text-muted)' }}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => deleteItem(sessionId, item.id)}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="삭제"
            style={{ color: '#EF4444' }}
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3.5 space-y-3 border-t pt-3.5" style={{ borderColor: 'var(--border)' }}>
          {/* Status change buttons */}
          <div>
            <p className="text-xs mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>상태 변경</p>
            <div className="flex gap-1.5 flex-wrap">
              {(Object.entries(STATUS_CONFIG) as [TrackerStatus, typeof STATUS_CONFIG[TrackerStatus]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleStatusChange(key)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={item.status === key
                    ? { backgroundColor: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.color}` }
                    : { backgroundColor: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                  }
                >{cfg.label}</button>
              ))}
            </div>
          </div>

          {/* Notes */}
          {item.notes && (
            <p className="text-xs leading-relaxed px-3 py-2 rounded-xl whitespace-pre-wrap"
              style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}>
              {item.notes}
            </p>
          )}

          {/* Add history note */}
          <form onSubmit={handleNoteSubmit} className="flex gap-2">
            <input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="히스토리 메모 추가..."
              className="flex-1 rounded-xl px-3 py-2 text-xs outline-none"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl text-xs font-medium"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >추가</button>
          </form>

          {/* History list */}
          {item.history && item.history.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>히스토리</p>
              {item.history.slice().reverse().map((h, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs rounded-xl px-3 py-2"
                  style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  <span className="font-mono" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{h.date}</span>
                  <span className="flex-1" style={{ color: 'var(--text-secondary)' }}>{h.note}</span>
                  <StatusBadge status={h.status as TrackerStatus} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showEditModal && (
        <EditItemModal
          item={item}
          onSave={(updates) => updateItem(sessionId, item.id, updates)}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  )
}

export default function TrackerPage() {
  const { sessions, addSession, updateSession, deleteSession, addItem, fetchSessions } = useTrackerStore()
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [showEditSessionModal, setShowEditSessionModal] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) fetchSessions(user.id)
  }, [user?.id])

  // If no session selected, select the first one by default if available
  useEffect(() => {
    if (!selectedSessionId && sessions.length > 0) {
      setSelectedSessionId(sessions[0].id)
    }
  }, [sessions, selectedSessionId])

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? null

  const handleAddSession = (name: string, month: string, startDate?: string, endDate?: string) => {
    const id = addSession(name, month, startDate, endDate)
    setSelectedSessionId(id)
  }

  const stats = selectedSession ? {
    total: selectedSession.items.length,
    done: selectedSession.items.filter((i) => i.status === 'done').length,
    inProgress: selectedSession.items.filter((i) => i.status === 'in_progress').length,
    blocked: selectedSession.items.filter((i) => i.status === 'blocked').length,
    pending: selectedSession.items.filter((i) => i.status === 'pending').length,
  } : null

  const sessionDateRange = selectedSession && selectedSession.startDate && selectedSession.endDate
    ? `${formatDate(selectedSession.startDate)} ~ ${formatDate(selectedSession.endDate)}`
    : selectedSession?.endDate
    ? `${formatDate(selectedSession.endDate)} 마감`
    : selectedSession?.startDate
    ? `${formatDate(selectedSession.startDate)} 시작`
    : null

  const sessionDaysOverdue = selectedSession?.endDate ? getDaysOverdue(selectedSession.endDate) : 0

  return (
    <div className="flex-1 min-w-0 flex flex-col md:flex-row h-full" style={{ minHeight: 0 }}>
      {/* Left panel - session list */}
      <div
        className="w-full md:w-72 flex-shrink-0 flex flex-col border-b md:border-b-0 md:border-r"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
      >
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <h1 className="text-base font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
            📋 업무 F/U 트래커
          </h1>
          <button
            onClick={() => setShowSessionModal(true)}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl font-medium shadow-sm"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          >
            <Plus size={13} />
            새 세션
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>세션이 없습니다</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>새 세션을 만들어보세요</p>
            </div>
          ) : (
            sessions.map((sess) => {
              const isSelected = selectedSessionId === sess.id
              const doneCount = sess.items.filter((i) => i.status === 'done').length
              const inProgressCount = sess.items.filter((i) => i.status === 'in_progress').length
              const progressPct = sess.items.length > 0 ? Math.round((doneCount / sess.items.length) * 100) : 0

              return (
                <div
                  key={sess.id}
                  className="flex flex-col rounded-xl px-3 py-2.5 cursor-pointer group transition-all"
                  style={isSelected
                    ? { backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent)' }
                    : { color: 'var(--text-secondary)' }
                  }
                  onClick={() => setSelectedSessionId(sess.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold truncate" style={{ color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {sess.name}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`'${sess.name}' 세션을 삭제하시겠습니까?`)) {
                          deleteSession(sess.id)
                          if (selectedSessionId === sess.id) setSelectedSessionId(null)
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-opacity"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs mt-1" style={{ color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }}>
                    <span>{sess.month} · {sess.items.length}개</span>
                    {sess.items.length > 0 && (
                      <span className="font-semibold">{progressPct}%</span>
                    )}
                  </div>

                  {/* 세션 간이 프로그레스 바 */}
                  {sess.items.length > 0 && (
                    <div className="w-full h-1 rounded-full mt-1.5 overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${progressPct}%`,
                          backgroundColor: isSelected ? 'var(--accent)' : '#16a34a',
                        }}
                      />
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Right panel - items */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {!selectedSession ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>세션을 선택하거나 새 세션을 만드세요</p>
            </div>
          </div>
        ) : (
          <>
            {/* Session header */}
            <div className="p-5 border-b flex-shrink-0" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                      {selectedSession.name}
                    </h2>
                    <button
                      onClick={() => setShowEditSessionModal(true)}
                      className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      title="프로젝트 정보 수정"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <Pencil size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-1 flex-wrap text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>{selectedSession.month}</span>
                    {sessionDateRange && (
                      <span className="flex items-center gap-1 font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                        <Calendar size={11} />
                        기간: {sessionDateRange}
                      </span>
                    )}
                    {sessionDaysOverdue > 0 && (
                      <span className="font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                        D+{sessionDaysOverdue}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setShowAddItem((v) => !v)}
                  className="flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl font-semibold shadow-sm flex-shrink-0"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                >
                  <Plus size={14} strokeWidth={2.2} />
                  항목 추가
                </button>
              </div>

              {/* Progress and statistics */}
              {stats && stats.total > 0 && (
                <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between gap-4 text-xs mb-2 flex-wrap">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>전체 {stats.total}개</span>
                      <span className="font-semibold" style={{ color: '#16a34a' }}>완료 {stats.done}개</span>
                      <span className="font-semibold" style={{ color: '#d97706' }}>진행중 {stats.inProgress}개</span>
                      {stats.blocked > 0 && <span className="font-semibold" style={{ color: '#dc2626' }}>블로킹 {stats.blocked}개</span>}
                      {stats.pending > 0 && <span className="font-semibold" style={{ color: '#6b7280' }}>대기 {stats.pending}개</span>}
                    </div>
                    <span className="font-bold text-sm" style={{ color: 'var(--accent)' }}>
                      진행률 {Math.round((stats.done / stats.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: 'var(--bg)' }}>
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(stats.done / stats.total) * 100}%`,
                        backgroundColor: stats.done === stats.total ? '#16a34a' : 'var(--accent)',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
              {showAddItem && (
                <AddItemForm
                  onAdd={(item) => { addItem(selectedSession.id, item); setShowAddItem(false) }}
                  onCancel={() => setShowAddItem(false)}
                />
              )}

              {selectedSession.items.length === 0 && !showAddItem ? (
                <div
                  className="rounded-2xl p-12 text-center"
                  style={{ backgroundColor: 'var(--surface)', border: '1.5px dashed var(--border)' }}
                >
                  <p className="text-3xl mb-2">📝</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>등록된 항목이 없습니다</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>+ 항목 추가 버튼을 눌러 새 태스크를 등록해보세요</p>
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

      {showEditSessionModal && selectedSession && (
        <EditSessionModal
          session={selectedSession}
          onUpdate={(updates) => updateSession(selectedSession.id, updates)}
          onClose={() => setShowEditSessionModal(false)}
        />
      )}
    </div>
  )
}
