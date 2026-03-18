'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Lightbulb, Plus, Trash2, ChevronDown, ChevronUp,
  Terminal, Clock, PlayCircle, CheckCircle2, Inbox,
  Sparkles, Copy, Check,
} from 'lucide-react'
import { useIdeaStore, Idea, CliTool, IdeaStatus, IdeaPriority } from '@/store/ideaStore'
import { useAuth } from '@/lib/auth-context'

type Tab = 'all' | 'inbox' | 'ready' | 'in_progress' | 'done'

const TAB_CONFIG: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'all',        label: '전체',   icon: Lightbulb },
  { id: 'inbox',      label: '받은함', icon: Inbox },
  { id: 'ready',      label: '준비됨', icon: Sparkles },
  { id: 'in_progress',label: '진행중', icon: PlayCircle },
  { id: 'done',       label: '완료',   icon: CheckCircle2 },
]

const CLI_TOOL_CONFIG: Record<CliTool, { label: string; color: string; bg: string }> = {
  claude: { label: 'Claude Code', color: '#d97706', bg: '#fef3c7' },
  codex:  { label: 'Codex',       color: '#16a34a', bg: '#dcfce7' },
  gemini: { label: 'Gemini CLI',  color: '#2563eb', bg: '#dbeafe' },
  auto:   { label: '자동 선택',   color: '#7c3aed', bg: '#ede9fe' },
}

const PRIORITY_CONFIG: Record<IdeaPriority, { label: string; color: string }> = {
  high:   { label: '높음', color: '#ef4444' },
  medium: { label: '보통', color: '#f59e0b' },
  low:    { label: '낮음', color: '#6b7280' },
}

const STATUS_NEXT: Record<IdeaStatus, { label: string; next: IdeaStatus } | null> = {
  inbox:      { label: '준비됨으로 →', next: 'ready' },
  ready:      { label: '진행중으로 →', next: 'in_progress' },
  in_progress:{ label: '완료로 →',     next: 'done' },
  done:       null,
}

function generateScript(idea: Idea): string {
  const toolCmd: Record<CliTool, string> = {
    claude: 'claude',
    codex:  'codex',
    gemini: 'gemini',
    auto:   'claude',
  }
  const cmd = toolCmd[idea.cli_tool]
  const desc = idea.description ? `\n# 설명: ${idea.description}` : ''
  return `#!/bin/bash
# 아이디어: ${idea.title}${desc}
# 생성일: ${new Date(idea.created_at).toLocaleDateString('ko-KR')}
# 도구: ${CLI_TOOL_CONFIG[idea.cli_tool].label}

${cmd} "${idea.title}${idea.description ? `\n\n${idea.description}` : ''}"
`
}

interface IdeaFormProps {
  onSubmit: (data: { title: string; description: string; cli_tool: CliTool; priority: IdeaPriority }) => void
  onCancel: () => void
}

function IdeaForm({ onSubmit, onCancel }: IdeaFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [cliTool, setCliTool] = useState<CliTool>('claude')
  const [priority, setPriority] = useState<IdeaPriority>('medium')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({ title: title.trim(), description: description.trim(), cli_tool: cliTool, priority })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl p-4 space-y-3 mb-4"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <input
        ref={titleRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="아이디어 제목 (예: 할일 앱에 음성 입력 추가)"
        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
        style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="상세 설명 (선택 - CLI에 전달될 프롬프트)"
        rows={3}
        className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
        style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      />
      <div className="flex gap-2 flex-wrap">
        {/* CLI Tool */}
        <div className="flex-1 min-w-[140px]">
          <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>실행 도구</p>
          <div className="flex flex-wrap gap-1">
            {(Object.entries(CLI_TOOL_CONFIG) as [CliTool, typeof CLI_TOOL_CONFIG[CliTool]][]).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCliTool(key)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={cliTool === key
                  ? { backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }
                  : { backgroundColor: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                }
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
        {/* Priority */}
        <div>
          <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>우선순위</p>
          <div className="flex gap-1">
            {(Object.entries(PRIORITY_CONFIG) as [IdeaPriority, typeof PRIORITY_CONFIG[IdeaPriority]][]).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPriority(key)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={priority === key
                  ? { backgroundColor: cfg.color + '20', color: cfg.color, border: `1px solid ${cfg.color}40` }
                  : { backgroundColor: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                }
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
        >
          추가
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
        >
          취소
        </button>
      </div>
    </form>
  )
}

interface IdeaCardProps {
  idea: Idea
  onUpdate: (id: string, updates: Partial<Idea>) => void
  onDelete: (id: string) => void
}

function IdeaCard({ idea, onUpdate, onDelete }: IdeaCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showScript, setShowScript] = useState(false)
  const [copied, setCopied] = useState(false)
  const cli = CLI_TOOL_CONFIG[idea.cli_tool]
  const pri = PRIORITY_CONFIG[idea.priority]
  const nextAction = STATUS_NEXT[idea.status]
  const script = generateScript(idea)

  const copyScript = async () => {
    await navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="rounded-2xl p-4 transition-all"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        opacity: idea.status === 'done' ? 0.65 : 1,
      }}
    >
      {/* Header row */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-2 py-0.5 rounded-md text-xs font-medium"
              style={{ backgroundColor: cli.bg, color: cli.color }}
            >
              {cli.label}
            </span>
            <span className="text-xs font-medium" style={{ color: pri.color }}>
              ● {pri.label}
            </span>
          </div>
          <p
            className="mt-1.5 text-sm font-medium leading-snug"
            style={{
              color: 'var(--text-primary)',
              textDecoration: idea.status === 'done' ? 'line-through' : 'none',
            }}
          >
            {idea.title}
          </p>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="p-1.5 rounded-lg transition-all flex-shrink-0"
          style={{ color: 'var(--text-muted)' }}
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-3 space-y-3">
          {idea.description && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {idea.description}
            </p>
          )}

          {/* Script section */}
          <div>
            <button
              onClick={() => setShowScript((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium transition-all"
              style={{ color: 'var(--accent)' }}
            >
              <Terminal size={12} />
              {showScript ? '스크립트 숨기기' : '쉘 스크립트 보기'}
            </button>
            {showScript && (
              <div className="mt-2 relative">
                <pre
                  className="rounded-xl p-3 text-xs overflow-x-auto"
                  style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    fontFamily: 'monospace',
                  }}
                >
                  {script}
                </pre>
                <button
                  onClick={copyScript}
                  className="absolute top-2 right-2 p-1.5 rounded-lg transition-all"
                  style={{ backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}
                  title="복사"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap pt-1">
            {nextAction && (
              <button
                onClick={() => onUpdate(idea.id, { status: nextAction.next })}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                {nextAction.label}
              </button>
            )}
            {idea.status === 'done' && (
              <button
                onClick={() => onUpdate(idea.id, { status: 'inbox' })}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--text-secondary)' }}
              >
                받은함으로 되돌리기
              </button>
            )}
            <button
              onClick={() => onDelete(idea.id)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1"
              style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
            >
              <Trash2 size={11} />
              삭제
            </button>
          </div>

          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {new Date(idea.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
      )}
    </div>
  )
}

export default function IdeasPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const { ideas, fetchIdeas, addIdea, updateIdea, deleteIdea } = useIdeaStore()
  const [showForm, setShowForm] = useState(false)

  const activeTab = (searchParams.get('tab') as Tab) || 'all'

  useEffect(() => {
    if (user) fetchIdeas(user.id)
  }, [user, fetchIdeas])

  const setTab = (tab: Tab) => {
    router.push(tab === 'all' ? '/ideas' : `/ideas?tab=${tab}`)
  }

  const filtered = activeTab === 'all'
    ? ideas
    : ideas.filter((i) => i.status === activeTab)

  const countByStatus = (status: IdeaStatus) => ideas.filter((i) => i.status === status).length

  const handleAdd = async (data: { title: string; description: string; cli_tool: CliTool; priority: IdeaPriority }) => {
    if (!user) return
    await addIdea({
      user_id: user.id,
      title: data.title,
      description: data.description || null,
      cli_tool: data.cli_tool,
      priority: data.priority,
      status: 'inbox',
      generated_script: null,
    }, user.id)
    setShowForm(false)
  }

  return (
    <div className="flex-1 min-w-0 p-4 md:p-6 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            아이디어
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            CLI로 실행할 아이디어를 관리하세요
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
        >
          <Plus size={15} />
          새 아이디어
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <IdeaForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {TAB_CONFIG.map(({ id, label, icon: Icon }) => {
          const count = id === 'all' ? ideas.length : countByStatus(id as IdeaStatus)
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0"
              style={activeTab === id
                ? { backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }
                : { backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }
              }
            >
              <Icon size={13} />
              {label}
              {count > 0 && (
                <span
                  className="ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold"
                  style={activeTab === id
                    ? { backgroundColor: 'var(--accent)', color: 'white' }
                    : { backgroundColor: 'var(--bg)', color: 'var(--text-muted)' }
                  }
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Idea list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ backgroundColor: 'var(--surface)', border: '1px dashed var(--border)' }}
          >
            <Lightbulb size={28} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {activeTab === 'all' ? '아이디어를 추가해보세요' : '해당 상태의 아이디어가 없습니다'}
            </p>
          </div>
        ) : (
          filtered.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onUpdate={updateIdea}
              onDelete={deleteIdea}
            />
          ))
        )}
      </div>
    </div>
  )
}
