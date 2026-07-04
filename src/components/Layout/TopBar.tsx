import { useState } from 'react'
import { Network, GitBranch, RotateCcw } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useShallow } from 'zustand/react/shallow'
import type { ViewMode } from '../../types'

export default function TopBar() {
  const { viewMode, setViewMode, resetAll } = useAppStore(useShallow((s) => ({
    viewMode: s.viewMode,
    setViewMode: s.setViewMode,
    resetAll: s.resetAll,
  })))
  const [confirm, setConfirm] = useState(false)

  const handleReset = () => {
    if (confirm) {
      resetAll()
      setConfirm(false)
    } else {
      setConfirm(true)
      setTimeout(() => setConfirm(false), 3000)
    }
  }

  return (
    <div className="h-11 flex items-center justify-between px-4 bg-white border-b border-gray-200">
      <h1 className="text-xs font-semibold text-gray-400 tracking-widest uppercase">VisionMap</h1>

      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
        {([
          { id: 'mindmap' as ViewMode, label: 'マインドマップ', icon: <Network size={13} /> },
          { id: 'toc'     as ViewMode, label: 'ToC',           icon: <GitBranch size={13} /> },
        ] as const).map((v) => (
          <button key={v.id} onClick={() => setViewMode(v.id)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-colors ${
              viewMode === v.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {v.icon}
            {v.label}
          </button>
        ))}
      </div>

      <button
        onClick={handleReset}
        title="全データをリセット"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors ${
          confirm
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
        }`}>
        <RotateCcw size={12} />
        {confirm ? 'もう一度押すとリセット' : 'リセット'}
      </button>
    </div>
  )
}
