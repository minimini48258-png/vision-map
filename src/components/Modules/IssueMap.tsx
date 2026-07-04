import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useAppStore } from '../../store/useAppStore'
import { useShallow } from 'zustand/react/shallow'
import type { Issue, IssueCategory } from '../../types'

const CATEGORY_CONFIG: Record<IssueCategory, { label: string; color: string }> = {
  population:     { label: '人口・移住',      color: 'text-red-600' },
  economy:        { label: '産業・経済',      color: 'text-orange-600' },
  environment:    { label: '環境・エネルギー', color: 'text-emerald-600' },
  welfare:        { label: '福祉・医療',      color: 'text-blue-600' },
  education:      { label: '教育・文化',      color: 'text-purple-600' },
  infrastructure: { label: 'インフラ・交通',  color: 'text-slate-600' },
  other:          { label: 'その他',          color: 'text-gray-500' },
}

function IssueCard({ issue, onDelete }: { issue: Issue; onDelete: () => void }) {
  const updateIssue = useAppStore((s) => s.updateIssue)
  const [expanded, setExpanded] = useState(false)
  const cfg = CATEGORY_CONFIG[issue.category]

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
          <p className="text-sm text-gray-800 mt-0.5">{issue.title}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2">
          <div>
            <label className="text-xs text-gray-500 block mb-1">概要・背景</label>
            <textarea
              value={issue.description ?? ''}
              onChange={(e) => updateIssue(issue.id, { description: e.target.value })}
              placeholder="課題の背景を記述..."
              rows={2}
              className="w-full bg-gray-50 border border-gray-200 text-xs text-gray-700 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder-gray-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">根本原因</label>
            <input
              value={issue.rootCause ?? ''}
              onChange={(e) => updateIssue(issue.id, { rootCause: e.target.value })}
              placeholder="なぜこの課題が起きているか..."
              className="w-full bg-gray-50 border border-gray-200 text-xs text-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder-gray-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">放置した場合の影響</label>
            <input
              value={issue.impact ?? ''}
              onChange={(e) => updateIssue(issue.id, { impact: e.target.value })}
              placeholder="この課題が解決されないと..."
              className="w-full bg-gray-50 border border-gray-200 text-xs text-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder-gray-400"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function IssueMap() {
  const { issues, addIssue, deleteIssue, addMapNode } = useAppStore(useShallow((s) => ({
    issues: s.issues,
    addIssue: s.addIssue,
    deleteIssue: s.deleteIssue,
    addMapNode: s.addMapNode,
  })))
  const [input, setInput] = useState('')
  const [category, setCategory] = useState<IssueCategory>('population')

  const handleAdd = () => {
    if (!input.trim()) return
    const issue: Issue = { id: nanoid(), title: input.trim(), category }
    addIssue(issue)
    addMapNode({
      id: `node-issue-${issue.id}`,
      type: 'issue',
      label: issue.title,
      refId: issue.id,
      position: { x: 400 + Math.random() * 200, y: 100 + Math.random() * 200 },
    })
    setInput('')
  }

  const grouped = (Object.keys(CATEGORY_CONFIG) as IssueCategory[]).map((c) => ({
    cat: c,
    items: issues.filter((i) => i.category === c),
  }))

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">課題マップ</h2>
        <div className="flex gap-1 mb-2 flex-wrap">
          {(Object.entries(CATEGORY_CONFIG) as [IssueCategory, typeof CATEGORY_CONFIG[IssueCategory]][]).map(([c, cfg]) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                category === c ? `${cfg.color} border-current bg-gray-50` : 'text-gray-400 border-gray-200 hover:text-gray-600'
              }`}>
              {cfg.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && handleAdd()}
            placeholder="課題を入力（例：若者の流出が止まらない）"
            className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button onClick={handleAdd} disabled={!input.trim()}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg transition-colors">
            <Plus size={16} className="text-white" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {grouped.map(({ cat, items }) => items.length > 0 && (
          <div key={cat}>
            <p className={`text-xs font-medium mb-2 ${CATEGORY_CONFIG[cat].color}`}>{CATEGORY_CONFIG[cat].label}</p>
            <div className="space-y-2">
              {items.map((issue) => (
                <IssueCard key={issue.id} issue={issue} onDelete={() => deleteIssue(issue.id)} />
              ))}
            </div>
          </div>
        ))}
        {issues.length === 0 && (
          <p className="text-xs text-gray-400 text-center pt-8">
            取り組みたい地域・社会課題を入力してみましょう
          </p>
        )}
      </div>
    </div>
  )
}
