import { useState } from 'react'
import { KeyRound, ArrowRight } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export default function ApiKeySetup() {
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const setGroqApiKey = useAppStore((s) => s.setGroqApiKey)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = key.trim()
    if (!trimmed.startsWith('gsk_')) {
      setError('GroqのAPIキーは "gsk_" で始まります。確認してください。')
      return
    }
    setGroqApiKey(trimmed)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 border border-indigo-200 mb-4">
            <KeyRound size={24} className="text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">VisionMap</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            自分のビジョンと地域課題をつなぐ思考整理ツール
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-700 mb-1">Groq APIキーを入力</h2>
          <p className="text-xs text-gray-400 mb-4">
            キーは端末のブラウザにのみ保存されます。外部には送信されません。
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              value={key}
              onChange={(e) => { setKey(e.target.value); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && handleSubmit(e as unknown as React.FormEvent)}
              placeholder="gsk_xxxxxxxxxxxxxxxx"
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
              autoFocus
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={!key}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-4 py-3 text-sm font-medium transition-colors"
            >
              はじめる
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="text-xs text-gray-400 mt-4 text-center">
            APIキーは{' '}
            <span className="text-gray-600 font-medium">console.groq.com</span>
            {' '}で取得できます
          </p>
        </div>
      </div>
    </div>
  )
}
