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

  const suggestRelatedNodes = async (
    nodeLabel: string,
    existingLabels: string[],
  ): Promise<Array<{ label: string; direction: '+' | '-'; reason: string }>> => {
    const system = `あなたはシステム思考の専門家です。
提示された課題・要素に関連する新しい課題・要因・影響を提案します。

記号の意味：
+ ：元の要素が大きくなると、この要素も大きくなる（同方向・強化）
- ：元の要素が大きくなると、この要素は小さくなる（逆方向・抑制）

出力形式（1行1提案、最大5つ）：
[+/-]:要素名（25字以内）:理由（35字以内）

例（「気候変動」の場合）：
+:熱中症患者の増加:気温上昇により熱中症リスクが高まる
-:農作物の収穫量:異常気象で作物が育ちにくくなる
+:海水温の上昇:地球温暖化による直接的影響`

    const alreadyStr = existingLabels.length > 0
      ? `\n\n※すでにマップにある要素（重複不要）：${existingLabels.join('、')}`
      : ''

    const userMsg = `「${nodeLabel}」に関連する新しい課題・要因・影響を提案してください。${alreadyStr}`

    try {
      const response = await ask(system, userMsg)
      const results: Array<{ label: string; direction: '+' | '-'; reason: string }> = []

      for (const line of response.split('\n')) {
        const match = line.match(/^([+\-])\s*[:：]\s*(.+?)\s*[:：]\s*(.*)/)
        if (match) {
          const direction = (match[1] === '+' ? '+' : '-') as '+' | '-'
          const label = match[2].replace(/^[「『]/, '').replace(/[」』]$/, '').trim()
          const reason = match[3].replace(/^[（(]/, '').replace(/[）)]$/, '').trim()
          if (label) results.push({ label, direction, reason })
        }
      }
      return results.slice(0, 5)
    } catch {
      return []
    }
  }

  return { ask, generateQuestion, analyzeAlignment, suggestPlanSteps, suggestRelatedNodes, loading }
}
