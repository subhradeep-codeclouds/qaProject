'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import { MessageSquare, Send, Users, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

type Message = {
  id: string
  source: 'telegram' | 'teams'
  from: string
  text: string
  date: string
  chat?: string
}

export default function InboxPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [activeSource, setActiveSource] = useState<'all' | 'telegram' | 'teams'>('all')
  const [telegramConfigured, setTelegramConfigured] = useState(false)

  useEffect(() => {
    const hasTelegram = !!process.env.NEXT_PUBLIC_TELEGRAM_CONFIGURED
    setTelegramConfigured(hasTelegram)
    if (hasTelegram) fetchMessages()
  }, [])

  async function fetchMessages() {
    setLoading(true)
    try {
      const res = await fetch('/api/inbox')
      const data = await res.json()
      if (data.messages) setMessages(data.messages)
    } catch {
      // Not configured yet
    }
    setLoading(false)
  }

  const filtered = messages.filter(m => activeSource === 'all' || m.source === activeSource)

  return (
    <div>
      <Header title="Inbox" />
      <div className="p-6 space-y-6 animate-fade-in">

        {/* Source filter tabs */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
            {(['all', 'telegram', 'teams'] as const).map(src => (
              <button key={src} onClick={() => setActiveSource(src)}
                className={cn('px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all flex items-center gap-2',
                  activeSource === src
                    ? 'bg-violet-600/30 text-violet-300 border border-violet-500/30'
                    : 'text-slate-500 hover:text-slate-300'
                )}>
                {src === 'telegram' && <Send size={13} />}
                {src === 'teams' && <Users size={13} />}
                {src === 'all' && <MessageSquare size={13} />}
                {src === 'all' ? 'All Messages' : src.charAt(0).toUpperCase() + src.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={fetchMessages} disabled={loading}
            className="btn-secondary">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Connection status cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Telegram */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg">
                <Send size={18} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">Telegram</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={cn('w-1.5 h-1.5 rounded-full', telegramConfigured ? 'bg-emerald-400' : 'bg-slate-600')} />
                  <span className="text-xs text-slate-500">{telegramConfigured ? 'Connected' : 'Not configured'}</span>
                </div>
              </div>
            </div>
            {!telegramConfigured && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <p className="text-xs text-blue-300 font-medium mb-2">Setup required:</p>
                <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                  <li>Message @BotFather on Telegram</li>
                  <li>Create a bot with /newbot</li>
                  <li>Add TELEGRAM_BOT_TOKEN to .env</li>
                  <li>Add TELEGRAM_CHAT_ID to .env</li>
                </ol>
              </div>
            )}
          </div>

          {/* Teams */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Users size={18} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">Microsoft Teams</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  <span className="text-xs text-slate-500">Not configured</span>
                </div>
              </div>
            </div>
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3">
              <p className="text-xs text-violet-300 font-medium mb-2">Setup required:</p>
              <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                <li>Go to Azure Portal</li>
                <li>Register an app in Entra ID</li>
                <li>Get MS_GRAPH_TOKEN</li>
                <li>Add to .env file</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Setup guide alert */}
        <div className="glass-card p-4 border-yellow-500/20 bg-yellow-500/5 flex items-start gap-3">
          <AlertCircle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-300">Configuration needed</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Once you add your API keys to the <code className="text-yellow-400 bg-yellow-500/10 px-1 rounded">.env</code> file and restart the server,
              your messages from Telegram and Teams will appear here in real-time.
            </p>
          </div>
        </div>

        {/* Messages */}
        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(msg => (
              <div key={msg.id} className="glass-card-hover p-4 flex items-start gap-3">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md',
                  msg.source === 'telegram' ? 'bg-gradient-to-br from-blue-400 to-cyan-500' : 'bg-gradient-to-br from-violet-500 to-indigo-600'
                )}>
                  {msg.source === 'telegram' ? <Send size={14} className="text-white" /> : <Users size={14} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{msg.from}</span>
                    {msg.chat && <span className="text-xs text-slate-600">in {msg.chat}</span>}
                    <span className="text-xs text-slate-600 ml-auto">{formatDistanceToNow(new Date(msg.date), { addSuffix: true })}</span>
                  </div>
                  <p className="text-sm text-slate-300">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="glass-card p-16 text-center">
              <MessageSquare size={40} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400">No messages yet.</p>
              <p className="text-slate-600 text-sm mt-1">Configure your integrations above to see messages here.</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
