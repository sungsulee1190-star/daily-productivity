'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Plus, FolderKanban, Trash2, Code2, User,
  Clock, PlayCircle, CheckCircle2, Bot,
  ChevronRight, Sparkles, CheckCheck, Pause,
  ScrollText, Zap,
} from 'lucide-react'
import { useProjectStore, WorkflowStatus } from '@/store/projectStore'
import { useAgentStore, AGENT_DEFS, AgentName } from '@/store/agentStore'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'all' | 'pending' | 'active' | 'completed' | 'logs' | 'new'

const TAB_CONFIG: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: '전체', icon: FolderKanban },
  { id: 'pending', label: '승인 대기', icon: Clock },
  { id: 'active', label: '진행 중', icon: PlayCircle },
  { id: 'completed', label: '완료', icon: CheckCircle2 },
  { id: 'logs', label: '에이전트 로그', icon: Bot },
]

const WORKFLOW_CONFIG: Record<WorkflowStatus, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  draft: { label: '초안', bg: '#F3F4F6', text: '#6B7280', icon: ScrollText },
  pending_review: { label: '승인 대기', bg: '#FEF3C7', text: '#D97706', icon: Clock },
  in_progress: { label: '진행 중', bg: '#DCFCE7', text: '#16A34A', icon: PlayCircle },
  completed: { label: '완료', bg: '#EFF6FF', text: '#3B82F6', icon: CheckCheck },
  paused: { label: '보류', bg: '#F9FAFB', text: '#9CA3AF', icon: Pause },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AgentCard({ name }: { name: AgentName }) {
  const { agentStatuses } = useAgentStore()
  const def = AGENT_DEFS[name]
  const status = agentStatuses[name]

  const statusLabel: Record<string, string> = {
    idle: '대기 중',
    running: '실행 중',
    done: '완료',
    error: '오류',
  }

  return (
    <div
      className="flex items-center gap-3 p-4 rounded-2xl border"
      style={{ backgroundColor: def.bgColor, borderColor: def.color + '30' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
        style={{ backgroundColor: def.color + '20', color: def.color }}
      >
        {def.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: def.color }}>{def.label}</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: status === 'running' ? def.color : '#E5E7EB',
              color: status === 'running' ? 'white' : '#6B7280',
            }}
          >
            {statusLabel[status]}
          </span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{def.role}</p>
      </div>
    </div>
  )
}

function NewProjectForm({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const { addProject, updateProject } = useProjectStore()
  const { addLog, setAgentStatus } = useAgentStore()
  const [title, setTitle] = useState('')
  const [idea, setIdea] = useState('')
  const [type, setType] = useState<'dev' | 'personal'>('dev')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)

    const projectId = addProject(title.trim(), type, idea.trim())

    // Simulate multi-agent analysis
    const agents: AgentName[] = ['gemini', 'gpt', 'claude']
    const tasks = ['아이디어 분석 및 리서치', '계획서 초안 작성', '최종 검토 및 정리']

    for (let i = 0; i < agents.length; i++) {
      setAgentStatus(agents[i], 'running')
      addLog({
        agentName: agents[i],
        projectId,
        projectTitle: title.trim(),
        task: tasks[i],
        status: 'running',
      })
      await new Promise((r) => setTimeout(r, 600))
      setAgentStatus(agents[i], 'done')
    }

    updateProject(projectId, { workflowStatus: 'pending_review' })
    setLoading(false)
    router.push('/projects?tab=pending')
    onClose()
  }

  return (
    <div className="p-5 rounded-2xl border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
      <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <Sparkles size={16} style={{ color: 'var(--accent)' }} />
        새 프로젝트 생성
      </h2>

      {loading ? (
        <div className="py-8 text-center space-y-3">
          <div className="flex justify-center gap-3">
            {(['gemini', 'gpt', 'claude'] as AgentName[]).map((name) => (
              <AgentCard key={name} name={name} />
            ))}
          </div>
          <p className="text-sm mt-4" style={{ color: 'var(--text-secondary)' }}>
            에이전트가 계획서를 분석 중...
          </p>
          <div className="flex justify-center gap-1 mt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: 'var(--accent)', animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            autoFocus
            type="text"
            placeholder="프로젝트 제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <textarea
            placeholder="아이디어를 자유롭게 적어주세요. 에이전트가 계획서 초안을 만들어 드립니다."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('dev')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all"
              style={type === 'dev'
                ? { backgroundColor: 'var(--accent)', color: 'white' }
                : { backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}
            >
              <Code2 size={13} /> 개발
            </button>
            <button
              type="button"
              onClick={() => setType('personal')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all"
              style={type === 'personal'
                ? { backgroundColor: 'var(--accent)', color: 'white' }
                : { backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}
            >
              <User size={13} /> 개인
            </button>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl text-sm"
              style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              <Zap size={14} />
              에이전트에게 분석 요청
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

function ProjectsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const rawTab = searchParams.get('tab') as Tab | null
  const activeTab: Tab = rawTab && ['all', 'pending', 'active', 'completed', 'logs', 'new'].includes(rawTab)
    ? rawTab
    : 'all'

  const { projects, deleteProject, updateProject } = useProjectStore()
  const { logs, clearLogs } = useAgentStore()

  const filteredProjects = projects.filter((p) => {
    const ws = p.workflowStatus ?? 'in_progress'
    if (activeTab === 'all') return true
    if (activeTab === 'pending') return ws === 'pending_review' || ws === 'draft'
    if (activeTab === 'active') return ws === 'in_progress'
    if (activeTab === 'completed') return ws === 'completed'
    return true
  })

  function setTab(tab: Tab) {
    router.push(tab === 'all' ? '/projects' : `/projects?tab=${tab}`)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            🗂️ 프로젝트
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            입력 → 계획서 → 리뷰 → 승인 → 진행
          </p>
        </div>
        <button
          onClick={() => setTab('new')}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
        >
          <Plus size={15} />
          새 프로젝트
        </button>
      </div>

      {/* New project form */}
      {activeTab === 'new' && (
        <div className="mb-6">
          <NewProjectForm onClose={() => setTab('all')} />
        </div>
      )}

      {/* Tabs */}
      {activeTab !== 'new' && (
        <>
          <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
            {TAB_CONFIG.map(({ id, label, icon: Icon }) => {
              const count = id === 'logs'
                ? logs.length
                : id === 'all'
                  ? projects.length
                  : projects.filter((p) => {
                      const ws = p.workflowStatus ?? 'in_progress'
                      if (id === 'pending') return ws === 'pending_review' || ws === 'draft'
                      if (id === 'active') return ws === 'in_progress'
                      if (id === 'completed') return ws === 'completed'
                      return false
                    }).length
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0"
                  style={activeTab === id
                    ? { backgroundColor: 'var(--accent)', color: 'white' }
                    : { backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}
                >
                  <Icon size={14} />
                  {label}
                  {count > 0 && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: activeTab === id ? 'rgba(255,255,255,0.3)' : 'var(--bg)',
                        color: activeTab === id ? 'white' : 'var(--text-muted)',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Agent Logs tab */}
          {activeTab === 'logs' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>에이전트 실행 로그</h2>
                {logs.length > 0 && (
                  <button
                    onClick={clearLogs}
                    className="text-xs px-3 py-1.5 rounded-xl"
                    style={{ backgroundColor: 'var(--bg)', color: 'var(--text-muted)' }}
                  >
                    전체 삭제
                  </button>
                )}
              </div>
              {logs.length === 0 ? (
                <div className="text-center py-16">
                  <Bot size={40} strokeWidth={1.2} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-4" />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>아직 에이전트 실행 기록이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => {
                    const def = AGENT_DEFS[log.agentName]
                    return (
                      <div
                        key={log.id}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                      >
                        <span className="text-base">{def.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium" style={{ color: def.color }}>{def.label}</span>
                            <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
                            <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{log.projectTitle}</span>
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {log.task} · {format(new Date(log.createdAt), 'M/d HH:mm', { locale: ko })}
                          </p>
                        </div>
                        <span
                          className="text-xs px-2 py-1 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: log.status === 'done' ? '#DCFCE7' : log.status === 'running' ? '#FEF3C7' : '#F3F4F6',
                            color: log.status === 'done' ? '#16A34A' : log.status === 'running' ? '#D97706' : '#6B7280',
                          }}
                        >
                          {log.status === 'done' ? '완료' : log.status === 'running' ? '실행중' : '오류'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Project list */}
          {activeTab !== 'logs' && (
            <>
              {/* Pending review: approve/reject actions */}
              {activeTab === 'pending' && filteredProjects.length > 0 && (
                <div
                  className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                  style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
                >
                  <Clock size={14} />
                  계획서 초안이 준비되었습니다. 검토 후 승인하면 진행 단계로 전환됩니다.
                </div>
              )}

              {filteredProjects.length === 0 ? (
                <div className="text-center py-16">
                  <FolderKanban size={40} strokeWidth={1.2} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-4" />
                  <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                    {activeTab === 'all' ? '아직 프로젝트가 없습니다' :
                      activeTab === 'pending' ? '승인 대기 중인 프로젝트가 없습니다' :
                      activeTab === 'active' ? '진행 중인 프로젝트가 없습니다' :
                      '완료된 프로젝트가 없습니다'}
                  </p>
                  {activeTab === 'all' && (
                    <button
                      onClick={() => setTab('new')}
                      className="text-sm px-4 py-2 rounded-xl font-medium"
                      style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                    >
                      첫 프로젝트 만들기
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProjects.map((project) => {
                    const ws = (project as { workflowStatus?: WorkflowStatus }).workflowStatus ?? 'in_progress'
                    const wc = WORKFLOW_CONFIG[ws]
                    const WIcon = wc.icon
                    return (
                      <div
                        key={project.id}
                        className="p-4 rounded-2xl group"
                        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Link
                                href={`/projects/${project.id}`}
                                className="text-sm font-semibold hover:underline"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {project.title}
                              </Link>
                              <span
                                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: wc.bg, color: wc.text }}
                              >
                                <WIcon size={10} />
                                {wc.label}
                              </span>
                              <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: 'var(--bg)', color: 'var(--text-muted)' }}
                              >
                                {project.type === 'dev' ? '개발' : '개인'}
                              </span>
                            </div>
                            {project.ideaDump && (
                              <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                                {project.ideaDump}
                              </p>
                            )}
                            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                              {format(new Date(project.updatedAt), 'M월 d일 수정', { locale: ko })}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              if (confirm(`"${project.title}"을 삭제할까요?`)) deleteProject(project.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Workflow actions */}
                        <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                          <Link
                            href={`/projects/${project.id}`}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium"
                            style={{ backgroundColor: 'var(--surface-2)', color: 'var(--accent)' }}
                          >
                            PRD 열기
                          </Link>
                          {ws === 'pending_review' && (
                            <button
                              onClick={() => updateProject(project.id, { workflowStatus: 'in_progress' })}
                              className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"
                              style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}
                            >
                              <CheckCheck size={12} />
                              승인 → 진행
                            </button>
                          )}
                          {ws === 'in_progress' && (
                            <>
                              <button
                                onClick={() => updateProject(project.id, { workflowStatus: 'completed' })}
                                className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"
                                style={{ backgroundColor: '#EFF6FF', color: '#3B82F6' }}
                              >
                                <CheckCircle2 size={12} />
                                완료 처리
                              </button>
                              <button
                                onClick={() => updateProject(project.id, { workflowStatus: 'paused' })}
                                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                                style={{ backgroundColor: 'var(--bg)', color: 'var(--text-muted)' }}
                              >
                                보류
                              </button>
                            </>
                          )}
                          {(ws === 'completed' || ws === 'paused') && (
                            <button
                              onClick={() => updateProject(project.id, { workflowStatus: 'in_progress' })}
                              className="text-xs px-3 py-1.5 rounded-lg font-medium"
                              style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}
                            >
                              재개
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* AI Agents section */}
          {(activeTab === 'all' || activeTab === 'active') && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-3">
                <Bot size={16} style={{ color: 'var(--text-muted)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>멀티 AI 에이전트</h2>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--bg)', color: 'var(--text-muted)' }}
                >
                  API 연결 준비 중
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['gemini', 'gpt', 'claude'] as AgentName[]).map((name) => (
                  <AgentCard key={name} name={name} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-7 w-32 rounded-xl" style={{ backgroundColor: 'var(--border)' }} />
          <div className="h-10 w-full rounded-xl" style={{ backgroundColor: 'var(--border)' }} />
        </div>
      </div>
    }>
      <ProjectsContent />
    </Suspense>
  )
}
