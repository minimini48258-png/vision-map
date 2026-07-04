import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
  NodeResizer,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { nanoid } from 'nanoid'
import { useAppStore } from '../../store/useAppStore'
import { useShallow } from 'zustand/react/shallow'
import type { MapNode, MapEdge, NodeType } from '../../types'

// ── Preset colors ──────────────────────────────────────────────
const PRESET_COLORS = [
  '#6366f1', '#f97316', '#22c55e', '#ec4899', '#0ea5e9',
  '#a855f7', '#eab308', '#ef4444', '#14b8a6', '#64748b',
]

const DATA_NODE_STYLE: Record<'self' | 'issue' | 'plan', { bg: string; border: string; text: string }> = {
  self:  { bg: '#eef2ff', border: '#6366f1', text: '#4338ca' },
  issue: { bg: '#fff7ed', border: '#f97316', text: '#c2410c' },
  plan:  { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
}

// ── Handle set (shown on all sides) ───────────────────────────
function Handles() {
  return (
    <>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-gray-400 !border-white !border-2 opacity-0 hover:opacity-100 group-hover:opacity-100" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-gray-400 !border-white !border-2 opacity-0 hover:opacity-100 group-hover:opacity-100" />
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-gray-400 !border-white !border-2 opacity-0 hover:opacity-100 group-hover:opacity-100" id="l" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-gray-400 !border-white !border-2 opacity-0 hover:opacity-100 group-hover:opacity-100" id="r" />
    </>
  )
}

// ── Data node (self / issue / plan) ───────────────────────────
function DataNode({ data, selected }: NodeProps) {
  const d = data as { label: string; nodeType: 'self' | 'issue' | 'plan'; editable?: boolean }
  const style = DATA_NODE_STYLE[d.nodeType]
  return (
    <div className="group relative"
      style={{
        background: style.bg,
        border: `1.5px solid ${selected ? '#6366f1' : style.border}`,
        color: style.text,
        borderRadius: 12,
        padding: '8px 14px',
        fontSize: 12,
        fontWeight: 500,
        minWidth: 120,
        maxWidth: 220,
        wordBreak: 'break-word',
        boxShadow: selected ? `0 0 0 2px #a5b4fc` : '0 1px 4px rgba(0,0,0,0.08)',
        cursor: 'default',
      }}>
      <Handles />
      {d.label}
    </div>
  )
}

// ── Shape node (rect / circle / diamond) ──────────────────────
function ShapeNode({ data, selected }: NodeProps) {
  const d = data as {
    label: string; shapeType: 'rect' | 'circle' | 'diamond'
    bgColor: string; borderColor: string; textColor: string; fontSize: number
  }

  const base: React.CSSProperties = {
    width: '100%', height: '100%',
    background: d.bgColor,
    border: `1.5px solid ${selected ? '#6366f1' : d.borderColor}`,
    color: d.textColor,
    fontSize: d.fontSize,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxSizing: 'border-box',
    wordBreak: 'break-word',
    textAlign: 'center',
    padding: '6px 10px',
    boxShadow: selected ? '0 0 0 2px #a5b4fc' : '0 1px 4px rgba(0,0,0,0.08)',
    cursor: 'default',
  }

  const shapeStyle: React.CSSProperties =
    d.shapeType === 'circle' ? { ...base, borderRadius: '50%' }
    : d.shapeType === 'diamond' ? { ...base, transform: 'rotate(45deg)', borderRadius: 4 }
    : { ...base, borderRadius: 8 }

  const labelStyle: React.CSSProperties =
    d.shapeType === 'diamond' ? { transform: 'rotate(-45deg)', pointerEvents: 'none' } : {}

  return (
    <div className="group relative" style={{ width: '100%', height: '100%' }}>
      <NodeResizer
        isVisible={selected}
        minWidth={80} minHeight={40}
        lineStyle={{ borderColor: '#6366f1' }}
        handleStyle={{ width: 8, height: 8, background: '#6366f1', border: '2px solid white', borderRadius: 2 }}
      />
      <Handles />
      <div style={shapeStyle}>
        <span style={labelStyle}>{d.label}</span>
      </div>
    </div>
  )
}

// ── Text node ─────────────────────────────────────────────────
function TextNode({ data, selected }: NodeProps) {
  const d = data as { label: string; textColor: string; fontSize: number }
  return (
    <div className="group relative"
      style={{
        color: d.textColor,
        fontSize: d.fontSize,
        fontWeight: 500,
        minWidth: 60,
        cursor: 'default',
        border: selected ? '1px dashed #6366f1' : '1px dashed transparent',
        borderRadius: 4,
        padding: '2px 6px',
        wordBreak: 'break-word',
      }}>
      <Handles />
      {d.label}
    </div>
  )
}

// ── Note node ─────────────────────────────────────────────────
function NoteNode({ data, selected }: NodeProps) {
  const d = data as { label: string }
  return (
    <div className="group relative"
      style={{
        background: '#fefce8',
        border: `1.5px solid ${selected ? '#6366f1' : '#fde047'}`,
        color: '#713f12',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        minWidth: 100,
        maxWidth: 200,
        wordBreak: 'break-word',
        boxShadow: selected ? '0 0 0 2px #a5b4fc' : '0 2px 6px rgba(0,0,0,0.1)',
        cursor: 'default',
      }}>
      <Handles />
      {d.label}
    </div>
  )
}

const nodeTypes = {
  dataNode: DataNode,
  shapeNode: ShapeNode,
  textNode: TextNode,
  noteNode: NoteNode,
}

// ── Conversion helpers ────────────────────────────────────────
function toFlowNode(n: MapNode): Node {
  const w = n.width ?? 140
  const h = n.height ?? 50

  if (n.type === 'self' || n.type === 'issue' || n.type === 'plan') {
    return {
      id: n.id, position: n.position,
      type: 'dataNode',
      data: { label: n.label, nodeType: n.type },
      style: { width: 'auto', height: 'auto' },
    }
  }
  if (n.type === 'rect' || n.type === 'circle' || n.type === 'diamond') {
    return {
      id: n.id, position: n.position,
      type: 'shapeNode',
      data: {
        label: n.label,
        shapeType: n.type,
        bgColor: n.bgColor ?? '#eef2ff',
        borderColor: n.borderColor ?? '#6366f1',
        textColor: n.textColor ?? '#4338ca',
        fontSize: n.fontSize ?? 12,
      },
      style: { width: w, height: h },
    }
  }
  if (n.type === 'text') {
    return {
      id: n.id, position: n.position,
      type: 'textNode',
      data: { label: n.label, textColor: n.textColor ?? '#111827', fontSize: n.fontSize ?? 14 },
      style: { width: 'auto', height: 'auto' },
    }
  }
  // note
  return {
    id: n.id, position: n.position,
    type: 'noteNode',
    data: { label: n.label },
    style: { width: 'auto', height: 'auto' },
  }
}

function toFlowEdge(e: MapEdge): Edge {
  return {
    id: e.id, source: e.source, target: e.target, label: e.label,
    style: { stroke: '#94a3b8', strokeWidth: 1.5 },
    labelStyle: { fill: '#64748b', fontSize: 10 },
    labelBgStyle: { fill: '#ffffff' },
    labelBgPadding: [4, 2],
  }
}

// ── Toolbar config ────────────────────────────────────────────
type ToolType = 'select' | 'rect' | 'circle' | 'diamond' | 'text' | 'note'

const TOOLS: { type: ToolType; label: string; icon: string }[] = [
  { type: 'select', label: '選択', icon: '↖' },
  { type: 'rect',   label: '四角形', icon: '▭' },
  { type: 'circle', label: '円',    icon: '○' },
  { type: 'diamond',label: 'ひし形', icon: '◇' },
  { type: 'text',   label: 'テキスト', icon: 'T' },
  { type: 'note',   label: '付箋', icon: '📝' },
]

const DEFAULT_COLORS: Record<ToolType, { bg: string; border: string; text: string }> = {
  select:  { bg: '#eef2ff', border: '#6366f1', text: '#4338ca' },
  rect:    { bg: '#eef2ff', border: '#6366f1', text: '#4338ca' },
  circle:  { bg: '#fff7ed', border: '#f97316', text: '#c2410c' },
  diamond: { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
  text:    { bg: 'transparent', border: 'transparent', text: '#111827' },
  note:    { bg: '#fefce8', border: '#fde047', text: '#713f12' },
}

// ── Label edit modal ──────────────────────────────────────────
function LabelModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (label: string) => void }) {
  const [val, setVal] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-80">
        <p className="text-sm font-semibold text-gray-800 mb-3">ラベルを入力</p>
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) onConfirm(val); if (e.key === 'Escape') onClose() }}
          placeholder="テキスト… (Ctrl+Enter で確定)"
          className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
        />
        <div className="flex gap-2 mt-3 justify-end">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">キャンセル</button>
          <button onClick={() => onConfirm(val)} className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-500">追加</button>
        </div>
      </div>
    </div>
  )
}

// ── Style panel ───────────────────────────────────────────────
function StylePanel({
  selectedNode, onUpdateNode, onDeleteNode,
}: {
  selectedNode: MapNode | null
  onUpdateNode: (id: string, patch: Partial<MapNode>) => void
  onDeleteNode: (id: string) => void
}) {
  if (!selectedNode) return null
  const isShape = ['rect', 'circle', 'diamond'].includes(selectedNode.type)
  const isText = selectedNode.type === 'text'

  return (
    <div className="absolute top-12 right-3 z-20 bg-white border border-gray-200 rounded-2xl shadow-lg p-4 w-52">
      <p className="text-xs font-semibold text-gray-600 mb-3">スタイル</p>

      <div className="space-y-3">
        {/* Label */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">ラベル</label>
          <input
            value={selectedNode.label}
            onChange={(e) => onUpdateNode(selectedNode.id, { label: e.target.value })}
            className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Fill color */}
        {(isShape) && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">塗りつぶし</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button key={c} onClick={() => onUpdateNode(selectedNode.id, { bgColor: c + '33', borderColor: c })}
                  className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                  style={{ background: c }} />
              ))}
            </div>
          </div>
        )}

        {/* Text color */}
        {(isShape || isText) && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">文字色</label>
            <div className="flex flex-wrap gap-1.5">
              {['#111827', '#4338ca', '#c2410c', '#15803d', '#be185d', '#0369a1'].map((c) => (
                <button key={c} onClick={() => onUpdateNode(selectedNode.id, { textColor: c })}
                  className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                  style={{ background: c }} />
              ))}
            </div>
          </div>
        )}

        {/* Font size */}
        {(isShape || isText) && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">文字サイズ</label>
            <div className="flex gap-1">
              {[10, 12, 14, 18, 24].map((s) => (
                <button key={s} onClick={() => onUpdateNode(selectedNode.id, { fontSize: s })}
                  className={`flex-1 py-1 text-xs rounded-lg border transition-colors ${
                    selectedNode.fontSize === s ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Delete */}
        <button onClick={() => onDeleteNode(selectedNode.id)}
          className="w-full text-xs py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors mt-1">
          削除
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function MindMapView() {
  const { mapNodes, mapEdges, setMapNodes, setMapEdges } = useAppStore(useShallow((s) => ({
    mapNodes: s.mapNodes,
    mapEdges: s.mapEdges,
    setMapNodes: s.setMapNodes,
    setMapEdges: s.setMapEdges,
  })))

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(mapNodes.map(toFlowNode))
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(mapEdges.map(toFlowEdge))

  const [activeTool, setActiveTool] = useState<ToolType>('select')
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number } | null>(null)
  const [pendingTool, setPendingTool] = useState<ToolType | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const rfInstance = useRef<{ screenToFlowPosition: (pos: { x: number; y: number }) => { x: number; y: number } } | null>(null)

  // Sync new/removed nodes from Zustand → React Flow
  useEffect(() => {
    const currentIds = new Set(mapNodes.map((n) => n.id))
    setFlowNodes((prev) => {
      const filtered = prev.filter((n) => currentIds.has(n.id))
      const existingIds = new Set(filtered.map((n) => n.id))
      const newNodes = mapNodes.filter((n) => !existingIds.has(n.id)).map(toFlowNode)
      return [...filtered, ...newNodes]
    })
  }, [mapNodes])

  useEffect(() => {
    setFlowEdges(mapEdges.map(toFlowEdge))
  }, [mapEdges])

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes)
    // Sync position changes
    const posChanges = changes.filter(
      (c): c is NodeChange & { type: 'position'; position: { x: number; y: number } } =>
        c.type === 'position' && !!(c as { position?: unknown }).position
    )
    if (posChanges.length > 0) {
      setMapNodes(
        mapNodes.map((n) => {
          const ch = posChanges.find((c) => c.id === n.id)
          return ch ? { ...n, position: (ch as { position: { x: number; y: number } }).position } : n
        })
      )
    }
    // Sync dimension changes for resizable nodes
    const dimChanges = changes.filter((c) => c.type === 'dimensions')
    if (dimChanges.length > 0) {
      setFlowNodes((prev) =>
        prev.map((n) => {
          const ch = dimChanges.find((c) => c.id === n.id) as { dimensions?: { width: number; height: number } } | undefined
          if (ch?.dimensions) {
            return { ...n, style: { ...n.style, width: ch.dimensions.width, height: ch.dimensions.height } }
          }
          return n
        })
      )
    }
  }, [onNodesChange, mapNodes, setMapNodes, setFlowNodes])

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes)
    const removedIds = changes.filter((c) => c.type === 'remove').map((c) => c.id)
    if (removedIds.length > 0) {
      setMapEdges(mapEdges.filter((e) => !removedIds.includes(e.id)))
    }
  }, [onEdgesChange, mapEdges, setMapEdges])

  const onConnect = useCallback((params: Connection) => {
    const newEdge: MapEdge = { id: `edge-${nanoid()}`, source: params.source, target: params.target }
    setMapEdges([...mapEdges, newEdge])
    setFlowEdges((prev) => [...prev, toFlowEdge(newEdge)])
  }, [mapEdges, setMapEdges, setFlowEdges])

  // Canvas click → add node when tool is active
  const onPaneClick = useCallback((event: React.MouseEvent) => {
    if (activeTool === 'select') {
      setSelectedNodeId(null)
      return
    }
    if (!rfInstance.current) return
    const pos = rfInstance.current.screenToFlowPosition({ x: event.clientX, y: event.clientY })
    setPendingPos(pos)
    setPendingTool(activeTool)
  }, [activeTool])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id)
  }, [])

  const addNode = useCallback((label: string) => {
    if (!pendingPos || !pendingTool) return
    const colors = DEFAULT_COLORS[pendingTool]
    const newNode: MapNode = {
      id: `node-${nanoid()}`,
      type: pendingTool as NodeType,
      label: label || (TOOLS.find((t) => t.type === pendingTool)?.label ?? 'ノード'),
      position: pendingPos,
      bgColor: colors.bg,
      borderColor: colors.border,
      textColor: colors.text,
      fontSize: 12,
      width: pendingTool === 'text' ? undefined : 140,
      height: pendingTool === 'text' ? undefined : 80,
    }
    setMapNodes([...mapNodes, newNode])
    setPendingPos(null)
    setPendingTool(null)
    setActiveTool('select')
  }, [pendingPos, pendingTool, mapNodes, setMapNodes])

  const updateNode = useCallback((id: string, patch: Partial<MapNode>) => {
    const updated = mapNodes.map((n) => n.id === id ? { ...n, ...patch } : n)
    setMapNodes(updated)
    setFlowNodes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n
        const updatedMapNode = updated.find((m) => m.id === id)!
        return toFlowNode(updatedMapNode)
      })
    )
  }, [mapNodes, setMapNodes, setFlowNodes])

  const deleteNode = useCallback((id: string) => {
    setMapNodes(mapNodes.filter((n) => n.id !== id))
    setMapEdges(mapEdges.filter((e) => e.source !== id && e.target !== id))
    setSelectedNodeId(null)
  }, [mapNodes, mapEdges, setMapNodes, setMapEdges])

  const selectedMapNode = selectedNodeId ? mapNodes.find((n) => n.id === selectedNodeId) ?? null : null

  return (
    <div ref={reactFlowWrapper} className="relative w-full h-full bg-gray-50">
      {/* Floating toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white border border-gray-200 rounded-2xl shadow-lg px-3 py-2">
        {TOOLS.map((tool) => (
          <button key={tool.type} onClick={() => setActiveTool(tool.type)}
            title={tool.label}
            className={`flex flex-col items-center justify-center w-10 h-10 rounded-xl text-sm transition-colors ${
              activeTool === tool.type
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100'
            }`}>
            <span className="text-base leading-none">{tool.icon}</span>
            <span className="text-[9px] mt-0.5 leading-none">{tool.label}</span>
          </button>
        ))}
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <button
          onClick={() => {
            if (selectedNodeId) {
              const n = mapNodes.find((x) => x.id === selectedNodeId)
              if (n && !n.refId) deleteNode(selectedNodeId)
            }
          }}
          title="削除 (Delete)"
          className="flex flex-col items-center justify-center w-10 h-10 rounded-xl text-sm text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
          <span className="text-base leading-none">🗑</span>
          <span className="text-[9px] mt-0.5 leading-none">削除</span>
        </button>
      </div>

      {/* Style panel */}
      <StylePanel
        selectedNode={selectedMapNode}
        onUpdateNode={updateNode}
        onDeleteNode={deleteNode}
      />

      {/* Tool hint */}
      {activeTool !== 'select' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-full shadow-md pointer-events-none">
          キャンバスをクリックして {TOOLS.find((t) => t.type === activeTool)?.label} を配置
        </div>
      )}

      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        onNodeClick={onNodeClick}
        onInit={(instance) => { rfInstance.current = instance as typeof rfInstance.current }}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        panOnDrag={activeTool === 'select'}
        selectionOnDrag={false}
        deleteKeyCode="Delete"
      >
        <Background color="#e2e8f0" gap={24} />
        <Controls style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }} />
        <MiniMap
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
          nodeColor={(n) => {
            if (n.type === 'dataNode') {
              const nt = (n.data as { nodeType?: string }).nodeType
              return nt === 'self' ? '#6366f1' : nt === 'issue' ? '#f97316' : '#22c55e'
            }
            return (n.data as { borderColor?: string }).borderColor ?? '#94a3b8'
          }}
        />
      </ReactFlow>

      {/* Label input modal */}
      {pendingPos && pendingTool && (
        <LabelModal
          onClose={() => { setPendingPos(null); setPendingTool(null) }}
          onConfirm={addNode}
        />
      )}

      {mapNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-gray-400 text-center leading-relaxed">
            左パネルで要素を追加するか<br />下のツールバーから図形を配置できます
          </p>
        </div>
      )}
    </div>
  )
}
