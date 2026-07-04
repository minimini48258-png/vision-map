import { Network, GitBranch } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useShallow } from 'zustand/react/shallow'
import type { ViewMode } from '../../types'

export default function TopBar() {
  const { viewMode, setViewMode } = useAppStore(useShallow((s) => ({
    viewMode: s.viewMode,
    setViewMode: s.setViewMode,
  })))

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

      <div className="w-20" />
    </div>
  )
}
