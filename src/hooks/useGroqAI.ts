import { useState } from 'react'
import Groq from 'groq-sdk'
import { useAppStore } from '../store/useAppStore'

export function useGroqAI() {
  const groqApiKey = useAppStore((s) => s.groqApiKey)
  const [loading, setLoading] = useState(false)

  const ask = async (systemPrompt: string, userMessage: string): Promise<string> => {
    if (!groqApiKey) throw new Error('APIキーが設定されていません')
    setLoading(true)
    try {
      const client = new Groq({ apiKey: groqApiKey, dangerouslyAllowBrowser: true })
      const response = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 800,
      })
      return response.choices[0]?.message?.content ?? ''
    } finally {
      setLoading(false)
    }
  }

  const generateQuestion = async (context: string): Promise<string> => {
    const system = `あなたは自己探索と地域課題を掘り下げるファシリテーターです。
ユーザーが入力した内容を見て、思考を深める問いを1〜2つ投げかけてください。
- 「なぜ」「誰のために」「それが実現したとき自分はどう感じる？」などの角度から問う
- 短く、鋭く、1〜2文で
- 日本語で返答`

    return ask(system, context)
  }

  const analyzeAlignment = async (selfContent: string, issueTitle: string): Promise<string> => {
    const system = `あなたは「自分のやりたいこと」と「地域課題」の接続を分析するコーチです。
以下を踏まえて、この組み合わせが本当に自分のニーズを満たすか、3点で分析してください：
1. 動機の一致度
2. 懸念・ギャップ
3. 深掘りすべき問い
簡潔に、日本語で。`

    return ask(system, `【やりたいこと】${selfContent}\n【課題】${issueTitle}`)
  }

  const suggestPlanSteps = async (issueTitle: string, selfContent: string): Promise<string> => {
    const system = `あなたは地域課題解決の計画立案をサポートするコーチです。
提示された課題と動機をもとに、実行可能なマイルストーンを3〜5つ提案してください。
各ステップは1行で、具体的・測定可能な形で。日本語で。`

    return ask(system, `【取り組む課題】${issueTitle}\n【動機・強み】${selfContent}`)
  }

  const suggestCausalConnections = async (
    allNodes: Array<{ id: string; label: string; nodeType: string }>,
    newNodeId: string,
  ): Promise<Array<{ sourceId: string; targetId: string; direction: '+' | '-'; reason: string }>> => {
    if (allNodes.length < 2) return []

    const nodeList = allNodes.map((n, i) => `${i + 1}. 「${n.label}」（${n.nodeType}）`).join('\n')
    const newIdx = allNodes.findIndex((n) => n.id === newNodeId) + 1

    const system = `あなたはシステム思考の専門家です。
課題の地図（因果関係ループ図）の要素間の因果関係を分析します。

+ は「Aが大きくなると/強くなるとBも大きくなる」（同方向・強化）
- は「Aが大きくなると/強くなるとBが小さくなる」（逆方向・抑制）

出力は必ず以下の形式で、1行1提案、最大3つ：
[番号A]→[番号B]:[+/-]:理由（20字以内）

例：
1→3:+:地域経済活性化が新電力需要を高める
2→4:-:若者流出で担い手が減少する`

    const userMsg = `要素リスト：\n${nodeList}\n\n今回追加された要素：${newIdx}番\nこの要素を含む因果関係を最大3つ提案してください。`

    try {
      const response = await ask(system, userMsg)
      const suggestions: Array<{ sourceId: string; targetId: string; direction: '+' | '-'; reason: string }> = []

      for (const line of response.split('\n')) {
        const match = line.match(/(\d+)→(\d+):\s*([+\-])\s*:?\s*(.*)/)
        if (match) {
          const si = parseInt(match[1]) - 1
          const ti = parseInt(match[2]) - 1
          const direction = (match[3] === '+' ? '+' : '-') as '+' | '-'
          const reason = match[4].replace(/^[（(【]/, '').replace(/[）)】]$/, '').trim()
          if (si >= 0 && si < allNodes.length && ti >= 0 && ti < allNodes.length && si !== ti) {
            suggestions.push({ sourceId: allNodes[si].id, targetId: allNodes[ti].id, direction, reason })
          }
        }
      }
      return suggestions
    } catch {
      return []
    }
  }

  return { ask, generateQuestion, analyzeAlignment, suggestPlanSteps, suggestCausalConnections, loading }
}
