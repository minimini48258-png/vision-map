import { useState } from 'react'
import { Plus, Trash2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useAppStore } from '../../store/useAppStore'
import { useGroqAI } from '../../hooks/useGroqAI'
import type { SelfItem, SelfItemType } from '../../types'

const TYPE_CONFIG: Record<SelfItemType, { label: string; color: string; bg: string; placeholder: string }> = {
  love:  { label: '好きなこと',   color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/20',   placeholder: '例：森の中を歩くこと、人と話すこと' },
  skill: { label: '得意なこと',   color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',   placeholder: '例：データ分析、場をつくること' },
  want:  { label: 'やりたいこと', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', placeholder: '例：地域に根ざした仕事をしたい' },
  value: { label: '大切な価値観', color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20',  placeholder: '例：自然との共生、内発的な変化' },
}

function ItemCard({ item, onDelete }: { item: SelfItem; onDelete: () => void }) {
  const { generateQuestion, loading } = useGroqAI()
  const updateSelfItem = useAppStore((s) => s.updateSelfItem)
  const [question, setQuestion] = useState('')
  const [expanded, setExpanded] = useState(false)
  const cfg = TYPE_CONFIG[item.type]

  const handleAsk = async () => {
    const q = await generateQuestion(`【${cfg.label}】${item.content}${item.notes ? `\nメモ：${item.notes}` : ''}`)
    setQuestion(q)
    setExpanded(true)
  }

  return (
    <div className={`rounded-xl border p-3 ${cfg.bg}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
          <p className="text-sm text-white mt-0.5">{item.content}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={handleAsk} disabled={loading} title="AIに深掘りしてもらう"
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-colors disabled:opacity-40">
            <Sparkles size={14} />
          </button>
          <button onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-colors">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-2 space-y-2">
          <textarea
            value={item.notes ?? ''}
            onChange={(e) => updateSelfItem(item.id, { notes: e.target.value })}
            placeholder="メモ・補足..."
            rows={2}
            className="w-full bg-black/20 text-xs text-slate-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-white/20 placeholder-slate-600"
          />
          {question && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2">
              <p className="text-xs text-indigo-300 leading-relaxed">{question}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SelfExploration() {
  const { selfItems, addSelfItem, deleteSelfItem, addMapNode } = useAppStore((s) => ({
    selfItems: s.selfItems,
    addSelfItem: s.addSelfItem,
    deleteSelfItem: s.deleteSelfItem,
    addMapNode: s.addMapNode,
  }))
  const [input, setInput] = useState('')
  const [type, setType] = useState<SelfItemType>('love')

  const handleAdd = () => {
    if (!input.trim()) return
    const item: SelfItem = { id: nanoid(), type, content: input.trim() }
    addSelfItem(item)
    addMapNode({
      id: `node-self-${item.id}`,
      type: 'self',
      label: item.content,
      refId: item.id,
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
    })
    setInput('')
  }

  const grouped = (Object.keys(TYPE_CONFIG) as SelfItemType[]).map((t) => ({
    type: t,
    items: selfItems.filter((i) => i.type === t),
  }))

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-sm font-semibold text-white mb-3">自己探索</h2>
        <div className="flex gap-1 mb-2 flex-wrap">
          {(Object.entries(TYPE_CONFIG) as [SelfItemType, typeof TYPE_CONFIG[SelfItemType]][]).map(([t, cfg]) => (
            <button key={t} onClick={() => setType(t)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                type === t ? `${cfg.color} border-current bg-white/5` : 'text-slate-500 border-slate-700 hover:text-slate-300'
              }`}>
              {cfg.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={TYPE_CONFIG[type].placeholder}
            className="flex-1 bg-[#0f1117] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button onClick={handleAdd} disabled={!input.trim()}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg transition-colors">
            <Plus size={16} className="text-white" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {grouped.map(({ type: t, items }) => items.length > 0 && (
          <div key={t}>
            <p className={`text-xs font-medium mb-2 ${TYPE_CONFIG[t].color}`}>{TYPE_CONFIG[t].label}</p>
            <div className="space-y-2">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} onDelete={() => deleteSelfItem(item.id)} />
              ))}
            </div>
          </div>
        ))}
        {selfItems.length === 0 && (
          <p className="text-xs text-slate-600 text-center pt-8">
            好きなこと・得意なこと・価値観を入力してみましょう
          </p>
        )}
      </div>
    </div>
  )
}
