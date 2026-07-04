import { Heart, MapPin, Link2, CalendarCheck, Sparkles, KeyRound } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import type { ActiveModule } from '../../types'

const NAV_ITEMS: { id: ActiveModule; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'self',    label: '自己探索', icon: <Heart size={16} />,        color: 'text-pink-400' },
  { id: 'issues',  label: '課題マップ', icon: <MapPin size={16} />,      color: 'text-orange-400' },
  { id: 'connect', label: '接続分析', icon: <Link2 size={16} />,        color: 'text-blue-400' },
  { id: 'plan',    label: '計画立案', icon: <CalendarCheck size={16} />, color: 'text-emerald-400' },
]

export default function Sidebar() {
  const { activeModule, setActiveModule, aiPanelOpen, setAIPanelOpen, setGroqApiKey } = useAppStore((s) => ({
    activeModule: s.activeModule,
    setActiveModule: s.setActiveModule,
    aiPanelOpen: s.aiPanelOpen,
    setAIPanelOpen: s.setAIPanelOpen,
    setGroqApiKey: s.setGroqApiKey,
  }))

  return (
    <div className="w-14 flex flex-col items-center gap-1 py-4 bg-[#0d1117] border-r border-slate-700/50">
      {/* Logo */}
      <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-3">
        <span className="text-indigo-400 text-xs font-bold">V</span>
      </div>

      {/* Nav */}
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveModule(item.id)}
          title={item.label}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
            activeModule === item.id
              ? `bg-slate-700/60 ${item.color}`
              : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'
          }`}
        >
          {item.icon}
        </button>
      ))}

      <div className="flex-1" />

      {/* AI Toggle */}
      <button
        onClick={() => setAIPanelOpen(!aiPanelOpen)}
        title="AIファシリテーター"
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
          aiPanelOpen ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'
        }`}
      >
        <Sparkles size={16} />
      </button>

      {/* Reset API key */}
      <button
        onClick={() => { if (confirm('APIキーをリセットしますか？')) setGroqApiKey('') }}
        title="APIキーをリセット"
        className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-700 hover:text-slate-500 hover:bg-slate-800 transition-colors"
      >
        <KeyRound size={14} />
      </button>
    </div>
  )
}
