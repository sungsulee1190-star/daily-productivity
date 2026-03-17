import { create } from 'zustand'
import { createClient } from '@/lib/supabase'

export interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

interface NoteStore {
  notes: Note[]
  loading: boolean
  fetchNotes: (userId: string) => Promise<void>
  addNote: (userId: string, note: Pick<Note, 'title' | 'content'>) => Promise<void>
  updateNote: (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => Promise<void>
  deleteNote: (id: string) => Promise<void>
}

export const useNoteStore = create<NoteStore>((set) => ({
  notes: [],
  loading: false,

  fetchNotes: async (userId: string) => {
    set({ loading: true })
    const supabase = createClient()
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    const notes: Note[] = (data ?? []).map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      createdAt: n.created_at,
      updatedAt: n.updated_at,
    }))

    set({ notes, loading: false })
  },

  addNote: async (userId: string, note: Pick<Note, 'title' | 'content'>) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('notes')
      .insert({ user_id: userId, title: note.title, content: note.content })
      .select()
      .single()

    if (error || !data) return

    set((state) => ({
      notes: [
        {
          id: data.id,
          title: data.title,
          content: data.content,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
        ...state.notes,
      ],
    }))
  },

  updateNote: async (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('notes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) return

    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id
          ? { ...n, title: data.title, content: data.content, updatedAt: data.updated_at }
          : n
      ),
    }))
  },

  deleteNote: async (id: string) => {
    const supabase = createClient()
    await supabase.from('notes').delete().eq('id', id)
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
    }))
  },
}))
