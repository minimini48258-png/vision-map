import { useAppStore } from '../../store/useAppStore'
import { useShallow } from 'zustand/react/shallow'

const STAGE_CONFIG = [
  { key: 'context',   label: '現状・背景',    color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  { key: 'input',     label: '入力・強み',    color: '#ea580c', bg: '#fff7ed', border: '#fdba74' },
  { key: 'activity',  label: '活動・介入',    color: '#ca8a04', bg: '#fefce8', border: '#fde047' },
  { key: 'output',    label: 'アウトプット',  color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  { key: 'outcome',   label: 'アウトカム',    color: '#0891b2', bg: '#ecfeff', border: '#67e8f9' },
  { key: 'impact',    label: 'インパクト',    color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
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
    <div className="w-full h-full overflow-auto p-6 bg-gray-50">
      <h2 className="text-sm font-semibold text-gray-500 mb-6 text-center tracking-wide">Theory of Change</h2>

      <div className="flex gap-3 min-w-max mx-auto">
        {STAGE_CONFIG.map((stage) => {
          const items = stages[stage.key as keyof typeof stages]
          return (
            <div key={stage.key} className="flex flex-col gap-2 w-44">
              <div className="w-full text-center px-3 py-1.5 rounded-lg text-xs font-semibold border"
                style={{ background: stage.bg, borderColor: stage.border, color: stage.color }}>
                {stage.label}
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                {items.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400 border border-dashed border-gray-300 rounded-xl bg-white">
                    未入力
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="rounded-xl p-2.5 text-left border shadow-sm"
                      style={{ background: stage.bg, borderColor: stage.border }}>
                      <p className="text-xs leading-snug font-medium" style={{ color: stage.color }}>{item.label}</p>
                      {item.sub && <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3 min-w-max mx-auto mt-1 items-center justify-center">
        {STAGE_CONFIG.map((stage, idx) => (
          <div key={stage.key} className="w-44 flex justify-end pr-1">
            {idx < STAGE_CONFIG.length - 1 && <span className="text-gray-400 text-base">→</span>}
          </div>
        ))}
      </div>

      {Object.values(stages).every((s) => s.length === 0) && (
        <div className="text-center mt-12">
          <p className="text-sm text-gray-400">
            各モジュールで要素を入力すると<br />変化の理論が自動で構築されます
          </p>
        </div>
      )}
    </div>
  )
}
