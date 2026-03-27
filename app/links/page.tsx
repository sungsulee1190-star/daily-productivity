'use client'

import { useState } from 'react'
import { Plus, ExternalLink, Pencil, Trash2, X, Check } from 'lucide-react'
import { useLinkStore, QuickLink } from '@/store/linkStore'

const EMOJI_OPTIONS = ['🔗', '📊', '📄', '📁', '🌐', '📧', '📅', '💬', '🎯', '⚙️', '📝', '🔧']

interface AddLinkFormProps {
  onAdd: (link: { title: string; url: string; emoji: string }) => void
  onCancel: () => void
}

function AddLinkForm({ onAdd, onCancel }: AddLinkFormProps) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [emoji, setEmoji] = useState('🔗')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return
    const finalUrl = url.startsWith('http') ? url : `https://${url}`
    onAdd({ title: title.trim(), url: finalUrl, emoji })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-4 space-y-3 mb-6"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>링크 추가</h3>
        <button type="button" onClick={onCancel} style={{ color: 'var(--text-muted)' }}>
          <X size={16} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {EMOJI_OPTIONS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setEmoji(e)}
            className="text-base p-1.5 rounded-lg transition-all"
            style={emoji === e ? { backgroundColor: 'var(--accent-light)' } : {}}
          >{e}</button>
        ))}
      </div>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="링크 이름"
        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
        style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="URL (예: sheets.google.com)"
        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
        style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      />
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

interface LinkCardProps {
  link: QuickLink
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Omit<QuickLink, 'id'>>) => void
}

function LinkCard({ link, onDelete, onUpdate }: LinkCardProps) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(link.title)
  const [editUrl, setEditUrl] = useState(link.url)
  const [editEmoji, setEditEmoji] = useState(link.emoji)

  const handleSave = () => {
    if (!editTitle.trim() || !editUrl.trim()) return
    const finalUrl = editUrl.startsWith('http') ? editUrl : `https://${editUrl}`
    onUpdate(link.id, { title: editTitle.trim(), url: finalUrl, emoji: editEmoji })
    setEditing(false)
  }

  if (editing) {
    return (
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--accent)', boxShadow: '0 0 0 2px var(--accent-light)' }}
      >
        <div className="flex flex-wrap gap-1">
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEditEmoji(e)}
              className="text-base p-1.5 rounded-lg transition-all"
              style={editEmoji === e ? { backgroundColor: 'var(--accent-light)' } : {}}
            >{e}</button>
          ))}
        </div>
        <input
          autoFocus
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full rounded-xl px-3 py-2 text-sm outline-none"
          style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
        <input
          value={editUrl}
          onChange={(e) => setEditUrl(e.target.value)}
          className="w-full rounded-xl px-3 py-2 text-sm outline-none"
          style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 py-1.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          >
            <Check size={12} />
            저장
          </button>
          <button
            onClick={() => { setEditing(false); setEditTitle(link.title); setEditUrl(link.url); setEditEmoji(link.emoji) }}
            className="flex-1 py-1.5 rounded-xl text-xs font-medium"
            style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
          >취소</button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="group relative rounded-2xl p-4 transition-all"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-3"
      >
        <span className="text-2xl flex-shrink-0 mt-0.5">{link.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{link.title}</p>
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
            {link.url.replace(/^https?:\/\//, '')}
          </p>
        </div>
        <ExternalLink size={13} className="flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
      </a>
      {/* Hover actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.preventDefault(); setEditing(true) }}
          className="p-1.5 rounded-lg transition-all"
          style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-muted)' }}
          title="수정"
        >
          <Pencil size={11} />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); onDelete(link.id) }}
          className="p-1.5 rounded-lg transition-all"
          style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
          title="삭제"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}

export default function LinksPage() {
  const { links, addLink, updateLink, deleteLink } = useLinkStore()
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="flex-1 min-w-0 p-4 md:p-6 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>🔗 빠른 링크</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>자주 사용하는 링크를 모아보세요</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
        >
          <Plus size={15} />
          링크 추가
        </button>
      </div>

      {showForm && (
        <AddLinkForm
          onAdd={(link) => { addLink(link); setShowForm(false) }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {links.length === 0 && !showForm ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ backgroundColor: 'var(--surface)', border: '1px dashed var(--border)' }}
        >
          <p className="text-2xl mb-2">🔗</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>링크를 추가해보세요</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          >
            첫 번째 링크 추가
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {links.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              onDelete={deleteLink}
              onUpdate={updateLink}
            />
          ))}
        </div>
      )}
    </div>
  )
}
