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
  { href: '/',           label: 'Dashboard',   icon: LayoutDashboard, color: 'text-orange-500' },
  { href: '/projects',   label: 'Projects',    icon: FolderKanban,    color: 'text-blue-500'   },
  { href: '/test-cases', label: 'Test Cases',  icon: ClipboardList,   color: 'text-sky-500'    },
  { href: '/reports',    label: 'Reports',     icon: FileBarChart2,   color: 'text-amber-500'  },
  { href: '/inbox',      label: 'Inbox',       icon: MessageSquare,   color: 'text-rose-500'   },
  { href: '/calendar',   label: 'Calendar',    icon: Calendar,        color: 'text-cyan-500'   },
  { href: '/bugs',       label: 'Bug Tracker', icon: Bug,             color: 'text-red-500'    },
  { href: '/standup',    label: 'Standup',     icon: Zap,             color: 'text-yellow-500' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col z-40
      bg-white border-r border-orange-100 shadow-sm shadow-orange-50
      dark:bg-slate-900 dark:border-slate-800 dark:shadow-none">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-orange-100 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-blue-600
          flex items-center justify-center shadow-lg shadow-orange-200 dark:shadow-orange-900/30">
          <Bug size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xs font-black text-slate-800 dark:text-slate-100 leading-tight">
            Subhradeep Task
          </h1>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">
            Management
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
          Navigation
        </p>
        {navItems.map(({ href, label, icon: Icon, color }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}>
              <div className={cn(isActive ? 'sidebar-link-active' : 'sidebar-link', 'group')}>
                <Icon size={17}
                  className={cn(isActive ? 'text-orange-600 dark:text-orange-400' : color, 'flex-shrink-0')} />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <ChevronRight size={13} className="text-orange-400 dark:text-orange-500" />
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-orange-100 dark:border-slate-800">
        <Link href="/settings">
          <div className="sidebar-link">
            <Settings size={17} className="text-slate-400" />
            <span>Settings</span>
          </div>
        </Link>
        <div className="mt-3 px-3 py-3 rounded-xl
          bg-gradient-to-r from-orange-50 to-blue-50 border border-orange-200
          dark:from-orange-950/30 dark:to-blue-950/30 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              All systems live
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Supabase · Vercel connected
          </p>
        </div>
      </div>
    </aside>
  )
}
