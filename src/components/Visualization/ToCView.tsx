import { useAppStore } from '../../store/useAppStore'
import { useShallow } from 'zustand/react/shallow'

const STAGE_CONFIG = [
  { key: 'context',   label: '現状・背景',    color: '#ef4444', bg: '#1c0a0a' },
  { key: 'input',     label: '入力・強み',    color: '#f97316', bg: '#1c1208' },
  { key: 'activity',  label: '活動・介入',    color: '#eab308', bg: '#1a1608' },
  { key: 'output',    label: 'アウトプット',  color: '#22c55e', bg: '#081a0e' },
  { key: 'outcome',   label: 'アウトカム',    color: '#06b6d4', bg: '#081518' },
  { key: 'impact',    label: 'インパクト',    color: '#8b5cf6', bg: '#100d1c' },
] as const

export default function ToCView() {
  const { issues, selfItems, connections, plans } = useAppStore(useShallow((s) => ({
    issues: s.issues,
    selfItems: s.selfItems,
    connections: s.connections,
    plans: s.plans,
  })))

  const highConnections = connections.filter((c) => c.alignment >= 2)

  const stages = {
    context: issues.slice(0, 6).map((i) => ({ id: i.id, label: i.title, sub: i.rootCause })),
    input: selfItems.slice(0, 6).map((s) => ({ id: s.id, label: s.content, sub: s.type })),
    activity: plans.slice(0, 6).map((p) => ({ id: p.id, label: p.title, sub: `${p.milestones.length}ステップ` })),
    output: plans.flatMap((p) =>
      p.milestones.filter((m) => m.done).map((m) => ({ id: m.id, label: m.title, sub: '完了' }))
    ).slice(0, 6),
    outcome: highConnections.map((c) => {
      const self = selfItems.find((s) => s.id === c.selfItemId)
      const issue = issues.find((i) => i.id === c.issueId)
      return { id: c.id, label: `${self?.content ?? '?'} × ${issue?.title ?? '?'}`, sub: '一致度：高' }
    }).slice(0, 6),
    impact: [{ id: 'vision', label: 'マルチスピーシーズウェルビーイングの実現', sub: 'Long-term vision' }],
  }

  return (
    <div className="w-full h-full overflow-auto p-6">
      <h2 className="text-sm font-semibold text-slate-400 mb-6 text-center">Theory of Change</h2>

      <div className="flex gap-3 min-w-max mx-auto">
        {STAGE_CONFIG.map((stage, stageIdx) => {
          const items = stages[stage.key as keyof typeof stages]
          return (
            <div key={stage.key} className="flex flex-col items-center gap-2 w-44">
              {/* Header */}
              <div className="w-full text-center px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: stage.bg, border: `1px solid ${stage.color}`, color: stage.color }}>
                {stage.label}
              </div>

              {/* Arrow connector */}
              {stageIdx < STAGE_CONFIG.length - 1 && (
                <div className="hidden" />
              )}

              {/* Items */}
              <div className="flex flex-col gap-1.5 w-full">
                {items.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-700 border border-dashed border-slate-800 rounded-xl">
                    未入力
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="rounded-xl p-2.5 text-left"
                      style={{ background: stage.bg, border: `1px solid ${stage.color}22` }}>
                      <p className="text-xs leading-snug" style={{ color: stage.color }}>{item.label}</p>
                      {item.sub && (
                        <p className="text-xs text-slate-600 mt-0.5">{item.sub}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Arrows between stages */}
      <div className="flex gap-3 min-w-max mx-auto mt-2 justify-center items-center">
        {STAGE_CONFIG.map((stage, idx) => (
          <div key={stage.key} className="flex items-center w-44">
            {idx < STAGE_CONFIG.length - 1 && (
              <div className="flex items-center w-full justify-end pr-1">
                <span className="text-slate-700 text-lg">→</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {Object.values(stages).every((s) => s.length === 0) && (
        <div className="text-center mt-12">
          <p className="text-sm text-slate-600">
            各モジュールで要素を入力すると<br />変化の理論が自動で構築されます
          </p>
        </div>
      )}
    </div>
  )
}
