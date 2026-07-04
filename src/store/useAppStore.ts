import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  SelfItem, Issue, Connection, Plan,
  MapNode, MapEdge, ViewMode, ActiveModule, AIMessage
} from '../types'

interface AppState {
  groqApiKey: string
  setGroqApiKey: (key: string) => void

  selfItems: SelfItem[]
  addSelfItem: (item: SelfItem) => void
  updateSelfItem: (id: string, patch: Partial<SelfItem>) => void
  deleteSelfItem: (id: string) => void

  issues: Issue[]
  addIssue: (issue: Issue) => void
  updateIssue: (id: string, patch: Partial<Issue>) => void
  deleteIssue: (id: string) => void

  connections: Connection[]
  addConnection: (conn: Connection) => void
  deleteConnection: (id: string) => void

  plans: Plan[]
  addPlan: (plan: Plan) => void
  updatePlan: (id: string, patch: Partial<Plan>) => void
  deletePlan: (id: string) => void

  mapNodes: MapNode[]
  mapEdges: MapEdge[]
  setMapNodes: (nodes: MapNode[]) => void
  setMapEdges: (edges: MapEdge[]) => void
  addMapNode: (node: MapNode) => void

  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void

  activeModule: ActiveModule
  setActiveModule: (module: ActiveModule) => void

  aiMessages: AIMessage[]
  addAIMessage: (msg: AIMessage) => void
  clearAIMessages: () => void

  aiPanelOpen: boolean
  setAIPanelOpen: (open: boolean) => void

  resetAll: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      groqApiKey: '',
      setGroqApiKey: (key) => set({ groqApiKey: key }),

      selfItems: [],
      addSelfItem: (item) => set((s) => ({ selfItems: [...s.selfItems, item] })),
      updateSelfItem: (id, patch) => set((s) => ({
        selfItems: s.selfItems.map((x) => x.id === id ? { ...x, ...patch } : x)
      })),
      deleteSelfItem: (id) => set((s) => ({
        selfItems: s.selfItems.filter((x) => x.id !== id),
        mapNodes: s.mapNodes.filter((n) => n.refId !== id),
      })),

      issues: [],
      addIssue: (issue) => set((s) => ({ issues: [...s.issues, issue] })),
      updateIssue: (id, patch) => set((s) => ({
        issues: s.issues.map((x) => x.id === id ? { ...x, ...patch } : x)
      })),
      deleteIssue: (id) => set((s) => ({
        issues: s.issues.filter((x) => x.id !== id),
        mapNodes: s.mapNodes.filter((n) => n.refId !== id),
      })),

      connections: [],
      addConnection: (conn) => set((s) => ({ connections: [...s.connections, conn] })),
      deleteConnection: (id) => set((s) => ({ connections: s.connections.filter((x) => x.id !== id) })),

      plans: [],
      addPlan: (plan) => set((s) => ({ plans: [...s.plans, plan] })),
      updatePlan: (id, patch) => set((s) => ({
        plans: s.plans.map((x) => x.id === id ? { ...x, ...patch } : x)
      })),
      deletePlan: (id) => set((s) => ({
        plans: s.plans.filter((x) => x.id !== id),
        mapNodes: s.mapNodes.filter((n) => n.refId !== id),
      })),

      mapNodes: [],
      mapEdges: [],
      setMapNodes: (nodes) => set({ mapNodes: nodes }),
      setMapEdges: (edges) => set({ mapEdges: edges }),
      addMapNode: (node) => set((s) => ({ mapNodes: [...s.mapNodes, node] })),

      viewMode: 'mindmap',
      setViewMode: (mode) => set({ viewMode: mode }),

      activeModule: 'self',
      setActiveModule: (module) => set({ activeModule: module }),

      aiMessages: [],
      addAIMessage: (msg) => set((s) => ({ aiMessages: [...s.aiMessages, msg] })),
      clearAIMessages: () => set({ aiMessages: [] }),

      aiPanelOpen: false,
      setAIPanelOpen: (open) => set({ aiPanelOpen: open }),

      resetAll: () => set({
        selfItems: [], issues: [], connections: [], plans: [],
        mapNodes: [], mapEdges: [], aiMessages: [],
      }),
    }),
    {
      name: 'vision-map-storage',
      partialize: (state) => ({
        groqApiKey: state.groqApiKey,
        selfItems: state.selfItems,
        issues: state.issues,
        connections: state.connections,
        plans: state.plans,
        mapNodes: state.mapNodes,
        mapEdges: state.mapEdges,
      }),
    }
  )
)
