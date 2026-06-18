'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useTodoStore } from '@/store/todoStore'
import { useHabitStore } from '@/store/habitStore'
import { useProjectStore } from '@/store/projectStore'
import { useNoteStore } from '@/store/noteStore'
import { useIdeaStore } from '@/store/ideaStore'
import { useLinkStore } from '@/store/linkStore'
import { useTrackerStore } from '@/store/trackerStore'
import LoginPage from './LoginPage'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const { fetchTodos } = useTodoStore()
  const { fetchHabits } = useHabitStore()
  const { fetchProjects } = useProjectStore()
  const { fetchNotes } = useNoteStore()
  const { fetchIdeas } = useIdeaStore()
  const { fetchLinks } = useLinkStore()
  const { fetchSessions } = useTrackerStore()

  useEffect(() => {
    if (user) {
      fetchTodos(user.id)
      fetchHabits(user.id)
      fetchProjects(user.id)
      fetchNotes(user.id)
      fetchIdeas(user.id)
      fetchLinks(user.id)
      fetchSessions(user.id)
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
