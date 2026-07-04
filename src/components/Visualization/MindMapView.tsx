import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Connection,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
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

  const flowNodes = mapNodes.map(toFlowNode)
  const flowEdges = mapEdges.map(toFlowEdge)

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const updated = applyNodeChanges(changes, flowNodes)
    setMapNodes(updated.map((n) => ({
      id: n.id,
      type: (n.data as { type: NodeType }).type,
      label: (n.data as { label: string }).label,
      position: n.position,
    })))
  }, [flowNodes, setMapNodes])

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    const updated = applyEdgeChanges(changes, flowEdges)
    setMapEdges(updated.map((e) => ({
      id: e.id, source: e.source, target: e.target,
      label: typeof (e as Edge).label === 'string' ? String((e as Edge).label) : undefined,
    })))
  }, [flowEdges, setMapEdges])

  const onConnect = useCallback((params: Connection) => {
    setMapEdges([...mapEdges, { id: `edge-manual-${nanoid()}`, source: params.source, target: params.target }])
  }, [mapEdges, setMapEdges])

  const addNoteNode = () => {
    setMapNodes([...mapNodes, {
      id: `node-note-${nanoid()}`, type: 'note', label: 'メモ',
      position: { x: 300 + Math.random() * 200, y: 200 + Math.random() * 200 },
    }])
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

      <ReactFlow nodes={flowNodes} edges={flowEdges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
        fitView proOptions={{ hideAttribution: true }}>
        <Background color="#e2e8f0" gap={24} />
        <Controls style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }} />
        <MiniMap style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
          nodeColor={(n) => NODE_COLORS[(n.data as { type: NodeType }).type]?.border ?? '#94a3b8'} />
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
