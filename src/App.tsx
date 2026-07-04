import { useAppStore } from './store/useAppStore'
import { useShallow } from 'zustand/react/shallow'
import ApiKeySetup from './components/Setup/ApiKeySetup'
import Sidebar from './components/Layout/Sidebar'
import TopBar from './components/Layout/TopBar'
import SelfExploration from './components/Modules/SelfExploration'
import IssueMap from './components/Modules/IssueMap'
import ConnectionAnalysis from './components/Modules/ConnectionAnalysis'
import PlanningModule from './components/Modules/PlanningModule'
import MindMapView from './components/Visualization/MindMapView'
import ToCView from './components/Visualization/ToCView'
import AIFacilitator from './components/AI/AIFacilitator'

const MODULE_PANELS = {
  self:    <SelfExploration />,
  issues:  <IssueMap />,
  connect: <ConnectionAnalysis />,
  plan:    <PlanningModule />,
} as const

export default function App() {
  const { groqApiKey, activeModule, viewMode, aiPanelOpen } = useAppStore(useShallow((s) => ({
    groqApiKey: s.groqApiKey,
    activeModule: s.activeModule,
    viewMode: s.viewMode,
    aiPanelOpen: s.aiPanelOpen,
  })))

  if (!groqApiKey) return <ApiKeySetup />

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="w-72 flex-shrink-0 border-r border-slate-700/50 overflow-hidden">
          {MODULE_PANELS[activeModule]}
        </div>
        <div className="flex-1 overflow-hidden">
          {viewMode === 'mindmap' ? <MindMapView /> : <ToCView />}
        </div>
        {aiPanelOpen && (
          <div className="w-72 flex-shrink-0 overflow-hidden">
            <AIFacilitator />
          </div>
        )}
      </div>
    </div>
  )
}
