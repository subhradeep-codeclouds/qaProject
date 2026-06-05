'use client'

import Header from '@/components/Header'
import { ExternalLink, Link2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const BUG_TOOLS = [
  {
    name: 'Teamwork',
    description: 'Project management with built-in time tracking, task lists, and team collaboration.',
    url: 'https://www.teamwork.com',
    gradient: 'from-green-500 to-emerald-600',
    shadowColor: 'shadow-green-500/25',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/30',
    hoverBorder: 'hover:border-green-400/60',
    dotColor: 'bg-green-400',
  },
  {
    name: 'Trello',
    description: 'Visual kanban boards, lists, and cards for organising your projects and tracking bugs.',
    url: 'https://trello.com',
    gradient: 'from-blue-500 to-blue-600',
    shadowColor: 'shadow-blue-500/25',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    hoverBorder: 'hover:border-blue-400/60',
    dotColor: 'bg-blue-400',
  },
  {
    name: 'Asana',
    description: 'Track tasks, projects, and deadlines with clarity across your entire QA team.',
    url: 'https://app.asana.com',
    gradient: 'from-pink-500 to-rose-600',
    shadowColor: 'shadow-pink-500/25',
    textColor: 'text-pink-400',
    borderColor: 'border-pink-500/30',
    hoverBorder: 'hover:border-pink-400/60',
    dotColor: 'bg-pink-400',
  },
  {
    name: 'Jira',
    description: 'Plan, track, and manage agile software projects and bug reports at any scale.',
    url: 'https://www.atlassian.com/software/jira',
    gradient: 'from-blue-600 to-indigo-700',
    shadowColor: 'shadow-indigo-500/25',
    textColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    hoverBorder: 'hover:border-indigo-400/60',
    dotColor: 'bg-indigo-400',
  },
]

const TEAMWORK_FEATURES = ['Projects sync', 'Task cards', 'Bug tracking', 'Team overview', 'Time logs']

export default function BugsPage() {
  function handleConnectTeamwork() {
    toast('Teamwork login integration coming soon! 🚧', { duration: 3000 })
  }

  return (
    <div>
      <Header title="Bug Tracker" />
      <div className="p-6 space-y-8 animate-fade-in">

        {/* Page intro */}
        <div>
          <h2 className="section-title mb-1">Bug Tracking Integrations</h2>
          <p className="text-sm text-slate-500 dark:text-[#3d8a52]">
            Open your preferred bug tracking tool, or connect Teamwork for seamless in-portal access.
          </p>
        </div>

        {/* Quick access tools */}
        <div>
          <p className="text-[11px] font-bold text-slate-400 dark:text-[#2d6a3e] uppercase tracking-widest mb-4">
            Quick Access
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BUG_TOOLS.map(tool => (
              <a
                key={tool.name}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`glass-card flex flex-col gap-4 p-5 border ${tool.borderColor} ${tool.hoverBorder} hover:-translate-y-1 hover:shadow-xl transition-all duration-200 group`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-xl ${tool.shadowColor} flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  <span className="text-white font-black text-lg">{tool.name.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold text-base ${tool.textColor}`}>{tool.name}</h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{tool.description}</p>
                </div>
                <div className={`flex items-center gap-1.5 text-xs ${tool.textColor} font-medium`}>
                  <ExternalLink size={11} />
                  Open {tool.name}
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Connect with Teamwork */}
        <div>
          <p className="text-[11px] font-bold text-slate-400 dark:text-[#2d6a3e] uppercase tracking-widest mb-4">
            Integration
          </p>
          <div className="glass-card p-6 border border-green-500/25">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600
                flex items-center justify-center shadow-xl shadow-green-500/30 flex-shrink-0">
                <Link2 size={24} className="text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className="font-bold text-white text-base">Connect with Teamwork</h4>
                  <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full px-2 py-0.5">
                    Coming Soon
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-3 leading-relaxed">
                  Log in via your Teamwork account to sync all your projects, task cards, and issues directly into this portal.
                </p>
                <div className="flex flex-wrap gap-2">
                  {TEAMWORK_FEATURES.map(f => (
                    <span
                      key={f}
                      className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 rounded-full px-2.5 py-1"
                    >
                      <CheckCircle size={9} />
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={handleConnectTeamwork}
                className="btn-primary flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#00c853 0%,#00e676 100%)', color: '#020c02', boxShadow: '0 4px 14px rgba(0,230,118,0.35)' }}
              >
                <Link2 size={14} />
                Connect Teamwork
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
