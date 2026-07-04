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
  self:  { bg: '#1e1b4b', border: '#6366f1', text: '#a5b4fc' },
  issue: { bg: '#1c1917', border: '#f97316', text: '#fdba74' },
  plan:  { bg: '#052e16', border: '#22c55e', text: '#86efac' },
  note:  { bg: '#1e293b', border: '#475569', text: '#94a3b8' },
}

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  self: '自分',
  issue: '課題',
  plan: '計画',
  note: 'メモ',
}

function toFlowNode(n: MapNode): Node {
  const colors = NODE_COLORS[n.type]
  return {
    id: n.id,
    position: n.position,
    data: { label: n.label, type: n.type },
    style: {
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      color: colors.text,
      borderRadius: '12px',
      padding: '8px 14px',
      fontSize: '12px',
      fontWeight: 500,
      minWidth: '120px',
      maxWidth: '200px',
      wordBreak: 'break-word',
      boxShadow: `0 0 12px ${colors.border}22`,
    },
  }
}

function toFlowEdge(e: MapEdge): Edge {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    style: { stroke: '#4f6080', strokeWidth: 1.5 },
    labelStyle: { fill: '#94a3b8', fontSize: 10 },
    labelBgStyle: { fill: '#1e293b' },
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
    const newMapNodes: MapNode[] = updated.map((n) => ({
      id: n.id,
      type: (n.data as { type: NodeType }).type,
      label: (n.data as { label: string }).label,
      position: n.position,
    }))
    setMapNodes(newMapNodes)
  }, [flowNodes, setMapNodes])

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    const updated = applyEdgeChanges(changes, flowEdges)
    const newMapEdges: MapEdge[] = updated.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: typeof (e as Edge).label === 'string' ? String((e as Edge).label) : undefined,
    }))
    setMapEdges(newMapEdges)
  }, [flowEdges, setMapEdges])

  const onConnect = useCallback((params: Connection) => {
    const newEdge: MapEdge = {
      id: `edge-manual-${nanoid()}`,
      source: params.source,
      target: params.target,
    }
    setMapEdges([...mapEdges, newEdge])
  }, [mapEdges, setMapEdges])

  const addNoteNode = () => {
    const node: MapNode = {
      id: `node-note-${nanoid()}`,
      type: 'note',
      label: 'メモ',
      position: { x: 300 + Math.random() * 200, y: 200 + Math.random() * 200 },
    }
    setMapNodes([...mapNodes, node])
  }

  return (
    <div className="relative w-full h-full">
      {/* Legend */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
        {(Object.entries(NODE_COLORS) as [NodeType, typeof NODE_COLORS[NodeType]][]).map(([type, colors]) => (
          <div key={type} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
            style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
            {NODE_TYPE_LABELS[type]}
          </div>
        ))}
        <button onClick={addNoteNode}
          className="text-xs px-2 py-1 rounded-full bg-slate-800 border border-slate-600 text-slate-400 hover:text-white transition-colors">
          + メモ追加
        </button>
      </div>

      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e293b" gap={24} />
        <Controls style={{ background: '#1e293b', border: '1px solid #334155' }} />
        <MiniMap
          style={{ background: '#0f1117', border: '1px solid #334155' }}
          nodeColor={(n) => {
            const type = (n.data as { type: NodeType }).type
            return NODE_COLORS[type]?.border ?? '#475569'
          }}
        />
      </ReactFlow>

      {mapNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-slate-600 text-center">
            左パネルで要素を追加すると<br />ここにノードが表示されます
          </p>
        </div>
      )}
    </div>
  )
}
