'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Check, Trash2 } from 'lucide-react'

const OPENAI_KEY_STORAGE = 'openai-api-key'

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasKey, setHasKey] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(OPENAI_KEY_STORAGE)
    if (stored) {
      setHasKey(true)
      setApiKey(stored)
    }
  }, [])

  const handleSave = () => {
    if (!apiKey.trim()) return
    localStorage.setItem(OPENAI_KEY_STORAGE, apiKey.trim())
    setHasKey(true)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDelete = () => {
    localStorage.removeItem(OPENAI_KEY_STORAGE)
    setApiKey('')
    setHasKey(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>설정</h1>

      {/* OpenAI API Key */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            OpenAI API 키
          </h2>
          {hasKey && (
            <span
              className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}
            >
              <Check size={11} />
              연결됨
            </span>
          )}
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          아이디어를 프로젝트로 변환할 때 사용됩니다
        </p>
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none pr-10"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            >
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5"
            style={saved
              ? { backgroundColor: '#dcfce7', color: '#16a34a' }
              : { backgroundColor: 'var(--accent)', color: 'white' }
            }
          >
            {saved ? <><Check size={14} /> 저장됨</> : '저장'}
          </button>
          {hasKey && (
            <button
              onClick={handleDelete}
              className="p-2.5 rounded-xl transition-all"
              style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
              title="키 삭제"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          * API 키는 브라우저 로컬 스토리지에만 저장되며 서버로 전송되지 않습니다.
        </p>
      </div>

      {/* Google Calendar */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
          Google Calendar 연동
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Google Calendar와 연동하면 일정을 앱에서 함께 확인할 수 있습니다.
        </p>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          disabled
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google로 연동하기 (준비 중)
        </button>
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          * Google Calendar 연동은 P1 기능으로 추후 업데이트될 예정입니다.
        </p>
      </div>
    </div>
  )
}
