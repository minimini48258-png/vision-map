import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background, Controls, MiniMap,
  MarkerType,
  useNodesState, useEdgesState,
  type Connection, type Node, type Edge,
  BaseEdge, EdgeLabelRenderer, getBezierPath,
  type EdgeProps,
  Handle, Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { nanoid } from 'nanoid'
import { Plus, Check, X, Sparkles, Loader2, Pencil } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useShallow } from 'zustand/react/shallow'
import { useGroqAI } from '../../hooks/useGroqAI'
import type { IssueMapEdge, BusinessNode } from '../../types'

// ── Node colors ───────────────────────────────────────────────
const NODE_STYLES = {
  self:     { bg: '#f5f3ff', border: '#8b5cf6', text: '#5b21b6', label: '自分' },
  issue:    { bg: '#fff7ed', border: '#f97316', text: '#c2410c', label: '課題' },
  plan:     { bg: '#f0fdf4', border: '#22c55e', text: '#15803d', label: '計画' },
  business: { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8', label: '事業構想' },
}

// ── Generic node component ────────────────────────────────────
function IssueNode({ data, selected }: { data: Record<string, unknown>; selected?: boolean }) {
  const kind = (data.kind ?? 'issue') as keyof typeof NODE_STYLES
  const style = NODE_STYLES[kind] ?? NODE_STYLES.issue
  return (
    <div style={{
      background: style.bg,
      border: `1.5px solid ${selected ? '#6366f1' : style.border}`,
      color: style.text,
      borderRadius: 10,
      padding: '6px 12px',
      fontSize: 12,
      fontWeight: 500,
      minWidth: 100,
      maxWidth: 200,
      wordBreak: 'break-word',
      boxShadow: selected ? '0 0 0 2px #a5b4fc' : '0 1px 4px rgba(0,0,0,0.08)',
      cursor: 'default',
    }}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} id="l" style={{ opacity: 0 }} />
      <div style={{ fontSize: 9, opacity: 0.6, marginBottom: 2 }}>{style.label}</div>
      {data.label as string}
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} id="r" style={{ opacity: 0 }} />
    </div>
  )
}

const nodeTypes = { issueNode: IssueNode }

// ── Custom causal edge — +/- badge is clickable to toggle ─────
function CausalEdge({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  data, markerEnd,
}: EdgeProps) {
  const updateIssueMapEdge = useAppStore((s) => s.updateIssueMapEdge)

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  })
  const dir = (data as { direction?: string })?.direction ?? '+'
  const isPos = dir === '+'
  const color = isPos ? '#16a34a' : '#dc2626'
  const reason = (data as { reason?: string })?.reason ?? ''

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd}
        style={{ stroke: color, strokeWidth: 1.8 }} />
      <EdgeLabelRenderer>
        <div style={{
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          pointerEvents: 'all',
          zIndex: 10,
        }}>
          <div
            onClick={() => updateIssueMapEdge(id, { direction: (dir === '+' ? '-' : '+') as '+' | '-' })}
            style={{
              background: isPos ? '#dcfce7' : '#fee2e2',
              border: `1px solid ${color}`,
              color,
              borderRadius: 999,
              padding: '1px 7px',
              fontSize: 11,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              userSelect: 'none',
            }}
            title={reason ? `${reason}\n（クリックで+/-切り替え）` : 'クリックで+/-切り替え'}>
            {dir}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

const edgeTypes = { causalEdge: CausalEdge }

// ── Add business node modal ───────────────────────────────────
function AddBizNodeModal({ onClose, onAdd }: {
  onClose: () => void
  onAdd: (label: string, description: string) => void
}) {
  const [label, setLabel] = useState('')
  const [desc, setDesc] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-96">
        <p className="text-sm font-semibold text-gray-800 mb-4">事業構想ノードを追加</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">事業名・取り組み名</label>
            <input autoFocus value={label} onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey && label.trim()) onAdd(label, desc) }}
              placeholder="例：地域新電力事業"
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">説明（任意）</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
              placeholder="事業の概要や目的…"
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">キャンセル</button>
          <button onClick={() => label.trim() && onAdd(label, desc)}
            disabled={!label.trim()}
            className="px-4 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-40">
            追加
          </button>
        </div>
      </div>
    </div>
  )
}

// ── AI suggestions panel ──────────────────────────────────────
type NodeSuggestion = {
  id: string
  fromNodeId: string
  fromLabel: string
  suggestedLabel: string
  direction: '+' | '-'
  reason: string
}

function SuggestionsPanel({
  suggestions, loading, onAccept, onDismiss, onDismissAll,
}: {
  suggestions: NodeSuggestion[]
  loading: boolean
  onAccept: (s: NodeSuggestion) => void
  onDismiss: (id: string) => void
  onDismissAll: () => void
}) {
  if (!loading && suggestions.length === 0) return null
  return (
    <div className="absolute top-3 right-3 z-20 w-72 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-indigo-500" />
          <span className="text-xs font-semibold text-gray-700">AI関連要素の提案</span>
        </div>
        {suggestions.length > 0 && (
          <button onClick={onDismissAll} className="text-xs text-gray-400 hover:text-gray-600">全て消す</button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {loading && (
          <div className="flex items-center gap-2 px-4 py-3 text-xs text-gray-500">
            <Loader2 size={12} className="animate-spin" /> 関連要素を提案中…
          </div>
        )}
        {suggestions.map((s) => {
          const isPos = s.direction === '+'
          return (
            <div key={s.id} className="px-4 py-3 border-b border-gray-50 last:border-0">
              <div className="text-xs text-gray-400 mb-1.5">
                「<span className="text-gray-600 font-medium">{s.fromLabel}</span>」の関連課題
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${isPos ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {s.direction}
                </span>
                <span className="text-xs font-semibold text-gray-800">{s.suggestedLabel}</span>
              </div>
              {s.reason && (
                <p className="text-xs text-gray-400 mb-2 leading-relaxed">{s.reason}</p>
              )}
              <div className="flex gap-1.5">
                <button onClick={() => onAccept(s)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500">
                  <Check size={10} /> 課題として追加
                </button>
                <button onClick={() => onDismiss(s.id)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50">
                  <X size={10} /> スキップ
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Node edit panel ───────────────────────────────────────────
function NodePanel({
  nodeKind, nodeLabel, onConvertToIssue, onDelete, onClose,
}: {
  nodeKind: keyof typeof NODE_STYLES
  nodeLabel: string
  onConvertToIssue?: () => void
  onDelete: () => void
  onClose: () => void
}) {
  return (
    <div className="absolute top-3 left-3 z-20 bg-white border border-gray-200 rounded-2xl shadow-lg p-4 w-52">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-700 truncate pr-2">{nodeLabel}</span>
        <button onClick={onClose} className="shrink-0 text-gray-400 hover:text-gray-600">
          <X size={12} />
        </button>
      </div>
      <div className="space-y-2">
        {nodeKind === 'business' && onConvertToIssue && (
          <button onClick={onConvertToIssue}
            className="w-full text-xs px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 transition-colors">
            課題として再分類
          </button>
        )}
        <button onClick={onDelete}
          className="w-full text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
          削除
        </button>
      </div>
    </div>
  )
}

// ── Default position layout (circle) ─────────────────────────
function defaultPosition(index: number, total: number): { x: number; y: number } {
  if (total <= 1) return { x: 400, y: 300 }
  const angle = (2 * Math.PI * index) / total - Math.PI / 2
  const r = Math.min(200 + total * 15, 350)
  return { x: 400 + r * Math.cos(angle), y: 300 + r * Math.sin(angle) }
}

// ── Draw helpers ──────────────────────────────────────────────
type DrawPath = { d: string; color: string }
const DRAW_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#111827']

function buildSmoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length - 1; i++) {
    const midX = (pts[i].x + pts[i + 1].x) / 2
    const midY = (pts[i].y + pts[i + 1].y) / 2
    d += ` Q ${pts[i].x} ${pts[i].y} ${midX} ${midY}`
  }
  d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`
  return d
}

// ── Helpers ───────────────────────────────────────────────────
function nodeIdFor(kind: string, id: string) { return `${kind}-${id}` }

function toFlowNode(id: string, label: string, kind: keyof typeof NODE_STYLES, pos: { x: number; y: number }): Node {
  return {
    id, position: pos,
    type: 'issueNode',
    data: { label, kind },
    style: { width: 'auto', height: 'auto' },
  }
}

function toFlowEdge(e: IssueMapEdge): Edge {
  return {
    id: e.id, source: e.source, target: e.target,
    type: 'causalEdge',
    data: { direction: e.direction, reason: e.reason },
    markerEnd: { type: MarkerType.ArrowClosed, color: e.direction === '+' ? '#16a34a' : '#dc2626' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reconnectable: true as any,
  }
}

// ── Main component ────────────────────────────────────────────
export default function IssueMapView() {
  const {
    selfItems, issues, plans, businessNodes,
    issueMapEdges, issueMapPositions,
    addIssue, addIssueMapEdge, deleteIssueMapEdge, updateIssueMapEdge,
    updateIssueMapPosition, addBusinessNode,
    convertBusinessNodeToIssue, deleteBusinessNode, deleteIssue,
  } = useAppStore(useShallow((s) => ({
    selfItems: s.selfItems,
    issues: s.issues,
    plans: s.plans,
    businessNodes: s.businessNodes,
    issueMapEdges: s.issueMapEdges,
    issueMapPositions: s.issueMapPositions,
    addIssue: s.addIssue,
    addIssueMapEdge: s.addIssueMapEdge,
    deleteIssueMapEdge: s.deleteIssueMapEdge,
    updateIssueMapEdge: s.updateIssueMapEdge,
    updateIssueMapPosition: s.updateIssueMapPosition,
    addBusinessNode: s.addBusinessNode,
    convertBusinessNodeToIssue: s.convertBusinessNodeToIssue,
    deleteBusinessNode: s.deleteBusinessNode,
    deleteIssue: s.deleteIssue,
  })))

  const { suggestRelatedNodes, loading: aiLoading } = useGroqAI()

  // Build canonical node list
  const allNodeDefs = useMemo(() => {
    const total = selfItems.length + issues.length + plans.length + businessNodes.length
    const defs: Array<{ nodeId: string; label: string; kind: keyof typeof NODE_STYLES }> = []
    selfItems.forEach((s) => defs.push({ nodeId: nodeIdFor('self', s.id), label: s.content, kind: 'self' }))
    issues.forEach((i) => defs.push({ nodeId: nodeIdFor('issue', i.id), label: i.title, kind: 'issue' }))
    plans.forEach((p) => defs.push({ nodeId: nodeIdFor('plan', p.id), label: p.title, kind: 'plan' }))
    businessNodes.forEach((b) => defs.push({ nodeId: nodeIdFor('biz', b.id), label: b.label, kind: 'business' }))
    return { defs, total }
  }, [selfItems, issues, plans, businessNodes])

  // React Flow state
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(
    allNodeDefs.defs.map((d, i) =>
      toFlowNode(d.nodeId, d.label, d.kind,
        issueMapPositions[d.nodeId] ?? defaultPosition(i, allNodeDefs.total))
    )
  )
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(issueMapEdges.map(toFlowEdge))

  // Sync when node set changes
  const nodeIdKey = allNodeDefs.defs.map((d) => d.nodeId).join(',')
  const prevNodeIdKey = useRef(nodeIdKey)

  useEffect(() => {
    if (nodeIdKey === prevNodeIdKey.current) return
    prevNodeIdKey.current = nodeIdKey

    const currentIds = new Set(allNodeDefs.defs.map((d) => d.nodeId))
    setFlowNodes((prev) => {
      const filtered = prev.filter((n) => currentIds.has(n.id))
      const existingIds = new Set(filtered.map((n) => n.id))
      const newNodes = allNodeDefs.defs
        .filter((d) => !existingIds.has(d.nodeId))
        .map((d) => {
          const absIdx = allNodeDefs.defs.findIndex((x) => x.nodeId === d.nodeId)
          return toFlowNode(d.nodeId, d.label, d.kind,
            issueMapPositions[d.nodeId] ?? defaultPosition(absIdx, allNodeDefs.total))
        })
      return [...filtered, ...newNodes]
    })
  }, [nodeIdKey])

  // Sync edges from Zustand
  useEffect(() => {
    setFlowEdges(issueMapEdges.map(toFlowEdge))
  }, [issueMapEdges])

  // AI suggestions — propose related new issues for each added node
  const [suggestions, setSuggestions] = useState<NodeSuggestion[]>([])
  const prevNodeCount = useRef(allNodeDefs.defs.length)

  useEffect(() => {
    const current = allNodeDefs.defs.length
    if (current <= prevNodeCount.current || current < 1) {
      prevNodeCount.current = current
      return
    }
    const newNode = allNodeDefs.defs[current - 1]
    prevNodeCount.current = current

    const existingLabels = allNodeDefs.defs.slice(0, -1).map((d) => d.label)
    suggestRelatedNodes(newNode.label, existingLabels).then((results) => {
      const newSuggestions: NodeSuggestion[] = results.map((r) => ({
        id: nanoid(),
        fromNodeId: newNode.nodeId,
        fromLabel: newNode.label,
        suggestedLabel: r.label,
        direction: r.direction,
        reason: r.reason,
      }))
      if (newSuggestions.length > 0) setSuggestions((prev) => [...prev, ...newSuggestions])
    })
  }, [nodeIdKey])

  // Accept suggestion → add as Issue + causal edge
  const handleAcceptSuggestion = (s: NodeSuggestion) => {
    const newId = nanoid()
    addIssue({ id: newId, title: s.suggestedLabel, category: 'other', description: s.reason })
    addIssueMapEdge({
      id: `edge-${nanoid()}`,
      source: s.fromNodeId,
      target: `issue-${newId}`,
      direction: s.direction,
      reason: s.reason,
    })
    setSuggestions((prev) => prev.filter((x) => x.id !== s.id))
  }

  // Node selection panel
  const [selectedPanel, setSelectedPanel] = useState<{ id: string; kind: keyof typeof NODE_STYLES; label: string } | null>(null)

  const handleNodeClick = useCallback((_: unknown, node: Node) => {
    const def = allNodeDefs.defs.find((d) => d.nodeId === node.id)
    if (def) setSelectedPanel({ id: node.id, kind: def.kind, label: def.label })
  }, [allNodeDefs.defs])

  const handleConvertToIssue = useCallback(() => {
    if (!selectedPanel) return
    const bizId = selectedPanel.id.replace(/^biz-/, '')
    const newId = nanoid()
    convertBusinessNodeToIssue(bizId, { id: newId, title: selectedPanel.label, category: 'other' })
    setSelectedPanel(null)
  }, [selectedPanel, convertBusinessNodeToIssue])

  const handleDeleteSelectedNode = useCallback(() => {
    if (!selectedPanel) return
    const { id, kind } = selectedPanel
    if (kind === 'business') deleteBusinessNode(id.replace(/^biz-/, ''))
    else if (kind === 'issue') deleteIssue(id.replace(/^issue-/, ''))
    setSelectedPanel(null)
  }, [selectedPanel, deleteBusinessNode, deleteIssue])

  // Connection mode + edge handlers
  const [connectionMode, setConnectionMode] = useState<'+' | '-'>('+')
  const [showBizModal, setShowBizModal] = useState(false)

  const onConnect = useCallback((params: Connection) => {
    addIssueMapEdge({
      id: `edge-${nanoid()}`,
      source: params.source,
      target: params.target,
      direction: connectionMode,
    })
  }, [connectionMode, addIssueMapEdge])

  const handleReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    updateIssueMapEdge(oldEdge.id, {
      source: newConnection.source,
      target: newConnection.target,
    })
  }, [updateIssueMapEdge])

  const handleNodeDragStop = useCallback((_: unknown, node: Node) => {
    updateIssueMapPosition(node.id, node.position)
  }, [updateIssueMapPosition])

  const handleEdgesChange = useCallback((changes: Parameters<typeof onEdgesChange>[0]) => {
    onEdgesChange(changes)
    const removed = changes.filter((c) => c.type === 'remove').map((c) => c.id)
    if (removed.length > 0) removed.forEach(deleteIssueMapEdge)
  }, [onEdgesChange, deleteIssueMapEdge])

  const handleAddBizNode = (label: string, description: string) => {
    const node: BusinessNode = { id: nanoid(), label, description }
    addBusinessNode(node)
    setShowBizModal(false)
  }

  // ── Draw mode ─────────────────────────────────────────────────
  const [drawMode, setDrawMode] = useState(false)
  const [drawColor, setDrawColor] = useState(DRAW_COLORS[0])
  const [drawPaths, setDrawPaths] = useState<DrawPath[]>([])
  const [currentDrawPath, setCurrentDrawPath] = useState('')

  const drawState = useRef({ isDrawing: false, points: [] as { x: number; y: number }[], color: DRAW_COLORS[0] })

  const handleDrawPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drawState.current.isDrawing = true
    drawState.current.color = drawColor
    drawState.current.points = []
    const rect = e.currentTarget.getBoundingClientRect()
    drawState.current.points.push({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [drawColor])

  const handleDrawPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawState.current.isDrawing) return
    const rect = e.currentTarget.getBoundingClientRect()
    drawState.current.points.push({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setCurrentDrawPath(buildSmoothPath(drawState.current.points))
  }, [])

  const handleDrawPointerUp = useCallback(() => {
    if (!drawState.current.isDrawing) return
    drawState.current.isDrawing = false
    const finalPath = buildSmoothPath(drawState.current.points)
    if (finalPath) {
      setDrawPaths((prev) => [...prev, { d: finalPath, color: drawState.current.color }])
    }
    setCurrentDrawPath('')
    drawState.current.points = []
  }, [])

  const isEmpty = allNodeDefs.defs.length === 0

  return (
    <div className="relative w-full h-full bg-slate-50">
      {/* AI suggestions panel */}
      <SuggestionsPanel
        suggestions={suggestions}
        loading={aiLoading}
        onAccept={handleAcceptSuggestion}
        onDismiss={(id) => setSuggestions((prev) => prev.filter((s) => s.id !== id))}
        onDismissAll={() => setSuggestions([])}
      />

      {/* Node edit panel */}
      {selectedPanel && (
        <NodePanel
          nodeKind={selectedPanel.kind}
          nodeLabel={selectedPanel.label}
          onConvertToIssue={selectedPanel.kind === 'business' ? handleConvertToIssue : undefined}
          onDelete={handleDeleteSelectedNode}
          onClose={() => setSelectedPanel(null)}
        />
      )}

      {/* Freehand draw SVG overlay */}
      <svg
        style={{
          position: 'absolute', inset: 0, zIndex: 25,
          width: '100%', height: '100%',
          pointerEvents: drawMode ? 'auto' : 'none',
          cursor: drawMode ? 'crosshair' : 'default',
        }}
        onPointerDown={handleDrawPointerDown}
        onPointerMove={handleDrawPointerMove}
        onPointerUp={handleDrawPointerUp}
      >
        {drawPaths.map((p, i) => (
          <path key={i} d={p.d} stroke={p.color} strokeWidth={2.5}
            fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {currentDrawPath && (
          <path d={currentDrawPath} stroke={drawColor} strokeWidth={2.5}
            fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>

      {/* Bottom toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white border border-gray-200 rounded-2xl shadow-lg px-4 py-2">
        {!drawMode && (
          <>
            {/* Connection type toggle */}
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>接続:</span>
              <button onClick={() => setConnectionMode('+')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${connectionMode === '+' ? 'bg-green-100 text-green-700 border border-green-300' : 'text-gray-400 hover:bg-gray-100'}`}>
                ＋強化
              </button>
              <button onClick={() => setConnectionMode('-')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${connectionMode === '-' ? 'bg-red-100 text-red-700 border border-red-300' : 'text-gray-400 hover:bg-gray-100'}`}>
                −抑制
              </button>
            </div>
            <div className="w-px h-5 bg-gray-200" />
            <button onClick={() => setShowBizModal(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors">
              <Plus size={12} />
              事業構想を追加
            </button>
            <div className="w-px h-5 bg-gray-200" />
            {/* Legend */}
            <div className="flex gap-2">
              {Object.entries(NODE_STYLES).map(([k, s]) => (
                <div key={k} className="flex items-center gap-1 text-xs" style={{ color: s.text }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.border }} />
                  {s.label}
                </div>
              ))}
            </div>
            <div className="w-px h-5 bg-gray-200" />
          </>
        )}

        {/* Draw mode toggle */}
        <button onClick={() => setDrawMode((v) => !v)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-colors ${
            drawMode ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'
          }`}>
          <Pencil size={12} />
          {drawMode ? '手書き中' : '手書き'}
        </button>

        {drawMode && (
          <>
            {DRAW_COLORS.map((c) => (
              <button key={c} onClick={() => setDrawColor(c)}
                className="w-5 h-5 rounded-full border-2 transition-transform"
                style={{
                  background: c,
                  borderColor: drawColor === c ? '#6366f1' : 'white',
                  transform: drawColor === c ? 'scale(1.25)' : 'scale(1)',
                }} />
            ))}
            {drawPaths.length > 0 && (
              <button onClick={() => setDrawPaths([])}
                className="flex items-center gap-1 text-xs px-2.5 py-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <X size={10} /> 全消し
              </button>
            )}
          </>
        )}
      </div>

      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onReconnect={handleReconnect as any}
        onNodeDragStop={handleNodeDragStop}
        onNodeClick={handleNodeClick}
        onPaneClick={() => setSelectedPanel(null)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        deleteKeyCode="Delete"
        panOnDrag={!drawMode}
        nodesDraggable={!drawMode}
        nodesConnectable={!drawMode}
      >
        <Background color="#cbd5e1" gap={24} size={1} />
        <Controls style={{ background: '#fff', border: '1px solid #e2e8f0' }} />
        <MiniMap
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
          nodeColor={(n) => NODE_STYLES[(n.data as { kind?: string }).kind as keyof typeof NODE_STYLES]?.border ?? '#94a3b8'}
        />
      </ReactFlow>

      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-sm text-gray-400 leading-relaxed">
              左パネルで自己探索・課題・計画を追加するか<br />
              「事業構想を追加」ボタンで要素を配置してください
            </p>
            <p className="text-xs text-gray-300 mt-2">要素を追加するとAIが関連課題を提案します</p>
          </div>
        </div>
      )}

      {showBizModal && (
        <AddBizNodeModal onClose={() => setShowBizModal(false)} onAdd={handleAddBizNode} />
      )}
    </div>
  )
}
