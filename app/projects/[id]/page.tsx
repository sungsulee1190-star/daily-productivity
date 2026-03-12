'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { useProjectStore, ProjectStatus } from '@/store/projectStore'

const statusOptions: { value: ProjectStatus; label: string; color: string }[] = [
  { value: 'active', label: '진행중', color: '#16A34A' },
  { value: 'paused', label: '보류', color: '#CA8A04' },
  { value: 'completed', label: '완료', color: '#6B7280' },
]

const prdFields: { key: keyof import('@/store/projectStore').PRD; label: string; placeholder: string }[] = [
  { key: 'background', label: '📌 배경 & 문제', placeholder: '어떤 문제를 해결하려고 하나요?' },
  { key: 'goal', label: '🎯 목표', placeholder: '이 프로젝트로 무엇을 달성하려 하나요?' },
  { key: 'target', label: '👤 타겟 사용자', placeholder: '누가 사용하는 제품/서비스인가요?' },
  { key: 'features', label: '⚙️ 핵심 기능', placeholder: '반드시 있어야 하는 기능을 적어주세요.' },
  { key: 'metrics', label: '📊 성공 지표', placeholder: '성공했다고 판단하는 기준은 무엇인가요?' },
  { key: 'timeline', label: '🗓️ 일정', placeholder: '주요 마일스톤과 일정을 적어주세요.' },
]

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { projects, updateProject, updatePRD } = useProjectStore()
  const project = projects.find((p) => p.id === id)

  const [title, setTitle] = useState('')
  const [ideaDump, setIdeaDump] = useState('')
  const [activeTab, setActiveTab] = useState<'idea' | 'prd'>('idea')

  useEffect(() => {
    if (project) {
      setTitle(project.title)
      setIdeaDump(project.ideaDump)
    }
  }, [project?.id])

  if (!project) return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <p style={{ color: 'var(--text-muted)' }}>프로젝트를 찾을 수 없습니다.</p>
    </div>
  )

  const currentStatus = statusOptions.find((s) => s.value === project.status)!

  function handleTitleBlur() {
    if (project && title.trim() && title !== project.title) updateProject(id, { title: title.trim() })
  }

  function handleIdeaBlur() {
    if (project && ideaDump !== project.ideaDump) updateProject(id, { ideaDump })
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()}
          className="p-2 rounded-xl transition-all"
          style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={18} />
        </button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="flex-1 text-xl font-bold outline-none bg-transparent"
          style={{ color: 'var(--text-primary)' }}
        />
        {/* 상태 선택 */}
        <div className="relative">
          <select
            value={project.status}
            onChange={(e) => updateProject(id, { status: e.target.value as ProjectStatus })}
            className="appearance-none text-xs px-3 py-1.5 pr-6 rounded-xl font-medium outline-none cursor-pointer"
            style={{ backgroundColor: '#F3F4F6', color: currentStatus.color, border: 'none' }}
          >
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: currentStatus.color }} />
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--surface)' }}>
        <button onClick={() => setActiveTab('idea')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={activeTab === 'idea'
            ? { backgroundColor: 'var(--accent)', color: 'white' }
            : { color: 'var(--text-secondary)' }}>
          💭 아이디어 메모
        </button>
        <button onClick={() => setActiveTab('prd')}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={activeTab === 'prd'
            ? { backgroundColor: 'var(--accent)', color: 'white' }
            : { color: 'var(--text-secondary)' }}>
          📋 PRD
        </button>
      </div>

      {/* 아이디어 메모 탭 */}
      {activeTab === 'idea' && (
        <div className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            두서없이 아이디어를 자유롭게 적어두세요. PRD 탭에서 정리할 수 있습니다.
          </p>
          <textarea
            value={ideaDump}
            onChange={(e) => setIdeaDump(e.target.value)}
            onBlur={handleIdeaBlur}
            placeholder="아이디어, 생각, 참고 링크... 뭐든 적어두세요"
            rows={16}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
            style={{
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              lineHeight: '1.7',
            }}
          />
        </div>
      )}

      {/* PRD 탭 */}
      {activeTab === 'prd' && (
        <div className="space-y-4">
          {prdFields.map(({ key, label, placeholder }) => (
            <div key={key} className="p-5 rounded-2xl"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <label className="text-sm font-semibold block mb-2" style={{ color: 'var(--text-primary)' }}>
                {label}
              </label>
              <textarea
                value={project.prd[key]}
                onChange={(e) => updatePRD(id, { [key]: e.target.value })}
                placeholder={placeholder}
                rows={4}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  lineHeight: '1.7',
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
