import { useCallback, useEffect, useRef } from 'react'
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
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { nanoid } from 'nanoid'
import { useAppStore } from '../../store/useAppStore'
import { useShallow } from 'zustand/react/shallow'
import type { MapNode, MapEdge, NodeType } from '../../types'

const NODE_COLORS: Record<NodeType, { bg: string; border: string; text: string }> = {
  self:  { bg: '#eef2ff', border: '#6366f1', text: '#4338ca' },
  issue: { bg: '#fff7ed', border: '#f97316', text: '#c2410c' },
  plan:  { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
  note:  { bg: '#f8fafc', border: '#94a3b8', text: '#475569' },
}

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  self: '自分', issue: '課題', plan: '計画', note: 'メモ',
}

function toFlowNode(n: MapNode): Node {
  const colors = NODE_COLORS[n.type]
  return {
    id: n.id,
    position: n.position,
    data: { label: n.label, type: n.type },
    style: {
      background: colors.bg,
      border: `1.5px solid ${colors.border}`,
      color: colors.text,
      borderRadius: '12px',
      padding: '8px 14px',
      fontSize: '12px',
      fontWeight: 500,
      minWidth: '120px',
      maxWidth: '200px',
      wordBreak: 'break-word',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    },
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

export default function MindMapView() {
  const { mapNodes, mapEdges, setMapNodes, setMapEdges } = useAppStore(useShallow((s) => ({
    mapNodes: s.mapNodes,
    mapEdges: s.mapEdges,
    setMapNodes: s.setMapNodes,
    setMapEdges: s.setMapEdges,
  })))

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(mapNodes.map(toFlowNode))
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(mapEdges.map(toFlowEdge))

  // Sync new/removed nodes from Zustand → React Flow (preserves measured state for existing nodes)
  const syncedIds = useRef<Set<string>>(new Set(mapNodes.map(n => n.id)))
  useEffect(() => {
    const currentIds = new Set(mapNodes.map(n => n.id))
    setFlowNodes(prev => {
      const filtered = prev.filter(n => currentIds.has(n.id))
      const existingIds = new Set(filtered.map(n => n.id))
      const newNodes = mapNodes.filter(n => !existingIds.has(n.id)).map(toFlowNode)
      return [...filtered, ...newNodes]
    })
    syncedIds.current = currentIds
  }, [mapNodes])

  useEffect(() => {
    setFlowEdges(mapEdges.map(toFlowEdge))
  }, [mapEdges])

  // Sync position changes from React Flow → Zustand
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes)
    const positionChanges = changes.filter(
      (c): c is NodeChange & { type: 'position'; position: { x: number; y: number } } =>
        c.type === 'position' && !!(c as NodeChange & { position?: unknown }).position
    )
    if (positionChanges.length > 0) {
      setMapNodes(
        mapNodes.map(n => {
          const change = positionChanges.find(c => c.id === n.id)
          return change ? { ...n, position: (change as { position: { x: number; y: number } }).position } : n
        })
      )
    }
  }, [onNodesChange, mapNodes, setMapNodes])

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes)
    const removedIds = changes.filter(c => c.type === 'remove').map(c => c.id)
    if (removedIds.length > 0) {
      setMapEdges(mapEdges.filter(e => !removedIds.includes(e.id)))
    }
  }, [onEdgesChange, mapEdges, setMapEdges])

  const onConnect = useCallback((params: Connection) => {
    const newEdge: MapEdge = { id: `edge-manual-${nanoid()}`, source: params.source, target: params.target }
    setMapEdges([...mapEdges, newEdge])
    setFlowEdges(prev => [...prev, toFlowEdge(newEdge)])
  }, [mapEdges, setMapEdges, setFlowEdges])

  const addNoteNode = () => {
    const newNode: MapNode = {
      id: `node-note-${nanoid()}`, type: 'note', label: 'メモ',
      position: { x: 300 + Math.random() * 200, y: 200 + Math.random() * 200 },
    }
    setMapNodes([...mapNodes, newNode])
  }

  return (
    <div className="relative w-full h-full bg-gray-50">
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
        {(Object.entries(NODE_COLORS) as [NodeType, typeof NODE_COLORS[NodeType]][]).map(([type, colors]) => (
          <div key={type} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full border shadow-sm"
            style={{ background: colors.bg, borderColor: colors.border, color: colors.text }}>
            {NODE_TYPE_LABELS[type]}
          </div>
        ))}
        <button onClick={addNoteNode}
          className="text-xs px-2 py-1 rounded-full bg-white border border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 shadow-sm transition-colors">
          + メモ追加
        </button>
      </div>

      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e2e8f0" gap={24} />
        <Controls style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }} />
        <MiniMap
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
          nodeColor={(n) => NODE_COLORS[(n.data as { type: NodeType }).type]?.border ?? '#94a3b8'}
        />
      </ReactFlow>

      {mapNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-gray-400 text-center">
            左パネルで要素を追加すると<br />ここにノードが表示されます
          </p>
        </div>
      )}
    </div>
  )
}
