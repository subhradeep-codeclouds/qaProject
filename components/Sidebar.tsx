'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FolderKanban, ClipboardList,
  FileBarChart2, MessageSquare, Calendar,
  Bug, Zap, Settings, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/',             label: 'Dashboard',   icon: LayoutDashboard, color: 'text-violet-400' },
  { href: '/projects',     label: 'Projects',    icon: FolderKanban,    color: 'text-teal-400' },
  { href: '/test-cases',   label: 'Test Cases',  icon: ClipboardList,   color: 'text-blue-400' },
  { href: '/reports',      label: 'Reports',     icon: FileBarChart2,   color: 'text-orange-400' },
  { href: '/inbox',        label: 'Inbox',       icon: MessageSquare,   color: 'text-pink-400' },
  { href: '/calendar',     label: 'Calendar',    icon: Calendar,        color: 'text-cyan-400' },
  { href: '/bugs',         label: 'Bug Tracker', icon: Bug,             color: 'text-red-400' },
  { href: '/standup',      label: 'Standup',     icon: Zap,             color: 'text-yellow-400' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col z-40 border-r border-white/[0.06]"
      style={{ background: 'rgba(8, 8, 24, 0.85)', backdropFilter: 'blur(20px)' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/[0.06]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Bug size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-wide">QA Portal</h1>
          <p className="text-[10px] text-slate-500">Senior QA Dashboard</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
          Menu
        </p>
        {navItems.map(({ href, label, icon: Icon, color }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}>
              <div className={cn(isActive ? 'sidebar-link-active' : 'sidebar-link', 'group')}>
                <Icon size={17} className={cn(isActive ? 'text-violet-400' : color, 'flex-shrink-0')} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} className="text-violet-400 opacity-70" />}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
        <Link href="/settings">
          <div className="sidebar-link">
            <Settings size={17} className="text-slate-500" />
            <span>Settings</span>
          </div>
        </Link>
        <div className="mt-3 px-3 py-3 rounded-xl bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">All systems live</span>
          </div>
          <p className="text-[10px] text-slate-500">Supabase · Vercel connected</p>
        </div>
      </div>
    </aside>
  )
}
