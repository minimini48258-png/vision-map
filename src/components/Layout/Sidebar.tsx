import { Heart, MapPin, Link2, CalendarCheck, Sparkles, KeyRound } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useShallow } from 'zustand/react/shallow'
import type { ActiveModule } from '../../types'

const NAV_ITEMS: { id: ActiveModule; label: string; icon: React.ReactNode; active: string }[] = [
  { id: 'self',    label: '自己探索',  icon: <Heart size={16} />,         active: 'bg-pink-50 text-pink-600' },
  { id: 'issues',  label: '課題マップ', icon: <MapPin size={16} />,       active: 'bg-orange-50 text-orange-600' },
  { id: 'connect', label: '接続分析',  icon: <Link2 size={16} />,         active: 'bg-blue-50 text-blue-600' },
  { id: 'plan',    label: '計画立案',  icon: <CalendarCheck size={16} />, active: 'bg-emerald-50 text-emerald-600' },
]

export default function Sidebar() {
  const { activeModule, setActiveModule, aiPanelOpen, setAIPanelOpen, setGroqApiKey } = useAppStore(useShallow((s) => ({
    activeModule: s.activeModule,
    setActiveModule: s.setActiveModule,
    aiPanelOpen: s.aiPanelOpen,
    setAIPanelOpen: s.setAIPanelOpen,
    setGroqApiKey: s.setGroqApiKey,
  })))

  return (
    <div className="w-14 flex flex-col items-center gap-1 py-4 bg-white border-r border-gray-200">
      <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center mb-3">
        <span className="text-white text-xs font-bold">V</span>
      </div>

      {NAV_ITEMS.map((item) => (
        <button key={item.id} onClick={() => setActiveModule(item.id)} title={item.label}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
            activeModule === item.id ? item.active : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}>
          {item.icon}
        </button>
      ))}

      <div className="flex-1" />

      <button onClick={() => setAIPanelOpen(!aiPanelOpen)} title="AIファシリテーター"
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
          aiPanelOpen ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
        }`}>
        <Sparkles size={16} />
      </button>

      <button onClick={() => { if (confirm('APIキーをリセットしますか？')) setGroqApiKey('') }}
        title="APIキーをリセット"
        className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors">
        <KeyRound size={14} />
      </button>
    </div>
  )
}
