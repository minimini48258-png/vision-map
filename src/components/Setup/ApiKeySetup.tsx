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
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 mb-4">
            <KeyRound size={24} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">VisionMap</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            自分のビジョンと地域課題をつなぐ思考整理ツール
          </p>
        </div>

        <div className="bg-[#161b27] border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-sm font-medium text-slate-300 mb-1">Groq APIキーを入力</h2>
          <p className="text-xs text-slate-500 mb-4">
            キーは端末のブラウザにのみ保存されます。外部には送信されません。
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              value={key}
              onChange={(e) => { setKey(e.target.value); setError('') }}
              placeholder="gsk_xxxxxxxxxxxxxxxx"
              className="w-full bg-[#0f1117] border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              autoFocus
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={!key}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-4 py-3 text-sm font-medium transition-colors"
            >
              はじめる
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="text-xs text-slate-600 mt-4 text-center">
            APIキーは{' '}
            <span className="text-slate-400">console.groq.com</span>
            {' '}で取得できます
          </p>
        </div>
      </div>
    </div>
  )
}
