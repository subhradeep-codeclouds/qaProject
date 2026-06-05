'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FolderKanban, ClipboardList,
  FileBarChart2, MessageSquare, Calendar,
  Bug, Settings, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/',           label: 'Dashboard',   icon: LayoutDashboard, color: 'text-amber-600   dark:text-emerald-500' },
  { href: '/projects',   label: 'Projects',    icon: FolderKanban,    color: 'text-blue-600    dark:text-sky-400'     },
  { href: '/test-cases', label: 'Test Cases',  icon: ClipboardList,   color: 'text-sky-600     dark:text-cyan-400'    },
  { href: '/reports',    label: 'Reports',     icon: FileBarChart2,   color: 'text-amber-700   dark:text-yellow-400'  },
  { href: '/inbox',      label: 'Inbox',       icon: MessageSquare,   color: 'text-rose-600    dark:text-red-400'     },
  { href: '/calendar',   label: 'Calendar',    icon: Calendar,        color: 'text-cyan-600    dark:text-teal-400'    },
  { href: '/bugs',       label: 'Bug Tracker', icon: Bug,             color: 'text-red-600     dark:text-yellow-400'  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col z-40
      bg-[#fffbeb] border-r border-amber-300/50 shadow-lg shadow-amber-200/30
      dark:bg-[#020c02] dark:border-[#1e4a24] dark:shadow-black/40">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-amber-200/50 dark:border-[#1e4a24]">
        <div className="w-10 h-10 rounded-xl
          bg-gradient-to-br from-amber-400 to-yellow-500
          dark:from-emerald-500 dark:to-green-600
          flex items-center justify-center shadow-lg
          shadow-amber-300/50 dark:shadow-emerald-500/30">
          <Bug size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xs font-black text-amber-900 dark:text-[#d4f5d4] leading-tight tracking-tight">
            Subhradeep Task
          </h1>
          <p className="text-[10px] text-amber-600/80 dark:text-[#2d6a3e] font-medium tracking-wide">
            QA Management Portal
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-bold text-amber-400 dark:text-[#1e4a24] uppercase tracking-widest">
          Navigation
        </p>
        {navItems.map(({ href, label, icon: Icon, color }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}>
              <div className={cn(isActive ? 'sidebar-link-active' : 'sidebar-link', 'group')}>
                <Icon
                  size={17}
                  className={cn(
                    isActive ? 'text-amber-700 dark:text-[#00e676]' : color,
                    'flex-shrink-0'
                  )}
                />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <ChevronRight size={13} className="text-amber-500 dark:text-[#00e676]/60" />
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-amber-200/50 dark:border-[#1e4a24]">
        <Link href="/settings">
          <div className="sidebar-link">
            <Settings size={17} className="text-amber-500 dark:text-[#2d6a3e]" />
            <span>Settings</span>
          </div>
        </Link>
        <div className="mt-3 px-3 py-3 rounded-xl
          bg-gradient-to-r from-amber-100 to-yellow-50
          border border-amber-300/50
          dark:from-[#0c2a10] dark:to-[#071507] dark:border-[#1e4a24]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#00e676] animate-pulse" />
            <span className="text-xs font-bold text-emerald-700 dark:text-[#00e676]">
              All systems live
            </span>
          </div>
          <p className="text-[10px] text-amber-600/70 dark:text-[#2d6a3e]">
            Supabase · Vercel connected
          </p>
        </div>
      </div>
    </aside>
  )
}
