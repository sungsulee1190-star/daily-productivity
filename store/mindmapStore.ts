'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface MindNode {
  id: string
  text: string
  parentId: string | null
  children: string[]
}

export interface MindMap {
  id: string
  title: string
  nodes: Record<string, MindNode>
  rootId: string
  createdAt: string
}

interface MindmapStore {
  maps: MindMap[]
  addMap: (title: string) => string
  deleteMap: (mapId: string) => void
  addNode: (mapId: string, parentId: string, text: string) => void
  updateNode: (mapId: string, nodeId: string, text: string) => void
  deleteNode: (mapId: string, nodeId: string) => void
}

export const useMindmapStore = create<MindmapStore>()(
  persist(
    (set) => ({
      maps: [],
      addMap: (title) => {
        const id = crypto.randomUUID()
        const rootId = crypto.randomUUID()
        set((s) => ({
          maps: [
            ...s.maps,
            {
              id, title, rootId,
              nodes: { [rootId]: { id: rootId, text: title, parentId: null, children: [] } },
              createdAt: new Date().toISOString(),
            },
          ],
        }))
        return id
      },
      deleteMap: (mapId) =>
        set((s) => ({ maps: s.maps.filter((m) => m.id !== mapId) })),
      addNode: (mapId, parentId, text) => {
        const nodeId = crypto.randomUUID()
        set((s) => ({
          maps: s.maps.map((m) => {
            if (m.id !== mapId) return m
            return {
              ...m,
              nodes: {
                ...m.nodes,
                [nodeId]: { id: nodeId, text, parentId, children: [] },
                [parentId]: { ...m.nodes[parentId], children: [...m.nodes[parentId].children, nodeId] },
              },
            }
          }),
        }))
      },
      updateNode: (mapId, nodeId, text) =>
        set((s) => ({
          maps: s.maps.map((m) =>
            m.id !== mapId ? m : {
              ...m,
              nodes: { ...m.nodes, [nodeId]: { ...m.nodes[nodeId], text } },
            }
          ),
        })),
      deleteNode: (mapId, nodeId) =>
        set((s) => ({
          maps: s.maps.map((m) => {
            if (m.id !== mapId) return m
            const node = m.nodes[nodeId]
            if (!node || !node.parentId) return m

            const toDelete = new Set<string>()
            const collect = (id: string) => {
              toDelete.add(id)
              m.nodes[id]?.children.forEach(collect)
            }
            collect(nodeId)

            const newNodes = { ...m.nodes }
            toDelete.forEach((id) => delete newNodes[id])
            newNodes[node.parentId] = {
              ...newNodes[node.parentId],
              children: newNodes[node.parentId].children.filter((c) => c !== nodeId),
            }
            return { ...m, nodes: newNodes }
          }),
        })),
    }),
    { name: 'daily-productivity-mindmaps' }
  )
)
