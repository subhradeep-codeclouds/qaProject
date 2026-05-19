'use client'

import Header from '@/components/Header'
import { Settings, Database, Key, Globe, MessageSquare, Calendar, CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

const steps = [
  {
    title: 'Install dependencies',
    description: 'Run: npm install in the qa-portal folder',
    code: 'npm install',
    icon: Settings,
    color: 'from-violet-500 to-purple-600',
  },
  {
    title: 'Create Supabase project',
    description: 'Go to supabase.com → New Project → Copy your URL and anon key',
    icon: Database,
    color: 'from-green-500 to-emerald-600',
  },
  {
    title: 'Run database schema',
    description: 'In Supabase dashboard → SQL Editor → paste contents of supabase/schema.sql → Run',
    icon: Database,
    color: 'from-teal-500 to-cyan-600',
  },
  {
    title: 'Set up environment variables',
    description: 'Copy .env.example to .env.local and fill in your Supabase credentials',
    code: 'cp .env.example .env.local',
    icon: Key,
    color: 'from-orange-500 to-red-500',
  },
  {
    title: 'Start development server',
    description: 'Run the app locally at http://localhost:3000',
    code: 'npm run dev',
    icon: Globe,
    color: 'from-blue-500 to-indigo-600',
  },
  {
    title: 'Deploy to Vercel (free)',
    description: 'Push to GitHub → Connect Vercel → Add env vars in Vercel dashboard → Deploy',
    icon: Globe,
    color: 'from-pink-500 to-rose-600',
  },
]

const integrations = [
  {
    title: 'Telegram Bot',
    status: 'optional',
    steps: [
      'Open Telegram, search @BotFather',
      'Send /newbot and follow prompts',
      'Copy the bot token',
      'Add TELEGRAM_BOT_TOKEN to .env.local',
      'Add your chat ID to TELEGRAM_CHAT_ID',
    ],
    icon: MessageSquare,
    color: 'from-blue-400 to-cyan-500',
  },
  {
    title: 'Google Calendar',
    status: 'optional',
    steps: [
      'Go to console.cloud.google.com',
      'Create a new project',
      'Enable Google Calendar API',
      'Create OAuth2 credentials',
      'Add client ID and secret to .env.local',
    ],
    icon: Calendar,
    color: 'from-red-400 to-orange-500',
  },
]

export default function SettingsPage() {
  return (
    <div>
      <Header title="Settings & Setup" />
      <div className="p-6 space-y-8 animate-fade-in">

        <div className="glass-card p-6 border-violet-500/20 bg-violet-500/5">
          <h3 className="font-bold text-white mb-1">Getting Started</h3>
          <p className="text-sm text-slate-400">Follow these steps to get your QA Portal up and running completely free.</p>
        </div>

        {/* Setup steps */}
        <div className="space-y-3">
          <h3 className="section-title">Setup Steps</h3>
          {steps.map((step, i) => (
            <div key={i} className="glass-card p-5 flex items-start gap-4">
              <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg flex-shrink-0', step.color)}>
                <step.icon size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-600 font-mono">Step {i + 1}</span>
                </div>
                <p className="font-semibold text-white text-sm">{step.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
                {step.code && (
                  <code className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-violet-300 font-mono">
                    {step.code}
                  </code>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Integrations */}
        <div className="space-y-3">
          <h3 className="section-title">Optional Integrations</h3>
          {integrations.map((intg, i) => (
            <div key={i} className="glass-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg', intg.color)}>
                  <intg.icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">{intg.title}</p>
                  <span className="badge bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">Optional</span>
                </div>
              </div>
              <ol className="space-y-2">
                {intg.steps.map((s, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="w-5 h-5 rounded-full bg-white/[0.06] text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 text-slate-500">{j + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {/* .env.local reference */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-white mb-3">Environment Variables Reference</h3>
          <div className="bg-black/40 rounded-xl p-4 font-mono text-xs space-y-1 border border-white/[0.06]">
            {[
              ['NEXT_PUBLIC_SUPABASE_URL', 'Your Supabase project URL'],
              ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Your Supabase anon key'],
              ['TELEGRAM_BOT_TOKEN', 'From @BotFather (optional)'],
              ['TELEGRAM_CHAT_ID', 'Your Telegram chat ID (optional)'],
              ['NEXT_PUBLIC_GOOGLE_CLIENT_ID', 'Google OAuth client ID (optional)'],
              ['GOOGLE_CLIENT_SECRET', 'Google OAuth secret (optional)'],
            ].map(([key, desc]) => (
              <div key={key} className="flex items-start gap-3">
                <span className="text-violet-400">{key}</span>
                <span className="text-slate-600">=</span>
                <span className="text-slate-500 italic"># {desc}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
