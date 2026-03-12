'use client'

import { useState } from 'react'
import { ExternalLink, Plus, X, Newspaper } from 'lucide-react'
import { useNewsStore } from '@/store/newsStore'

export default function NewsPage() {
  const { links, addLink, deleteLink } = useNewsStore()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('')

  const categories = Array.from(new Set(links.map((l) => l.category)))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return
    addLink({ title: title.trim(), url: url.trim(), category: category.trim() || '기타' })
    setTitle('')
    setUrl('')
    setCategory('')
    setShowForm(false)
  }

  function getDomain(url: string) {
    try { return new URL(url).hostname.replace('www.', '') } catch { return url }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            📰 뉴스 & 링크
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            자주 보는 사이트를 모아서 확인하세요
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
        >
          <Plus size={15} />
          링크 추가
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-5 rounded-2xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              autoFocus
              type="text"
              placeholder="제목 (예: 네이버 증권)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
            <input
              type="url"
              placeholder="URL (https://...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
            <input
              type="text"
              placeholder="카테고리 (예: 경제/투자)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list="categories"
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
            <datalist id="categories">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2 rounded-xl text-sm"
                style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}>
                취소
              </button>
              <button type="submit"
                className="flex-1 py-2 rounded-xl text-sm font-medium"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                저장
              </button>
            </div>
          </form>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="text-center py-16">
          <Newspaper size={40} strokeWidth={1.2} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-4" />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>링크를 추가해보세요</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat}>
              <h2 className="text-xs font-semibold uppercase tracking-wide mb-3 px-1"
                style={{ color: 'var(--text-muted)' }}>
                {cat}
              </h2>
              <div className="space-y-2">
                {links.filter((l) => l.category === cat).map((link) => (
                  <div key={link.id}
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl group"
                    style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${getDomain(link.url)}&sz=32`}
                      alt=""
                      width={20}
                      height={20}
                      className="rounded flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {link.title}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {getDomain(link.url)}
                      </p>
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium flex-shrink-0 transition-all"
                      style={{ backgroundColor: 'var(--surface-2)', color: 'var(--accent)' }}
                    >
                      <ExternalLink size={13} />
                      열기
                    </a>
                    <button
                      onClick={() => deleteLink(link.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
