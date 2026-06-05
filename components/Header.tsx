'use client'

import { Bell, Search, User, LogOut, Sun, Moon } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTheme } from '@/components/ThemeProvider'

export default function Header({ title }: { title: string }) {
  const today = format(new Date(), 'EEEE, MMMM do')
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const { dark, toggle } = useTheme()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const headerStyle = dark ? {} : {
    background: 'rgba(255,255,255,0.88)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    borderBottom: '1px solid rgba(99,102,241,0.14)',
    boxShadow: '0 1px 16px rgba(99,102,241,0.08)',
  }

  return (
    <header
      className="h-16 flex items-center justify-between px-6 sticky top-0 z-30
        dark:bg-[#020c02]/95 dark:border-b dark:border-[#1e4a24] dark:shadow-black/30"
      style={headerStyle}
    >

      <div>
        <h2 className="text-lg font-black tracking-tight text-indigo-900 dark:text-[#d4f5d4]">{title}</h2>
        <p className="text-xs font-medium text-indigo-400/80 dark:text-[#2d6a3e]">{today}</p>
      </div>

      <div className="flex items-center gap-2.5">

        {/* Search */}
        <div className="relative hidden sm:flex items-center">
          <Search size={14} className="absolute left-3 text-indigo-400 dark:text-[#2d6a3e]" />
          <input
            type="text"
            placeholder="Quick search..."
            className="pl-9 pr-4 py-2 text-xs rounded-xl w-52 transition-all outline-none
              text-indigo-900 placeholder:text-indigo-300
              dark:text-[#d4f5d4] dark:placeholder:text-[#2d6a3e]
              dark:border dark:border-[#1e4a24]
              dark:focus:border-[#00e676] dark:focus:ring-[#00e676]/15"
            style={dark ? { background: '#071507' } : {
              background: 'rgba(238,242,255,0.85)',
              border: '1.5px solid rgba(99,102,241,0.20)',
            }}
            onFocus={e => !dark && Object.assign(e.target.style, { borderColor: 'rgba(79,70,229,0.50)', boxShadow: '0 0 0 3px rgba(99,102,241,0.10)' })}
            onBlur={e => !dark && Object.assign(e.target.style, { borderColor: 'rgba(99,102,241,0.20)', boxShadow: 'none' })}
          />
        </div>

        {/* Dark / Light toggle */}
        <button
          onClick={toggle}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="relative flex items-center w-[52px] h-7 rounded-full transition-all duration-300"
          style={dark
            ? { background: 'linear-gradient(135deg,#071507 0%,#0c2a10 100%)', border: '1px solid #1e4a24' }
            : { background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)', boxShadow: '0 2px 10px rgba(79,70,229,0.50)' }
          }
        >
          <div className={`absolute w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300
            flex items-center justify-center ${dark ? 'translate-x-[28px]' : 'translate-x-1'}`}>
            {dark
              ? <Moon size={10} className="text-[#00e676]" />
              : <Sun  size={10} className="text-indigo-600" />
            }
          </div>
        </button>

        {/* Notifications */}
        <button
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all
            dark:bg-[#071507] dark:border dark:border-[#1e4a24] dark:hover:bg-[#0c2a10]"
          style={dark ? {} : {
            background: 'rgba(238,242,255,0.88)',
            border: '1.5px solid rgba(99,102,241,0.22)',
          }}
          onMouseEnter={e => !dark && Object.assign((e.target as HTMLElement).style, { borderColor: 'rgba(79,70,229,0.40)', background: 'rgba(224,231,255,0.90)' })}
          onMouseLeave={e => !dark && Object.assign((e.target as HTMLElement).style, { borderColor: 'rgba(99,102,241,0.22)', background: 'rgba(238,242,255,0.88)' })}
        >
          <Bell size={15} className="text-indigo-500 dark:text-[#00e676]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 dark:bg-[#00e676]" />
        </button>

        {/* Avatar + logout */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(s => !s)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-shadow"
            style={dark
              ? { background: 'linear-gradient(135deg,#00c853 0%,#00e676 100%)', boxShadow: '0 4px 12px rgba(0,230,118,0.30)' }
              : { background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)', boxShadow: '0 4px 12px rgba(79,70,229,0.45)' }
            }
          >
            <User size={15} className="text-white dark:text-[#020c02]" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div
                className="absolute right-0 top-11 z-20 w-48 rounded-2xl border shadow-xl p-1.5
                  dark:bg-[#071507] dark:border-[#1e4a24] dark:shadow-black/50"
                style={dark ? {} : {
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(99,102,241,0.20)',
                  boxShadow: '0 8px 32px rgba(99,102,241,0.18)',
                }}
              >
                <div className="px-3 py-2.5 border-b border-indigo-100/60 dark:border-[#1e4a24] mb-1">
                  <p className="text-xs font-black text-indigo-900 dark:text-[#d4f5d4]">Subhradeep</p>
                  <p className="text-[10px] text-indigo-400/70 dark:text-[#2d6a3e] mt-0.5">QA Management Portal</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors
                    text-red-500 hover:bg-red-50 hover:text-red-600
                    dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300">
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
