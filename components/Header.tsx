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

  return (
    <header className="h-16 flex items-center justify-between px-6 sticky top-0 z-30
      bg-white/92 backdrop-blur-xl border-b border-violet-100/70 shadow-sm shadow-violet-100/30
      dark:bg-[#020c02]/95 dark:border-[#1e4a24] dark:shadow-black/30">

      <div>
        <h2 className="text-lg font-black text-slate-800 dark:text-[#d4f5d4] tracking-tight">{title}</h2>
        <p className="text-xs text-slate-400 dark:text-[#2d6a3e] font-medium">{today}</p>
      </div>

      <div className="flex items-center gap-2.5">

        {/* Search */}
        <div className="relative hidden sm:flex items-center">
          <Search size={14} className="absolute left-3 text-slate-400 dark:text-[#2d6a3e]" />
          <input
            type="text"
            placeholder="Quick search..."
            className="pl-9 pr-4 py-2 text-xs rounded-xl w-52 transition-all outline-none
              bg-violet-50/80 border border-violet-200/60 text-slate-700 placeholder:text-slate-400
              focus:border-violet-400 focus:ring-2 focus:ring-violet-100
              dark:bg-[#071507] dark:border-[#1e4a24] dark:text-[#d4f5d4] dark:placeholder:text-[#2d6a3e]
              dark:focus:border-[#00e676] dark:focus:ring-[#00e676]/15"
          />
        </div>

        {/* Dark / Light toggle */}
        <button
          onClick={toggle}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          className={`relative flex items-center w-[52px] h-7 rounded-full transition-all duration-300 ${
            dark
              ? 'shadow-inner'
              : 'shadow-md shadow-violet-200'
          }`}
          style={dark
            ? { background: 'linear-gradient(135deg, #071507 0%, #0c2a10 100%)', border: '1px solid #1e4a24' }
            : { background: 'linear-gradient(135deg, #7c3aed 0%, #4338ca 100%)' }
          }
        >
          <div className={`absolute w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300
            flex items-center justify-center ${dark ? 'translate-x-[28px]' : 'translate-x-1'}`}>
            {dark
              ? <Moon size={10} className="text-[#00e676]" />
              : <Sun  size={10} className="text-violet-600" />
            }
          </div>
        </button>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all
          bg-violet-50 border border-violet-200/60 hover:bg-violet-100 hover:border-violet-300
          dark:bg-[#071507] dark:border-[#1e4a24] dark:hover:bg-[#0c2a10] dark:hover:border-[#2d6a3e]">
          <Bell size={15} className="text-violet-500 dark:text-[#00e676]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#00e676]" />
        </button>

        {/* Avatar + logout */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(s => !s)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-shadow
              bg-gradient-to-br from-violet-500 to-indigo-600
              dark:from-emerald-500 dark:to-green-600
              shadow-md shadow-violet-300/40 dark:shadow-emerald-500/30
              hover:shadow-lg hover:shadow-violet-300/60 dark:hover:shadow-emerald-500/50">
            <User size={15} className="text-white" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-11 z-20 w-48 rounded-2xl border shadow-xl p-1.5
                bg-white border-violet-200/60 shadow-violet-200/30
                dark:bg-[#071507] dark:border-[#1e4a24] dark:shadow-black/50">
                <div className="px-3 py-2.5 border-b mb-1 border-violet-100 dark:border-[#1e4a24]">
                  <p className="text-xs font-black text-slate-800 dark:text-[#d4f5d4]">Subhradeep</p>
                  <p className="text-[10px] text-slate-400 dark:text-[#2d6a3e] mt-0.5">QA Management Portal</p>
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
