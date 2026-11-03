'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { createClient } from './supabase'
import { claimLocalData, clearLocalUserData } from './local-data-owner'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<{ error: string | null }>
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  /** True after the user arrived via a password-reset email link. */
  recoveryPending: boolean
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
}

// Set when a reset email is requested; the link must be opened in this same
// browser (PKCE), so seeing it after login means "show the new-password form".
// Works regardless of which allowed redirect URL Supabase lands on.
const RECOVERY_KEY = 'daily-password-recovery'
const RECOVERY_TTL_MS = 60 * 60 * 1000

function hasRecoveryFlag(): boolean {
  try {
    const at = Number(localStorage.getItem(RECOVERY_KEY))
    return Boolean(at) && Date.now() - at < RECOVERY_TTL_MS
  } catch {
    return false
  }
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [recoveryPending, setRecoveryPending] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const applySession = (session: Session | null) => {
      // Another account's local data is still in this browser: wipe it and
      // reload so stores start empty before any sync runs.
      if (session?.user && claimLocalData(session.user.id)) {
        window.location.reload()
        return
      }
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user && hasRecoveryFlag()) setRecoveryPending(true)
      setLoading(false)
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => applySession(session))
      .catch((e) => {
        // e.g. Supabase project paused/unreachable — show the login page
        // instead of an endless spinner.
        console.error('[Auth] getSession failed', e)
        setLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryPending(true)
      applySession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    return { error: error?.message ?? null }
  }

  const signInWithEmail = async (email: string, password: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    if (error) return { error: error.message }
    return { error: null }
  }

  const requestPasswordReset = async (email: string) => {
    const supabase = createClient()
    try {
      localStorage.setItem(RECOVERY_KEY, String(Date.now()))
    } catch {
      // without the flag the PASSWORD_RECOVERY event is the only trigger
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback`,
    })
    return { error: error?.message ?? null }
  }

  const updatePassword = async (password: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error: error.message }
    try {
      localStorage.removeItem(RECOVERY_KEY)
    } catch {}
    setRecoveryPending(false)
    return { error: null }
  }

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    // Don't leave this account's data behind for the next person on this browser.
    clearLocalUserData()
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        recoveryPending,
        requestPasswordReset,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
