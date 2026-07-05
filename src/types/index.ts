export type SelfItemType = 'love' | 'skill' | 'want' | 'value'

export interface SelfItem {
  id: string
  type: SelfItemType
  content: string
  notes?: string
}

export type IssueCategory = 'population' | 'economy' | 'environment' | 'welfare' | 'education' | 'infrastructure' | 'other'

export interface Issue {
  id: string
  title: string
  category: IssueCategory
  description?: string
  rootCause?: string
  impact?: string
}

export interface Connection {
  id: string
  selfItemId: string
  issueId: string
  alignment: 1 | 2 | 3  // 1=低 2=中 3=高
  notes?: string
}

export interface Milestone {
  id: string
  title: string
  deadline?: string
  done: boolean
}

export interface Plan {
  id: string
  title: string
  description?: string
  issueId?: string
  selfItemIds: string[]
  milestones: Milestone[]
  createdAt: string
}

export type NodeType = 'self' | 'issue' | 'plan' | 'note' | 'rect' | 'circle' | 'diamond' | 'text'

export interface MapNode {
  id: string
  type: NodeType
  label: string
  refId?: string
  position: { x: number; y: number }
  width?: number
  height?: number
  bgColor?: string
  textColor?: string
  fontSize?: number
  borderColor?: string
}

export interface MapEdge {
  id: string
  source: string
  target: string
  label?: string
}

export type ViewMode = 'mindmap' | 'toc' | 'issuemap'
export type ActiveModule = 'self' | 'issues' | 'connect' | 'plan'

// Issue Map
export type IssueEdgeDirection = '+' | '-'

export interface IssueMapEdge {
  id: string
  source: string
  target: string
  direction: IssueEdgeDirection
  reason?: string
}

export interface BusinessNode {
  id: string
  label: string
  description?: string
}

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}
