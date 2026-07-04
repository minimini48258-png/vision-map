import { useState } from 'react'
import { Trash2, Sparkles, Link } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useAppStore } from '../../store/useAppStore'
import { useShallow } from 'zustand/react/shallow'
import { useGroqAI } from '../../hooks/useGroqAI'
import type { Connection } from '../../types'

const ALIGNMENT_LABELS = ['', '低', '中', '高'] as const
const ALIGNMENT_COLORS = ['', 'text-slate-400', 'text-yellow-400', 'text-emerald-400'] as const

export default function ConnectionAnalysis() {
  const { selfItems, issues, connections, addConnection, deleteConnection, mapEdges, setMapEdges } = useAppStore(useShallow((s) => ({
    selfItems: s.selfItems,
    issues: s.issues,
    connections: s.connections,
    addConnection: s.addConnection,
    deleteConnection: s.deleteConnection,
    mapEdges: s.mapEdges,
    setMapEdges: s.setMapEdges,
  })))

  const { analyzeAlignment, loading } = useGroqAI()
  const [selfId, setSelfId] = useState('')
  const [issueId, setIssueId] = useState('')
  const [alignment, setAlignment] = useState<1 | 2 | 3>(2)
  const [analysis, setAnalysis] = useState<Record<string, string>>({})

  const handleConnect = () => {
    if (!selfId || !issueId) return
    const already = connections.find((c) => c.selfItemId === selfId && c.issueId === issueId)
    if (already) return

    const conn: Connection = { id: nanoid(), selfItemId: selfId, issueId, alignment }
    addConnection(conn)

    const sourceNodeId = `node-self-${selfId}`
    const targetNodeId = `node-issue-${issueId}`
    setMapEdges([...mapEdges, {
      id: `edge-${conn.id}`,
      source: sourceNodeId,
      target: targetNodeId,
      label: ALIGNMENT_LABELS[alignment],
    }])
  }

  const handleAnalyze = async (conn: Connection) => {
    const self = selfItems.find((s) => s.id === conn.selfItemId)
    const issue = issues.find((i) => i.id === conn.issueId)
    if (!self || !issue) return
    const result = await analyzeAlignment(self.content, issue.title)
    setAnalysis((prev) => ({ ...prev, [conn.id]: result }))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-sm font-semibold text-white mb-3">接続分析</h2>
        <p className="text-xs text-slate-500 mb-3">自分の強み・関心と課題をつなぎ、本当に自分のニーズを満たすか確認する</p>

        <div className="space-y-2">
          <select value={selfId} onChange={(e) => setSelfId(e.target.value)}
            className="w-full bg-[#0f1117] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
            <option value="">自分の要素を選択...</option>
            {selfItems.map((s) => (
              <option key={s.id} value={s.id}>{s.content}</option>
            ))}
          </select>

          <select value={issueId} onChange={(e) => setIssueId(e.target.value)}
            className="w-full bg-[#0f1117] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
            <option value="">課題を選択...</option>
            {issues.map((i) => (
              <option key={i.id} value={i.id}>{i.title}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">一致度：</span>
            {([1, 2, 3] as const).map((v) => (
              <button key={v} onClick={() => setAlignment(v)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  alignment === v ? `${ALIGNMENT_COLORS[v]} border-current bg-white/5` : 'text-slate-500 border-slate-700'
                }`}>
                {ALIGNMENT_LABELS[v]}
              </button>
            ))}
          </div>

          <button onClick={handleConnect} disabled={!selfId || !issueId}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg px-3 py-2 text-sm transition-colors">
            <Link size={14} />
            接続を作成
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {connections.length === 0 && (
          <p className="text-xs text-slate-600 text-center pt-8">
            自分の要素と課題を接続して<br />つながりを可視化しましょう
          </p>
        )}
        {connections.map((conn) => {
          const self = selfItems.find((s) => s.id === conn.selfItemId)
          const issue = issues.find((i) => i.id === conn.issueId)
          if (!self || !issue) return null
          return (
            <div key={conn.id} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-1">
                  <p className="text-xs text-pink-400">{self.content}</p>
                  <p className="text-xs text-slate-500">↕</p>
                  <p className="text-xs text-orange-400">{issue.title}</p>
                  <span className={`text-xs ${ALIGNMENT_COLORS[conn.alignment]}`}>
                    一致度：{ALIGNMENT_LABELS[conn.alignment]}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleAnalyze(conn)} disabled={loading}
                    title="AIで分析"
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-colors disabled:opacity-40">
                    <Sparkles size={14} />
                  </button>
                  <button onClick={() => deleteConnection(conn.id)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {analysis[conn.id] && (
                <div className="mt-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2">
                  <p className="text-xs text-indigo-300 leading-relaxed whitespace-pre-line">{analysis[conn.id]}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
