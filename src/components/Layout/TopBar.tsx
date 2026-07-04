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
    <div className="h-11 flex items-center justify-between px-4 bg-[#0d1117] border-b border-slate-700/50">
      <h1 className="text-xs font-semibold text-slate-400 tracking-widest uppercase">VisionMap</h1>

      <div className="flex items-center gap-1 bg-slate-800/60 rounded-lg p-0.5">
        {([
          { id: 'mindmap' as ViewMode, label: 'マインドマップ', icon: <Network size={13} /> },
          { id: 'toc'     as ViewMode, label: 'ToC',           icon: <GitBranch size={13} /> },
        ] as const).map((v) => (
          <button
            key={v.id}
            onClick={() => setViewMode(v.id)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-colors ${
              viewMode === v.id
                ? 'bg-slate-700 text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {v.icon}
            {v.label}
          </button>
        ))}
      </div>

      <div className="w-20" />
    </div>
  )
}
