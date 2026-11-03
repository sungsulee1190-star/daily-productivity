'use client'

import { useAuth } from '@/lib/auth-context'
import LoginPage from './LoginPage'
import SetNewPassword from './SetNewPassword'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, recoveryPending } = useAuth()

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

  if (recoveryPending) {
    return <SetNewPassword />
  }

  return <>{children}</>
}
