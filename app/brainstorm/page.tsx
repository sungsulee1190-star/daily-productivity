'use client'

import { useState } from 'react'
import { Plus, X, Lightbulb } from 'lucide-react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: string
}

interface NoteStore {
  notes: Note[]
  addNote: (title: string, content: string, tags: string[]) => void
  deleteNote: (id: string) => void
  updateNote: (id: string, updates: Partial<Note>) => void
}

const useNoteStore = create<NoteStore>()(
  persist(
    (set) => ({
      notes: [],
      addNote: (title, content, tags) =>
        set((s) => ({
          notes: [
            ...s.notes,
            { id: crypto.randomUUID(), title, content, tags, createdAt: new Date().toISOString() },
          ],
        })),
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
      updateNote: (id, updates) =>
        set((s) => ({ notes: s.notes.map((n) => n.id === id ? { ...n, ...updates } : n) })),
    }),
    { name: 'daily-productivity-notes' }
  )
)

export default function BrainstormPage() {
  const { notes, addNote, deleteNote } = useNoteStore()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [search, setSearch] = useState('')

  const filtered = notes.filter(
    (n) =>
      !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    addNote(title.trim(), content, tags)
    setTitle('')
    setContent('')
    setTags([])
    setShowForm(false)
  }

  function handleAddTag() {
    const t = tagInput.trim().replace(/^#/, '')
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            💡 브레인스토밍
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            아이디어와 메모를 자유롭게 기록하세요
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium"
          style={{ backgroundColor: '#F59E0B', color: 'white' }}
        >
          <Plus size={15} />
          새 메모
        </button>
      </div>

      {/* 검색 */}
      <input
        type="text"
        placeholder="메모 검색..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-6"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
        }}
      />

      {/* 폼 */}
      {showForm && (
        <div className="mb-6 p-5 rounded-2xl"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              autoFocus
              type="text"
              placeholder="제목..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none font-medium"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
            <textarea
              placeholder="내용을 자유롭게 작성하세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="#태그"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              <button type="button" onClick={handleAddTag}
                className="px-3 py-2 rounded-xl text-sm"
                style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                <Plus size={14} />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {tags.map((t) => (
                  <span key={t} onClick={() => setTags(tags.filter((x) => x !== t))}
                    className="text-xs px-2.5 py-1 rounded-full cursor-pointer"
                    style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                    #{t} ×
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2 rounded-xl text-sm"
                style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}>
                취소
              </button>
              <button type="submit"
                className="flex-1 py-2 rounded-xl text-sm font-medium"
                style={{ backgroundColor: '#F59E0B', color: 'white' }}>
                저장
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 메모 그리드 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Lightbulb size={40} strokeWidth={1.2} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-4" />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            아이디어를 기록해보세요
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((note) => (
            <div key={note.id}
              className="p-4 rounded-2xl group relative"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <button
                onClick={() => deleteNote(note.id)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
              <h3 className="text-sm font-semibold mb-2 pr-6" style={{ color: 'var(--text-primary)' }}>
                {note.title}
              </h3>
              {note.content && (
                <p className="text-xs leading-relaxed whitespace-pre-wrap mb-3"
                  style={{ color: 'var(--text-secondary)' }}>
                  {note.content.length > 200 ? note.content.slice(0, 200) + '...' : note.content}
                </p>
              )}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex gap-1 flex-wrap">
                  {note.tags.map((t) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                      #{t}
                    </span>
                  ))}
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {format(new Date(note.createdAt), 'M/d', { locale: ko })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
