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
    shadow: 'shadow-green-500/20',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/20',
    bgColor: 'bg-green-500/5',
    hoverBorder: 'hover:border-green-500/40',
  },
  {
    name: 'Trello',
    description: 'Visual kanban boards, lists, and cards for organising tasks and tracking bugs.',
    url: 'https://trello.com',
    gradient: 'from-blue-500 to-blue-600',
    shadow: 'shadow-blue-500/20',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/20',
    bgColor: 'bg-blue-500/5',
    hoverBorder: 'hover:border-blue-500/40',
  },
  {
    name: 'Asana',
    description: 'Track tasks, projects, and deadlines across your QA team with ease.',
    url: 'https://app.asana.com',
    gradient: 'from-pink-500 to-rose-600',
    shadow: 'shadow-pink-500/20',
    textColor: 'text-pink-400',
    borderColor: 'border-pink-500/20',
    bgColor: 'bg-pink-500/5',
    hoverBorder: 'hover:border-pink-500/40',
  },
  {
    name: 'Jira',
    description: 'Plan, track, and manage agile software projects and bug reports at scale.',
    url: 'https://www.atlassian.com/software/jira',
    gradient: 'from-blue-600 to-indigo-700',
    shadow: 'shadow-indigo-500/20',
    textColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/20',
    bgColor: 'bg-indigo-500/5',
    hoverBorder: 'hover:border-indigo-500/40',
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
          <h2 className="text-xl font-bold text-white mb-1">Bug Tracking Integrations</h2>
          <p className="text-slate-400 text-sm">
            Open your preferred bug tracking tool directly, or connect your Teamwork account for seamless in-portal access.
          </p>
        </div>

        {/* Quick access tools */}
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Quick Access</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BUG_TOOLS.map(tool => (
              <a
                key={tool.name}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`glass-card flex flex-col gap-4 p-5 border ${tool.borderColor} ${tool.bgColor} ${tool.hoverBorder} hover:scale-[1.02] transition-all duration-200 group`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-xl ${tool.shadow} flex-shrink-0`}>
                  <span className="text-white font-black text-lg">{tool.name.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold text-base ${tool.textColor}`}>{tool.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{tool.description}</p>
                </div>
                <div className={`flex items-center gap-1.5 text-xs ${tool.textColor} opacity-70 group-hover:opacity-100 transition-opacity`}>
                  <ExternalLink size={11} />
                  Open {tool.name}
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Connect with Teamwork */}
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Integration</p>
          <div className="glass-card p-6 border border-green-500/20 bg-green-500/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-green-500/30 flex-shrink-0">
                <Link2 size={24} className="text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-white text-base">Connect with Teamwork</h4>
                  <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full px-2 py-0.5">
                    Coming Soon
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-3">
                  Log in via your Teamwork account to sync all your projects, task cards, and issues directly into this portal.
                </p>
                <div className="flex flex-wrap gap-2">
                  {TEAMWORK_FEATURES.map(f => (
                    <span
                      key={f}
                      className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5"
                    >
                      <CheckCircle size={9} />
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={handleConnectTeamwork}
                className="btn-primary flex-shrink-0 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 shadow-lg shadow-green-500/20"
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
