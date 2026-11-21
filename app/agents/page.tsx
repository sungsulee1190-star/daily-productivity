'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import AuthGate from '@/components/auth/AuthGate'
import DeploymentLinks from '@/components/DeploymentLinks'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { useTodoStore } from '@/store/todoStore'

type Project = Pick<Database['public']['Tables']['projects']['Row'], 'id' | 'name' | 'status' | 'updated_at' | 'repo_url' | 'notes'>
type Todo = Pick<Database['public']['Tables']['todos']['Row'], 'id' | 'title' | 'kanban_status' | 'due_date' | 'memo' | 'tags' | 'created_at'>

const projectStatus = { active: '진행 중', paused: '대기', done: '완료' }
const todoStatus = { backlog: '대기', inprogress: '진행 중', hold: '보류', done: '완료' }

function githubUrl(value: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.origin === 'https://github.com' && !url.username && !url.password ? url.href : null
  } catch {
    return null
  }
}

async function readRows<T extends { id: string }>(
  readPage: (after: string | undefined, limit: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
) {
  const rows: T[] = []
  const pageSize = 500
  let after: string | undefined

  for (;;) {
    const { data, error } = await readPage(after, pageSize)
    if (error || !data) throw new Error('Board query failed')
    rows.push(...data)
    if (data.length < pageSize) return rows
    after = data[data.length - 1].id
  }
}

function AgentsBoard({ userId }: { userId: string }) {
  const { signOut } = useAuth()
  const [board, setBoard] = useState<{ projects: Project[]; todos: Todo[]; checkedAt: string }>()
  const [selectedId, setSelectedId] = useState<string>()
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState(false)
  const request = useRef({ version: 0 })
  const setActiveClip = useTodoStore(state => state.setActiveClip)

  const load = useCallback(async () => {
    const pending = request.current
    const latest = ++pending.version
    try {
      const client = createClient()
      const [projects, todos] = await Promise.all([
        readRows((after, limit) => {
          const query = client.from('projects').select('id,name,status,updated_at,repo_url,notes')
            .eq('user_id', userId).order('id').limit(limit)
          return after ? query.gt('id', after) : query
        }),
        readRows((after, limit) => {
          const query = client.from('todos').select('id,title,kanban_status,due_date,memo,tags,created_at')
            .eq('user_id', userId).eq('clip', 'work').eq('completed', false).order('id').limit(limit)
          return after ? query.gt('id', after) : query
        }),
      ])

      if (latest === pending.version) {
        projects.sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
        todos.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
        setBoard({ projects, todos, checkedAt: new Date().toLocaleString('ko-KR') })
        setError(false)
      }
    } catch {
      if (latest === pending.version) setError(true)
    } finally {
      if (latest === pending.version) setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    const pending = request.current
    const client = createClient()
    const filter = `user_id=eq.${userId}`
    const channel = client.channel(`agent-board-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos', filter }, load)
      .subscribe()

    void load()
    window.addEventListener('focus', load)
    return () => {
      pending.version++
      window.removeEventListener('focus', load)
      void client.removeChannel(channel)
    }
  }, [load, userId])

  const projects = board?.projects ?? []
  const project = projects.find(item => item.id === selectedId)
  const projectTag = project ? `project:${project.id}` : null
  const todos = (board?.todos ?? []).filter(todo => !projectTag || todo.tags?.includes(projectTag))

  async function handleSignOut() {
    setSigningOut(true)
    setSignOutError(false)
    try {
      await signOut()
    } catch {
      setSigningOut(false)
      setSignOutError(true)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7 px-4 py-6 text-[var(--text-primary)] md:px-8">
      <header className="border-b border-[var(--border)] pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">에이전트 관리</h1>
          <div className="flex items-center gap-3 text-sm">
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-2 disabled:opacity-60"
              disabled={loading}
              onClick={() => { setLoading(true); void load() }}
            >
              {loading ? '불러오는 중…' : '새로고침'}
            </button>
            <button type="button" className="underline disabled:opacity-60" disabled={signingOut} onClick={handleSignOut}>
              {signingOut ? '로그아웃 중…' : '로그아웃'}
            </button>
          </div>
        </div>
        <nav aria-label="에이전트 관리 항목" className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--text-secondary)]">
          <a href="#projects" className="hover:underline">프로젝트</a>
          <a href="#todos" className="hover:underline">후속 할 일</a>
          <a href="#deployments" className="hover:underline">배포 앱</a>
        </nav>
      </header>

      {signOutError && <p role="alert" className="text-sm">로그아웃하지 못했습니다. 다시 시도해 주세요.</p>}
      {error && (
        <p role="alert" className="border-l-4 border-amber-600 pl-3 text-sm">
          {board ? '새로고침에 실패했습니다. 마지막으로 조회한 내용을 표시합니다.' : '프로젝트와 할 일을 불러오지 못했습니다. 새로고침으로 다시 시도해 주세요.'}
        </p>
      )}

      <section id="projects" aria-labelledby="projects-heading" aria-busy={loading} className="scroll-mt-4">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="projects-heading" className="text-lg font-semibold">프로젝트</h2>
          {board && <p role="status" className="text-xs text-[var(--text-secondary)]">DB 조회 {board.checkedAt}</p>}
        </div>
        {projects.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-2)] text-xs text-[var(--text-secondary)]">
                <tr>
                  <th scope="col" className="px-3 py-2.5">이름</th>
                  <th scope="col" className="px-3 py-2.5">상태</th>
                  <th scope="col" className="px-3 py-2.5">최근 수정</th>
                  <th scope="col" className="px-3 py-2.5">저장소</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(item => {
                  const repository = githubUrl(item.repo_url)
                  return (
                    <tr key={item.id} className="border-t border-[var(--border)]" style={project?.id === item.id ? { backgroundColor: 'var(--accent-light)' } : undefined}>
                      <th scope="row" className="px-3 py-2.5 font-medium">
                        <button type="button" aria-pressed={project?.id === item.id} onClick={() => setSelectedId(item.id)} className="text-left underline">
                          {item.name}
                        </button>
                      </th>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="rounded border border-[var(--border)] px-1.5 py-0.5 text-xs">
                          {projectStatus[item.status]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">{new Date(item.updated_at).toLocaleDateString('ko-KR')}</td>
                      <td className="px-3 py-2.5">
                        {repository ? <a href={repository} target="_blank" rel="noreferrer" className="underline">GitHub</a> : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {board && projects.length === 0 && <p className="text-sm">등록된 프로젝트가 없습니다.</p>}
        {project && (
          <div className="mt-4 border-l-2 border-[var(--border)] pl-3">
            <h3 className="font-medium">{project.name} · 이어가기</h3>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm">{project.notes || '기록된 메모가 없습니다.'}</p>
          </div>
        )}
      </section>

      <section id="todos" aria-labelledby="todos-heading" aria-busy={loading} className="scroll-mt-4">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="todos-heading" className="text-lg font-semibold">
            {project ? `${project.name}의 후속 할 일` : '미완료 업무 할 일'}{board && ` · ${todos.length}건`}
          </h2>
          <div className="flex gap-4 text-sm">
            {project && <button type="button" onClick={() => setSelectedId(undefined)} className="underline">전체 업무 보기</button>}
            <Link href="/todo/all" onClick={() => setActiveClip('work')} className="underline">할 일 관리</Link>
          </div>
        </div>
        {board && todos.length === 0 && <p className="text-sm">미완료 할 일이 없습니다.</p>}
        {todos.length > 0 && (
          <ul className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            {todos.map(todo => (
              <li key={todo.id} className="px-3 py-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-sm font-medium">{todo.title}</span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {todoStatus[todo.kanban_status]}{todo.due_date && ` · ${todo.due_date}`}
                  </span>
                </div>
                {todo.memo && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{todo.memo}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <DeploymentLinks showQuickLinks />
    </div>
  )
}

export default function AgentsPage() {
  const { user } = useAuth()
  return (
    <AuthGate>
      {user && <AgentsBoard key={user.id} userId={user.id} />}
    </AuthGate>
  )
}
