'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useTodoStore } from '@/store/todoStore'
import LoginPage from './LoginPage'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const { fetchTodos } = useTodoStore()

  useEffect(() => {
    if (user) {
      fetchTodos(user.id)
    }
  }, [user?.id])

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg)' }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#F97316', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return <>{children}</>
}
