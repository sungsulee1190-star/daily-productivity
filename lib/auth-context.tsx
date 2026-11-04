'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { createClient } from './supabase'

export const WORKSPACE_AUTO_EMAIL =
  process.env.NEXT_PUBLIC_WORKSPACE_EMAIL || 'peter.workspace@daily-productivity.app'
export const WORKSPACE_AUTO_PASSWORD =
  process.env.NEXT_PUBLIC_WORKSPACE_KEY || 'HansolDaily!2026#PeterWorkspace'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const ensureWorkspaceSession = async () => {
      const {
        data: { session: existingSession },
      } = await supabase.auth.getSession()

      if (existingSession?.user) {
        setSession(existingSession)
        setUser(existingSession.user)
        setLoading(false)
        return
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: WORKSPACE_AUTO_EMAIL,
        password: WORKSPACE_AUTO_PASSWORD,
      })

      if (!signInError && signInData.session) {
        setSession(signInData.session)
        setUser(signInData.user)
        setLoading(false)
        return
      }

      const { data: signUpData } = await supabase.auth.signUp({
        email: WORKSPACE_AUTO_EMAIL,
        password: WORKSPACE_AUTO_PASSWORD,
      })

      if (signUpData.session) {
        setSession(signUpData.session)
        setUser(signUpData.user)
      }
      setLoading(false)
    }

    void ensureWorkspaceSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
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

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}
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
