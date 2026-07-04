import { useState, useRef, useEffect } from 'react'
import { Send, X, Sparkles, RotateCcw } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useShallow } from 'zustand/react/shallow'
import { useGroqAI } from '../../hooks/useGroqAI'

const QUICK_PROMPTS = [
  'いま一番気になっている課題を教えて',
  '自分の強みと課題の接点を整理して',
  '最初の一歩として何をすべきか提案して',
  '自分のビジョンを一言で言語化して',
]

export default function AIFacilitator() {
  const { aiMessages, addAIMessage, clearAIMessages, setAIPanelOpen, selfItems, issues, plans } = useAppStore(useShallow((s) => ({
    aiMessages: s.aiMessages,
    addAIMessage: s.addAIMessage,
    clearAIMessages: s.clearAIMessages,
    setAIPanelOpen: s.setAIPanelOpen,
    selfItems: s.selfItems,
    issues: s.issues,
    plans: s.plans,
  })))
  const { ask, loading } = useGroqAI()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages])

  const buildContext = () => {
    const parts = []
    if (selfItems.length > 0)
      parts.push(`【自分の要素】\n${selfItems.map((s) => `・${s.type}: ${s.content}`).join('\n')}`)
    if (issues.length > 0)
      parts.push(`【関心のある課題】\n${issues.map((i) => `・${i.title}`).join('\n')}`)
    if (plans.length > 0)
      parts.push(`【計画中の取り組み】\n${plans.map((p) => `・${p.title}`).join('\n')}`)
    return parts.join('\n\n')
  }

  const handleSend = async (message: string) => {
    if (!message.trim() || loading) return
    addAIMessage({ role: 'user', content: message })
    setInput('')

    const system = `あなたは自己探索と地域課題解決をサポートするファシリテーターです。
以下はユーザーが入力した情報です：

${buildContext() || '（まだ何も入力されていません）'}

この文脈を踏まえて、ユーザーの問いに対して：
- 簡潔に（3〜5文以内）
- 思考を深める視点を提供
- 日本語で回答してください`

    try {
      const response = await ask(system, message)
      addAIMessage({ role: 'assistant', content: response })
    } catch {
      addAIMessage({ role: 'assistant', content: 'エラーが発生しました。APIキーを確認してください。' })
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-indigo-500" />
          <span className="text-sm font-medium text-gray-800">AIファシリテーター</span>
        </div>
        <div className="flex gap-1">
          <button onClick={clearAIMessages} title="会話をリセット"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <RotateCcw size={13} />
          </button>
          <button onClick={() => setAIPanelOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={13} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {aiMessages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 text-center mb-4">
              入力した要素・課題・計画を踏まえて<br />AIが質問・提案をします
            </p>
            {QUICK_PROMPTS.map((prompt) => (
              <button key={prompt} onClick={() => handleSend(prompt)}
                className="w-full text-left text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 transition-colors">
                {prompt}
              </button>
            ))}
          </div>
        )}

        {aiMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-700 rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); handleSend(input) } }}
            placeholder="問いかけてみる… (Ctrl+Enter で送信)"
            rows={2}
            className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
          />
          <button onClick={() => handleSend(input)} disabled={!input.trim() || loading}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl transition-colors self-end">
            <Send size={13} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
