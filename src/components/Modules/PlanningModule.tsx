import { useState } from 'react'
import { Plus, Trash2, Sparkles, CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useAppStore } from '../../store/useAppStore'
import { useGroqAI } from '../../hooks/useGroqAI'
import type { Plan, Milestone } from '../../types'

function PlanCard({ plan, onDelete }: { plan: Plan; onDelete: () => void }) {
  const { issues, selfItems, updatePlan } = useAppStore((s) => ({
    issues: s.issues,
    selfItems: s.selfItems,
    updatePlan: s.updatePlan,
  }))
  const { suggestPlanSteps, loading } = useGroqAI()
  const [expanded, setExpanded] = useState(true)
  const [newMs, setNewMs] = useState('')

  const issue = issues.find((i) => i.id === plan.issueId)
  const selfRefs = selfItems.filter((s) => plan.selfItemIds.includes(s.id))

  const handleSuggest = async () => {
    if (!issue) return
    const selfContent = selfRefs.map((s) => s.content).join('、') || '（未設定）'
    const result = await suggestPlanSteps(issue.title, selfContent)
    const lines = result.split('\n').filter((l) => l.trim())
    const newMilestones: Milestone[] = lines.map((l) => ({
      id: nanoid(),
      title: l.replace(/^[\d\.\-\*]+\s*/, '').trim(),
      done: false,
    }))
    updatePlan(plan.id, { milestones: [...plan.milestones, ...newMilestones] })
  }

  const addMilestone = () => {
    if (!newMs.trim()) return
    const ms: Milestone = { id: nanoid(), title: newMs.trim(), done: false }
    updatePlan(plan.id, { milestones: [...plan.milestones, ms] })
    setNewMs('')
  }

  const toggleMilestone = (msId: string) => {
    updatePlan(plan.id, {
      milestones: plan.milestones.map((m) => m.id === msId ? { ...m, done: !m.done } : m),
    })
  }

  const deleteMilestone = (msId: string) => {
    updatePlan(plan.id, { milestones: plan.milestones.filter((m) => m.id !== msId) })
  }

  const done = plan.milestones.filter((m) => m.done).length
  const total = plan.milestones.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-3">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{plan.title}</p>
          {issue && <p className="text-xs text-orange-400 mt-0.5">→ {issue.title}</p>}
          {total > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">進捗</span>
                <span className="text-xs text-slate-400">{done}/{total}</span>
              </div>
              <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={handleSuggest} disabled={loading || !issue} title="AIでマイルストーン提案"
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
        <div className="mt-3 space-y-2">
          <div className="space-y-1">
            {plan.milestones.map((ms) => (
              <div key={ms.id} className="flex items-center gap-2 group">
                <button onClick={() => toggleMilestone(ms.id)}>
                  {ms.done
                    ? <CheckCircle2 size={14} className="text-emerald-400" />
                    : <Circle size={14} className="text-slate-600" />}
                </button>
                <span className={`text-xs flex-1 ${ms.done ? 'line-through text-slate-600' : 'text-slate-300'}`}>
                  {ms.title}
                </span>
                <button onClick={() => deleteMilestone(ms.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 text-slate-500 transition-all">
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newMs} onChange={(e) => setNewMs(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMilestone()}
              placeholder="マイルストーンを追加..."
              className="flex-1 bg-black/20 text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-white/20 placeholder-slate-600"
            />
            <button onClick={addMilestone} disabled={!newMs.trim()}
              className="p-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 rounded-lg transition-colors">
              <Plus size={12} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PlanningModule() {
  const { plans, issues, selfItems, addPlan, deletePlan, addMapNode } = useAppStore((s) => ({
    plans: s.plans,
    issues: s.issues,
    selfItems: s.selfItems,
    addPlan: s.addPlan,
    deletePlan: s.deletePlan,
    addMapNode: s.addMapNode,
  }))
  const [title, setTitle] = useState('')
  const [issueId, setIssueId] = useState('')
  const [selfIds, setSelfIds] = useState<string[]>([])

  const handleAdd = () => {
    if (!title.trim()) return
    const plan: Plan = {
      id: nanoid(),
      title: title.trim(),
      issueId: issueId || undefined,
      selfItemIds: selfIds,
      milestones: [],
      createdAt: new Date().toISOString(),
    }
    addPlan(plan)
    addMapNode({
      id: `node-plan-${plan.id}`,
      type: 'plan',
      label: plan.title,
      refId: plan.id,
      position: { x: 250 + Math.random() * 200, y: 350 + Math.random() * 100 },
    })
    setTitle('')
    setIssueId('')
    setSelfIds([])
  }

  const toggleSelfId = (id: string) => {
    setSelfIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-sm font-semibold text-white mb-3">計画立案</h2>

        <div className="space-y-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="取り組みのタイトル"
            className="w-full bg-[#0f1117] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />

          <select value={issueId} onChange={(e) => setIssueId(e.target.value)}
            className="w-full bg-[#0f1117] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
            <option value="">対象課題（任意）...</option>
            {issues.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
          </select>

          {selfItems.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1">活かす自分の要素（複数選択可）</p>
              <div className="flex flex-wrap gap-1">
                {selfItems.map((s) => (
                  <button key={s.id} onClick={() => toggleSelfId(s.id)}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                      selfIds.includes(s.id) ? 'text-indigo-300 border-indigo-500 bg-indigo-500/10' : 'text-slate-500 border-slate-700'
                    }`}>
                    {s.content}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleAdd} disabled={!title.trim()}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg px-3 py-2 text-sm transition-colors">
            <Plus size={14} />
            計画を追加
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {plans.length === 0 && (
          <p className="text-xs text-slate-600 text-center pt-8">
            取り組む計画を追加して<br />マイルストーンを管理しましょう
          </p>
        )}
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onDelete={() => deletePlan(plan.id)} />
        ))}
      </div>
    </div>
  )
}
