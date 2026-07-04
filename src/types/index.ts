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

export type NodeType = 'self' | 'issue' | 'plan' | 'note'

export interface MapNode {
  id: string
  type: NodeType
  label: string
  refId?: string  // links to SelfItem / Issue / Plan id
  position: { x: number; y: number }
  color?: string
}

export interface MapEdge {
  id: string
  source: string
  target: string
  label?: string
}

export type ViewMode = 'mindmap' | 'toc'
export type ActiveModule = 'self' | 'issues' | 'connect' | 'plan'

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}
