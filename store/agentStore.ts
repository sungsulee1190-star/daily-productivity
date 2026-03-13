'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AgentName = 'gemini' | 'gpt' | 'claude'
export type AgentStatus = 'idle' | 'running' | 'done' | 'error'

export interface AgentLog {
  id: string
  agentName: AgentName
  projectId: string
  projectTitle: string
  task: string
  status: AgentStatus
  result?: string
  createdAt: string
  completedAt?: string
}

export const AGENT_DEFS: Record<AgentName, { label: string; role: string; color: string; bgColor: string; emoji: string }> = {
  gemini: {
    label: 'Gemini',
    role: '분석 & 리서치',
    color: '#1A73E8',
    bgColor: '#E8F0FE',
    emoji: '🔵',
  },
  gpt: {
    label: 'GPT-4',
    role: '계획서 초안 작성',
    color: '#10A37F',
    bgColor: '#D4F5E9',
    emoji: '🟢',
  },
  claude: {
    label: 'Claude',
    role: '리뷰 & 최종 정리',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    emoji: '🟣',
  },
}

interface AgentStore {
  agentStatuses: Record<AgentName, AgentStatus>
  logs: AgentLog[]
  setAgentStatus: (name: AgentName, status: AgentStatus) => void
  addLog: (log: Omit<AgentLog, 'id' | 'createdAt'>) => void
  updateLog: (id: string, updates: Partial<AgentLog>) => void
  clearLogs: () => void
}

export const useAgentStore = create<AgentStore>()(
  persist(
    (set) => ({
      agentStatuses: { gemini: 'idle', gpt: 'idle', claude: 'idle' },
      logs: [],
      setAgentStatus: (name, status) =>
        set((s) => ({ agentStatuses: { ...s.agentStatuses, [name]: status } })),
      addLog: (log) =>
        set((s) => ({
          logs: [
            { ...log, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
            ...s.logs,
          ],
        })),
      updateLog: (id, updates) =>
        set((s) => ({ logs: s.logs.map((l) => (l.id === id ? { ...l, ...updates } : l)) })),
      clearLogs: () => set({ logs: [] }),
    }),
    { name: 'daily-agent-store' }
  )
)
