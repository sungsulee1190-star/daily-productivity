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
import { useRoutineStore } from '@/store/routineStore'

/**
 * Seeds every domain store's `userId` and pulls the user's rows from Supabase
 * on login. Mounted once in the root layout so sync works on every route, not
 * just the home page (`userId` is intentionally not persisted — see P5).
 */
export default function SyncBoot() {
  const { user } = useAuth()
  const { fetchTodos } = useTodoStore()
  const { fetchHabits } = useHabitStore()
  const { fetchProjects } = useProjectStore()
  const { fetchNotes } = useNoteStore()
  const { fetchIdeas } = useIdeaStore()
  const { fetchLinks } = useLinkStore()
  const { fetchSessions } = useTrackerStore()
  const { fetchRoutines } = useRoutineStore()

  useEffect(() => {
    if (!user?.id) return
    fetchTodos(user.id)
    fetchHabits(user.id)
    fetchProjects(user.id)
    fetchNotes(user.id)
    fetchIdeas(user.id)
    fetchLinks(user.id)
    fetchSessions(user.id)
    fetchRoutines(user.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  return null
}
