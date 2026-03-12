'use client'

import { useState, useRef, useCallback } from 'react'
import { Plus, Trash2, Network } from 'lucide-react'
import { useMindmapStore, MindNode, MindMap } from '@/store/mindmapStore'

const NODE_W = 130
const NODE_H = 40
const H_GAP = 80
const V_MIN = 52

function getSubtreeHeight(nodeId: string, nodes: Record<string, MindNode>): number {
  const node = nodes[nodeId]
  if (!node || node.children.length === 0) return NODE_H + V_MIN
  return node.children.reduce((sum, cId) => sum + getSubtreeHeight(cId, nodes), 0)
}

function computeLayout(
  nodes: Record<string, MindNode>,
  rootId: string
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}
  const totalH = getSubtreeHeight(rootId, nodes)

  function layoutNode(nodeId: string, x: number, centerY: number) {
    positions[nodeId] = { x, y: centerY }
    const node = nodes[nodeId]
    if (!node || node.children.length === 0) return

    const childHeights = node.children.map((cId) => getSubtreeHeight(cId, nodes))
    const totalChildH = childHeights.reduce((a, b) => a + b, 0)
    let currentY = centerY - totalChildH / 2

    node.children.forEach((childId, i) => {
      layoutNode(childId, x + NODE_W + H_GAP, currentY + childHeights[i] / 2)
      currentY += childHeights[i]
    })
  }

  layoutNode(rootId, 40, totalH / 2)
  return positions
}

function MindmapCanvas({ map, onUpdate }: { map: MindMap; onUpdate: (mapId: string, nodeId: string, text: string) => void }) {
  const { addNode, deleteNode } = useMindmapStore()
  const [selected, setSelected] = useState<string | null>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [editText, setEditText] = useState('')
  const [editing, setEditing] = useState(false)
  const [newChildText, setNewChildText] = useState('')
  const [addingChild, setAddingChild] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  const positions = computeLayout(map.nodes, map.rootId)
  const allPos = Object.values(positions)
  const svgW = allPos.length ? Math.max(...allPos.map((p) => p.x)) + NODE_W + 60 : 400
  const svgH = allPos.length ? Math.max(...allPos.map((p) => p.y)) + NODE_H / 2 + 40 : 300

  const selectedNode = selected ? map.nodes[selected] : null

  function startEdit() {
    if (!selectedNode) return
    setEditText(selectedNode.text)
    setEditing(true)
    setAddingChild(false)
  }

  function saveEdit() {
    if (selected && editText.trim()) onUpdate(map.id, selected, editText.trim())
    setEditing(false)
  }

  function startAddChild() {
    setNewChildText('')
    setAddingChild(true)
    setEditing(false)
  }

  function confirmAddChild() {
    if (selected && newChildText.trim()) {
      addNode(map.id, selected, newChildText.trim())
      setNewChildText('')
      setAddingChild(false)
    }
  }

  function handleDelete() {
    if (!selected || !selectedNode?.parentId) return
    if (confirm(`"${selectedNode.text}" 노드를 삭제할까요? 하위 노드도 모두 삭제됩니다.`)) {
      deleteNode(map.id, selected)
      setSelected(null)
      setEditing(false)
      setAddingChild(false)
    }
  }

  const onMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as SVGElement).closest('[data-node]')) return
    setDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }, [pan])

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging) return
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }, [dragging, dragStart])

  const onMouseUp = useCallback(() => setDragging(false), [])

  const levelColors = ['#F97316', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']

  function getNodeLevel(nodeId: string): number {
    let level = 0
    let curr = map.nodes[nodeId]
    while (curr?.parentId) {
      level++
      curr = map.nodes[curr.parentId]
    }
    return level
  }

  return (
    <div className="flex flex-col h-full">
      {/* SVG 캔버스 */}
      <div className="flex-1 overflow-hidden rounded-2xl relative"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', minHeight: 400 }}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={{ cursor: dragging ? 'grabbing' : 'grab', minHeight: 400 }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <g transform={`translate(${pan.x}, ${pan.y})`}>
            {/* 연결선 */}
            {Object.values(map.nodes).map((node) =>
              node.children.map((childId) => {
                const from = positions[node.id]
                const to = positions[childId]
                if (!from || !to) return null
                const fx = from.x + NODE_W
                const fy = from.y
                const tx = to.x
                const ty = to.y
                const cx1 = fx + (tx - fx) * 0.5
                const cx2 = tx - (tx - fx) * 0.5
                return (
                  <path key={childId}
                    d={`M ${fx} ${fy} C ${cx1} ${fy} ${cx2} ${ty} ${tx} ${ty}`}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth={1.5}
                  />
                )
              })
            )}
            {/* 노드 */}
            {Object.values(map.nodes).map((node) => {
              const pos = positions[node.id]
              if (!pos) return null
              const isSelected = selected === node.id
              const isRoot = node.id === map.rootId
              const color = levelColors[getNodeLevel(node.id) % levelColors.length]
              const label = node.text.length > 14 ? node.text.slice(0, 14) + '…' : node.text

              return (
                <g key={node.id}
                  data-node="true"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelected(node.id)
                    setEditing(false)
                    setAddingChild(false)
                  }}
                  style={{ cursor: 'pointer' }}>
                  <rect
                    x={pos.x}
                    y={pos.y - NODE_H / 2}
                    width={NODE_W}
                    height={NODE_H}
                    rx={10}
                    fill={isRoot ? color : isSelected ? '#FFF1E6' : 'white'}
                    stroke={isSelected ? color : isRoot ? color : 'var(--border)'}
                    strokeWidth={isSelected || isRoot ? 2 : 1}
                  />
                  <text
                    x={pos.x + NODE_W / 2}
                    y={pos.y + 5}
                    textAnchor="middle"
                    fontSize={13}
                    fontWeight={isRoot ? 600 : 400}
                    fill={isRoot ? 'white' : '#374151'}
                    style={{ userSelect: 'none', fontFamily: 'inherit' }}
                  >
                    {label}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>

        {/* 빈 상태 */}
        {Object.keys(map.nodes).length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>노드를 클릭해서 시작하세요</p>
          </div>
        )}
      </div>

      {/* 하단 툴바 */}
      <div className="mt-3 p-4 rounded-2xl"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        {!selectedNode ? (
          <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
            노드를 클릭하면 편집할 수 있습니다
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>선택:</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedNode.text}</span>
            </div>

            {editing ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--accent)', color: 'var(--text-primary)' }}
                />
                <button onClick={saveEdit}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}>저장</button>
                <button onClick={() => setEditing(false)}
                  className="px-3 py-2 rounded-xl text-sm"
                  style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}>취소</button>
              </div>
            ) : addingChild ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={newChildText}
                  onChange={(e) => setNewChildText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && confirmAddChild()}
                  placeholder="새 노드 이름"
                  className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--accent)', color: 'var(--text-primary)' }}
                />
                <button onClick={confirmAddChild}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}>추가</button>
                <button onClick={() => setAddingChild(false)}
                  className="px-3 py-2 rounded-xl text-sm"
                  style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}>취소</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={startAddChild}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
                  style={{ backgroundColor: 'var(--surface-2)', color: 'var(--accent)' }}>
                  <Plus size={14} /> 자식 추가
                </button>
                <button onClick={startEdit}
                  className="px-3 py-2 rounded-xl text-sm"
                  style={{ backgroundColor: 'var(--bg)', color: 'var(--text-secondary)' }}>
                  ✏️ 편집
                </button>
                {selectedNode.parentId && (
                  <button onClick={handleDelete}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm"
                    style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                    <Trash2 size={13} /> 삭제
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function MindmapPage() {
  const { maps, addMap, deleteMap, updateNode } = useMindmapStore()
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null)
  const [showNewMap, setShowNewMap] = useState(false)
  const [newMapTitle, setNewMapTitle] = useState('')

  const selectedMap = maps.find((m) => m.id === selectedMapId) ?? maps[0] ?? null

  function handleAddMap(e: React.FormEvent) {
    e.preventDefault()
    if (!newMapTitle.trim()) return
    const id = addMap(newMapTitle.trim())
    setSelectedMapId(id)
    setNewMapTitle('')
    setShowNewMap(false)
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col" style={{ minHeight: 'calc(100vh - 32px)' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            🕸️ 마인드맵
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            아이디어를 시각적으로 펼쳐보세요
          </p>
        </div>
        <button onClick={() => setShowNewMap(true)}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
          <Plus size={15} /> 새 맵
        </button>
      </div>

      {/* 새 맵 폼 */}
      {showNewMap && (
        <form onSubmit={handleAddMap} className="flex gap-2 mb-4">
          <input
            autoFocus
            value={newMapTitle}
            onChange={(e) => setNewMapTitle(e.target.value)}
            placeholder="마인드맵 제목"
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          <button type="submit"
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}>만들기</button>
          <button type="button" onClick={() => setShowNewMap(false)}
            className="px-3 py-2 rounded-xl text-sm"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}>취소</button>
        </form>
      )}

      {/* 맵 선택 탭 */}
      {maps.length > 0 && (
        <div className="flex gap-1 mb-4 flex-wrap">
          {maps.map((m) => (
            <div key={m.id} className="flex items-center gap-1">
              <button
                onClick={() => setSelectedMapId(m.id)}
                className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
                style={(selectedMap?.id === m.id)
                  ? { backgroundColor: 'var(--accent)', color: 'white' }
                  : { backgroundColor: 'var(--surface)', color: 'var(--text-secondary)' }}>
                {m.title}
              </button>
              <button
                onClick={() => {
                  if (confirm(`"${m.title}" 맵을 삭제할까요?`)) {
                    deleteMap(m.id)
                    if (selectedMapId === m.id) setSelectedMapId(null)
                  }
                }}
                className="text-xs px-1"
                style={{ color: 'var(--text-muted)' }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* 캔버스 또는 빈 상태 */}
      {!selectedMap ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Network size={48} strokeWidth={1.2} style={{ color: 'var(--text-muted)' }} className="mb-4" />
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>마인드맵을 만들어보세요</p>
          <button onClick={() => setShowNewMap(true)}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
            <Plus size={15} /> 첫 마인드맵 만들기
          </button>
        </div>
      ) : (
        <div className="flex-1">
          <MindmapCanvas map={selectedMap} onUpdate={updateNode} />
        </div>
      )}
    </div>
  )
}
