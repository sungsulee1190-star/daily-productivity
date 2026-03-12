'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, FolderKanban, Trash2, Code2, User } from 'lucide-react'
import { useProjectStore, ProjectType, ProjectStatus } from '@/store/projectStore'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

const statusLabel: Record<ProjectStatus, string> = {
  active: '진행중',
  paused: '보류',
  completed: '완료',
}

const statusColor: Record<ProjectStatus, { bg: string; text: string }> = {
  active: { bg: '#DCFCE7', text: '#16A34A' },
  paused: { bg: '#FEF9C3', text: '#CA8A04' },
  completed: { bg: '#F3F4F6', text: '#6B7280' },
}

export default function ProjectsPage() {
  const { projects, addProject, deleteProject } = useProjectStore()
  const [activeTab, setActiveTab] = useState<ProjectType>('dev')
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<ProjectType>('dev')

  const filtered = projects.filter((p) => p.type === activeTab)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    addProject(newTitle.trim(), newType)
    setNewTitle('')
    setShowForm(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            🗂️ 프로젝트
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            개발 및 개인 프로젝트를 PRD로 관리하세요
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
        >
          <Plus size={15} />
          새 프로젝트
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ backgroundColor: 'var(--surface)' }}>
        <button
          onClick={() => setActiveTab('dev')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={activeTab === 'dev'
            ? { backgroundColor: 'var(--accent)', color: 'white' }
            : { color: 'var(--text-secondary)' }}
        >
          <Code2 size={14} />
          개발 프로젝트
        </button>
        <button
          onClick={() => setActiveTab('personal')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={activeTab === 'personal'
            ? { backgroundColor: 'var(--accent)', color: 'white' }
            : { color: 'var(--text-secondary)' }}
        >
          <User size={14} />
          개인 프로젝트
        </button>
      </div>

      {/* 새 프로젝트 폼 */}
      {showForm && (
        <div className="mb-4 p-4 rounded-2xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <form onSubmit={handleAdd} className="space-y-3">
            <input
              autoFocus
              type="text"
              placeholder="프로젝트 이름"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
            <div className="flex gap-2 text-sm">
              <button type="button"
                onClick={() => setNewType('dev')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all"
                style={newType === 'dev'
                  ? { backgroundColor: 'var(--accent)', color: 'white' }
                  : { backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}>
                <Code2 size={13} /> 개발
              </button>
              <button type="button"
                onClick={() => setNewType('personal')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all"
                style={newType === 'personal'
                  ? { backgroundColor: 'var(--accent)', color: 'white' }
                  : { backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}>
                <User size={13} /> 개인
              </button>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2 rounded-xl text-sm"
                style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}>취소</button>
              <button type="submit"
                className="flex-1 py-2 rounded-xl text-sm font-medium"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}>만들기</button>
            </div>
          </form>
        </div>
      )}

      {/* 프로젝트 목록 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <FolderKanban size={40} strokeWidth={1.2} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-4" />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {activeTab === 'dev' ? '개발 프로젝트' : '개인 프로젝트'}를 추가해보세요
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => (
            <div key={project.id}
              className="p-4 rounded-2xl group flex items-center gap-4"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link href={`/projects/${project.id}`}
                    className="text-sm font-semibold hover:underline truncate"
                    style={{ color: 'var(--text-primary)' }}>
                    {project.title}
                  </Link>
                  <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: statusColor[project.status].bg, color: statusColor[project.status].text }}>
                    {statusLabel[project.status]}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {format(new Date(project.updatedAt), 'M월 d일 수정', { locale: ko })}
                  {project.prd.goal && ` · ${project.prd.goal.slice(0, 30)}${project.prd.goal.length > 30 ? '...' : ''}`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={`/projects/${project.id}`}
                  className="text-xs px-3 py-1.5 rounded-xl font-medium"
                  style={{ backgroundColor: 'var(--surface-2)', color: 'var(--accent)' }}>
                  PRD 열기
                </Link>
                <button
                  onClick={() => { if (confirm(`"${project.title}"을 삭제할까요?`)) deleteProject(project.id) }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--text-muted)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
