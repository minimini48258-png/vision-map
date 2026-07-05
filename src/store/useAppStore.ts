import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  SelfItem, Issue, Connection, Plan,
  MapNode, MapEdge, ViewMode, ActiveModule, AIMessage,
  IssueMapEdge, BusinessNode,
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

  // Issue Map
  issueMapEdges: IssueMapEdge[]
  addIssueMapEdge: (edge: IssueMapEdge) => void
  deleteIssueMapEdge: (id: string) => void
  updateIssueMapEdge: (id: string, patch: Partial<IssueMapEdge>) => void
  issueMapPositions: Record<string, { x: number; y: number }>
  updateIssueMapPosition: (id: string, pos: { x: number; y: number }) => void
  businessNodes: BusinessNode[]
  addBusinessNode: (node: BusinessNode) => void
  updateBusinessNode: (id: string, patch: Partial<BusinessNode>) => void
  deleteBusinessNode: (id: string) => void
  convertBusinessNodeToIssue: (bizId: string, newIssue: Issue) => void

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
        issueMapPositions: Object.fromEntries(
          Object.entries(s.issueMapPositions).filter(([k]) => k !== `self-${id}`)
        ),
      })),

      issues: [],
      addIssue: (issue) => set((s) => ({ issues: [...s.issues, issue] })),
      updateIssue: (id, patch) => set((s) => ({
        issues: s.issues.map((x) => x.id === id ? { ...x, ...patch } : x)
      })),
      deleteIssue: (id) => set((s) => ({
        issues: s.issues.filter((x) => x.id !== id),
        mapNodes: s.mapNodes.filter((n) => n.refId !== id),
        issueMapPositions: Object.fromEntries(
          Object.entries(s.issueMapPositions).filter(([k]) => k !== `issue-${id}`)
        ),
        issueMapEdges: s.issueMapEdges.filter(
          (e) => e.source !== `issue-${id}` && e.target !== `issue-${id}`
        ),
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
        issueMapPositions: Object.fromEntries(
          Object.entries(s.issueMapPositions).filter(([k]) => k !== `plan-${id}`)
        ),
      })),

      mapNodes: [],
      mapEdges: [],
      setMapNodes: (nodes) => set({ mapNodes: nodes }),
      setMapEdges: (edges) => set({ mapEdges: edges }),
      addMapNode: (node) => set((s) => ({ mapNodes: [...s.mapNodes, node] })),

      issueMapEdges: [],
      addIssueMapEdge: (edge) => set((s) => ({ issueMapEdges: [...s.issueMapEdges, edge] })),
      deleteIssueMapEdge: (id) => set((s) => ({ issueMapEdges: s.issueMapEdges.filter((e) => e.id !== id) })),
      updateIssueMapEdge: (id, patch) => set((s) => ({
        issueMapEdges: s.issueMapEdges.map((e) => e.id === id ? { ...e, ...patch } : e),
      })),
      issueMapPositions: {},
      updateIssueMapPosition: (id, pos) => set((s) => ({
        issueMapPositions: { ...s.issueMapPositions, [id]: pos },
      })),
      businessNodes: [],
      addBusinessNode: (node) => set((s) => ({ businessNodes: [...s.businessNodes, node] })),
      updateBusinessNode: (id, patch) => set((s) => ({
        businessNodes: s.businessNodes.map((n) => n.id === id ? { ...n, ...patch } : n),
      })),
      deleteBusinessNode: (id) => set((s) => ({
        businessNodes: s.businessNodes.filter((n) => n.id !== id),
        issueMapPositions: Object.fromEntries(
          Object.entries(s.issueMapPositions).filter(([k]) => k !== `biz-${id}`)
        ),
        issueMapEdges: s.issueMapEdges.filter(
          (e) => e.source !== `biz-${id}` && e.target !== `biz-${id}`
        ),
      })),
      convertBusinessNodeToIssue: (bizId, newIssue) => set((s) => {
        const oldFlowId = `biz-${bizId}`
        const newFlowId = `issue-${newIssue.id}`
        const pos = s.issueMapPositions[oldFlowId]
        const positions = { ...s.issueMapPositions }
        delete positions[oldFlowId]
        if (pos) positions[newFlowId] = pos
        return {
          businessNodes: s.businessNodes.filter((n) => n.id !== bizId),
          issues: [...s.issues, newIssue],
          issueMapPositions: positions,
          issueMapEdges: s.issueMapEdges.map((e) => ({
            ...e,
            source: e.source === oldFlowId ? newFlowId : e.source,
            target: e.target === oldFlowId ? newFlowId : e.target,
          })),
        }
      }),

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
        issueMapEdges: [], businessNodes: [], issueMapPositions: {},
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
        issueMapEdges: state.issueMapEdges,
        issueMapPositions: state.issueMapPositions,
        businessNodes: state.businessNodes,
      }),
    }
  )
)
