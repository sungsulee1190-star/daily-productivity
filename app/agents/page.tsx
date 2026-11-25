'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import AuthGate from '@/components/auth/AuthGate'
import DeploymentLinks from '@/components/DeploymentLinks'
import { useAuth } from '@/lib/auth-context'
import { createClient } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Project = Pick<Database['public']['Tables']['projects']['Row'], 'id' | 'name' | 'status' | 'updated_at' | 'repo_url' | 'notes'>
const statusLabel = { active: '진행 중', paused: '대기', done: '완료' }
const agents = [
  { id: 'hermes', name: 'Hermes', role: '기록과 업무 인계' },
  { id: 'codex', name: 'Codex', role: '기능 구현과 검증' },
  { id: 'claude', name: 'Claude', role: '자료 정리와 설계' },
  { id: 'antigravity', name: 'Antigravity', role: '대용량 데이터 처리' },
] as const
type Selection = (typeof agents)[number]['id'] | 'unassigned'

function projectDetails(notes: string | null) {
  const lines = notes?.split(/\r?\n/) ?? []
  const owners = lines.filter(line => /^\s*에이전트\s*[:：]/.test(line))
  const owner = owners.length === 1 ? owners[0] : undefined
  const name = owner?.replace(/^\s*에이전트\s*[:：]/, '').trim().toLowerCase()
  const agent: Selection = agents.find(item => item.id === name)?.id ?? 'unassigned'
  const next = lines.find(line => /^\s*다음 행동\s*[:：]/.test(line))
  return {
    agent,
    next: next?.replace(/^\s*다음 행동\s*[:：]\s*/, '').trim(),
    notes: lines.filter(line => (agent === 'unassigned' || line !== owner) && line !== next).join('\n').trim(),
  }
}

function githubUrl(value: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.origin === 'https://github.com' && !url.username && !url.password ? url.href : null
  } catch {
    return null
  }
}

async function readProjects(userId: string) {
  const client = createClient()
  const projects: Project[] = []
  const limit = 500
  let after: string | undefined
  for (;;) {
    const query = client.from('projects').select('id,name,status,updated_at,repo_url,notes')
      .eq('user_id', userId).order('id').limit(limit)
    const { data, error } = await (after ? query.gt('id', after) : query)
    if (error || !data) throw new Error('Project query failed')
    projects.push(...data)
    if (data.length < limit) return projects.sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
    after = data[data.length - 1].id
  }
}

const choice = 'min-h-12 rounded-sm border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm font-semibold whitespace-nowrap hover:border-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 aria-pressed:border-emerald-900 aria-pressed:bg-emerald-900 aria-pressed:text-white'

function AgentsBoard({ userId }: { userId: string }) {
  const { signOut } = useAuth()
  const [board, setBoard] = useState<{ projects: Project[]; checkedAt: string }>()
  const [selected, setSelected] = useState<Selection>()
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState(false)
  const request = useRef({ version: 0 })
  const load = useCallback(async () => {
    const pending = request.current
    const latest = ++pending.version
    try {
      const projects = await readProjects(userId)
      if (latest === pending.version) {
        setBoard({ projects, checkedAt: new Date().toLocaleString('ko-KR') })
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
    const channel = client.channel(`agent-board-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `user_id=eq.${userId}` }, load)
      .subscribe()
    void load()
    window.addEventListener('focus', load)
    return () => {
      pending.version++
      window.removeEventListener('focus', load)
      void client.removeChannel(channel)
    }
  }, [load, userId])

  const projects = (board?.projects ?? []).map(project => ({ ...project, ...projectDetails(project.notes) }))
  const unassignedCount = projects.filter(project => project.agent === 'unassigned').length
  const active = selected ?? (unassignedCount ? 'unassigned' : projects[0]?.agent ?? 'hermes')
  const visible = projects.filter(project => project.agent === active)
  const agent = agents.find(item => item.id === active)

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
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 text-[var(--text-primary)] md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">에이전트 관리</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">에이전트를 선택해 담당 프로젝트와 다음 행동을 확인하세요.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <button type="button" className="rounded-sm border border-[var(--border)] px-3 py-2 disabled:opacity-60"
            disabled={loading} onClick={() => { setLoading(true); void load() }}>
            {loading ? '불러오는 중…' : '새로고침'}
          </button>
          <button type="button" className="underline disabled:opacity-60" disabled={signingOut} onClick={handleSignOut}>
            {signingOut ? '로그아웃 중…' : '로그아웃'}
          </button>
        </div>
      </header>
      {signOutError && <p role="alert" className="text-sm">로그아웃하지 못했습니다. 다시 시도해 주세요.</p>}
      {error && <p role="alert" className="border-l-4 border-amber-600 pl-3 text-sm">
        {board ? '새로고침에 실패했습니다. 마지막으로 확인한 프로젝트입니다.' : '프로젝트를 불러오지 못했습니다. 다시 시도해 주세요.'}
      </p>}

      <nav aria-label="에이전트 조직도" className="space-y-3">
        <p className="w-fit border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-sm font-semibold sm:mx-auto">피터의 에이전트</p>
        <ul className="relative grid grid-cols-2 gap-2 border-l border-[var(--border)] pl-3 sm:grid-cols-4 sm:border-0 sm:pl-0 sm:before:absolute sm:before:inset-x-[12.5%] sm:before:-top-1.5 sm:before:border-t sm:before:border-[var(--border)]">
          {agents.map(item => (
            <li key={item.id} className="relative min-w-0 before:absolute before:left-1/2 before:-top-1.5 before:hidden before:h-1.5 before:border-l before:border-[var(--border)] sm:before:block">
              <button type="button" aria-pressed={active === item.id} aria-controls="assigned-projects"
                className={`${choice} w-full`} onClick={() => setSelected(item.id)}>{item.name}</button>
            </li>
          ))}
        </ul>
        <button type="button" aria-pressed={active === 'unassigned'} aria-controls="assigned-projects"
          className={choice} onClick={() => setSelected('unassigned')}>
          미배정{board && ` · ${unassignedCount}건`}
        </button>
      </nav>

      <section id="assigned-projects" aria-labelledby="assigned-heading" aria-busy={loading}
        className="border-y border-[var(--border)] border-t-4 border-t-emerald-900 bg-[var(--surface)] p-4 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h2 id="assigned-heading" className="text-xl font-bold">{agent?.name ?? '미배정 프로젝트'}</h2>
            {agent && <p className="text-sm text-[var(--text-secondary)]">{agent.role}</p>}
          </div>
          {board && <p role="status" className="text-xs text-[var(--text-secondary)]">최근 조회 {board.checkedAt}</p>}
        </div>
        {!agent && <p className="mt-2 text-sm text-[var(--text-secondary)]">
          <Link href="/projects" className="underline">프로젝트</Link>를 새로 등록할 때 메모에 ‘에이전트: Codex’처럼 적으면 조직도에 표시됩니다.
        </p>}
        {!board && loading && <p role="status" className="mt-3 text-sm">프로젝트를 불러오는 중입니다.</p>}
        {board && (
          <ul className="mt-3 divide-y divide-[var(--border)] border-t border-[var(--border)]">
            {visible.length === 0 && <li className="py-4 text-sm text-[var(--text-secondary)]">표시할 프로젝트가 없습니다.</li>}
            {visible.map(project => {
              const repository = githubUrl(project.repo_url)
              return (
                <li key={project.id} className="space-y-2 py-4">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="rounded-sm border border-[var(--border)] px-2 py-0.5 text-xs font-semibold">{statusLabel[project.status]}</span>
                    <h3 className="break-words text-base font-semibold">{project.name}</h3>
                  </div>
                  {project.notes && <p className="whitespace-pre-wrap break-words text-sm">{project.notes}</p>}
                  <p className="break-words text-sm"><strong>다음 행동</strong> {project.next || '기록 없음'}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
                    <time dateTime={project.updated_at}>{new Date(project.updated_at).toLocaleDateString('ko-KR')}</time>
                    {repository && <a href={repository} target="_blank" rel="noreferrer" className="underline">GitHub</a>}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
      <DeploymentLinks showQuickLinks />
    </main>
  )
}

export default function AgentsPage() {
  const { user } = useAuth()
  return <AuthGate>{user && <AgentsBoard key={user.id} userId={user.id} />}</AuthGate>
}
