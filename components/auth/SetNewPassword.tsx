'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

/** Shown by AuthGate after the user opened a password-reset email link. */
export default function SetNewPassword() {
  const { user, updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('두 비밀번호가 일치하지 않습니다.')
      return
    }
    setLoading(true)
    const result = await updatePassword(password)
    if (result.error) {
      const m = result.error.toLowerCase()
      setError(
        m.includes('different from the old')
          ? '이전과 다른 비밀번호를 입력해주세요.'
          : m.includes('weak') || m.includes('at least')
            ? '비밀번호가 너무 약합니다. 더 길고 복잡하게 정해주세요.'
            : result.error
      )
    }
    // on success AuthGate switches to the app automatically
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 shadow-lg"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            새 비밀번호 설정
          </h1>
          {user?.email && (
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              {user.email}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            placeholder="새 비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full py-3 px-4 rounded-xl text-sm outline-none"
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="새 비밀번호 확인"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full py-3 px-4 rounded-xl text-sm outline-none"
            style={inputStyle}
          />

          {error && (
            <p className="text-xs px-1" style={{ color: '#EF4444' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-medium text-sm text-white transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#F97316' }}
          >
            {loading ? '저장 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </div>
  )
}
