'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FolderKanban, ClipboardList,
  FileBarChart2, MessageSquare, Calendar,
  Bug, Settings, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/ThemeProvider'

const navItems = [
  { href: '/',           label: 'Dashboard',   icon: LayoutDashboard, color: 'text-indigo-500  dark:text-emerald-500' },
  { href: '/projects',   label: 'Projects',    icon: FolderKanban,    color: 'text-blue-500    dark:text-sky-400'     },
  { href: '/test-cases', label: 'Test Cases',  icon: ClipboardList,   color: 'text-sky-500     dark:text-cyan-400'    },
  { href: '/reports',    label: 'Reports',     icon: FileBarChart2,   color: 'text-violet-500  dark:text-yellow-400'  },
  { href: '/inbox',      label: 'Inbox',       icon: MessageSquare,   color: 'text-rose-500    dark:text-red-400'     },
  { href: '/calendar',   label: 'Calendar',    icon: Calendar,        color: 'text-cyan-600    dark:text-teal-400'    },
  { href: '/bugs',       label: 'Bug Tracker', icon: Bug,             color: 'text-red-500     dark:text-yellow-400'  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { dark } = useTheme()

  const asideStyle = dark ? {} : {
    background: 'rgba(248,249,255,0.90)',
    backdropFilter: 'blur(24px) saturate(190%)',
    WebkitBackdropFilter: 'blur(24px) saturate(190%)',
    borderRight: '1px solid rgba(99,102,241,0.18)',
    boxShadow: '4px 0 28px rgba(99,102,241,0.08)',
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col z-40
        dark:bg-[#020c02] dark:border-r dark:border-[#1e4a24] dark:shadow-black/40"
      style={asideStyle}
    >

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-indigo-100/60 dark:border-[#1e4a24]">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg dark:shadow-emerald-500/30"
          style={dark
            ? { background: 'linear-gradient(135deg,#00c853 0%,#00e676 100%)' }
            : { background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)', boxShadow: '0 4px 14px rgba(79,70,229,0.40)' }
          }
        >
          <Bug size={18} className="text-white dark:text-[#020c02]" />
        </div>
        <div>
          <h1 className="text-xs font-black leading-tight tracking-tight text-indigo-900 dark:text-[#d4f5d4]">
            Subhradeep Task
          </h1>
          <p className="text-[10px] font-medium tracking-wide text-indigo-400/80 dark:text-[#2d6a3e]">
            QA Management Portal
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-indigo-300/80 dark:text-[#1e4a24]">
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
                    isActive ? 'text-indigo-600 dark:text-[#00e676]' : color,
                    'flex-shrink-0'
                  )}
                />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <ChevronRight size={13} className="text-indigo-400 dark:text-[#00e676]/60" />
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-indigo-100/60 dark:border-[#1e4a24]">
        <Link href="/settings">
          <div className="sidebar-link">
            <Settings size={17} className="text-indigo-400 dark:text-[#2d6a3e]" />
            <span>Settings</span>
          </div>
        </Link>
        <div
          className="mt-3 px-3 py-3 rounded-xl dark:bg-[#0c2a10] dark:border dark:border-[#1e4a24]"
          style={dark ? {} : {
            background: 'linear-gradient(135deg, rgba(238,242,255,0.95) 0%, rgba(245,243,255,0.95) 100%)',
            border: '1px solid rgba(99,102,241,0.18)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#00e676] animate-pulse" />
            <span className="text-xs font-bold text-emerald-700 dark:text-[#00e676]">
              All systems live
            </span>
          </div>
          <p className="text-[10px] font-medium text-indigo-400/70 dark:text-[#2d6a3e]">
            Supabase · Vercel connected
          </p>
        </div>
      </div>
    </aside>
  )
}
