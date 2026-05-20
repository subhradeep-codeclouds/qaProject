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
      bg-white/90 backdrop-blur-xl border-b border-orange-100 shadow-sm shadow-orange-100/40
      dark:bg-[#0c2040]/95 dark:border-[#1a3355] dark:shadow-none">

      <div>
        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">{title}</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{today}</p>
      </div>

      <div className="flex items-center gap-2.5">

        {/* Search */}
        <div className="relative hidden sm:flex items-center">
          <Search size={14} className="absolute left-3 text-slate-400" />
          <input
            type="text"
            placeholder="Quick search..."
            className="pl-9 pr-4 py-2 text-xs rounded-xl w-52 transition-all
              bg-orange-50 border border-orange-100 text-slate-600 placeholder:text-slate-400
              focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100
              dark:bg-[#122240] dark:border-[#1a3355] dark:text-slate-300 dark:placeholder:text-[#3a6090]
              dark:focus:border-orange-500 dark:focus:ring-orange-500/20"
          />
        </div>

        {/* Dark / Light toggle */}
        <button
          onClick={toggle}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          className={`relative flex items-center w-[52px] h-7 rounded-full transition-all duration-300 ${
            dark
              ? 'bg-gradient-to-r from-slate-700 to-blue-800 shadow-inner'
              : 'bg-gradient-to-r from-orange-400 to-amber-300 shadow-md shadow-orange-200'
          }`}>
          <div className={`absolute w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300
            flex items-center justify-center ${dark ? 'translate-x-[28px]' : 'translate-x-1'}`}>
            {dark
              ? <Moon size={10} className="text-blue-600" />
              : <Sun  size={10} className="text-orange-500" />
            }
          </div>
        </button>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors
          bg-orange-50 border border-orange-100 hover:bg-orange-100
          dark:bg-[#122240] dark:border-[#1a3355] dark:hover:bg-[#1a3355]">
          <Bell size={15} className="text-orange-500 dark:text-orange-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
        </button>

        {/* Avatar + logout */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(s => !s)}
            className="w-9 h-9 rounded-xl flex items-center justify-center
              bg-gradient-to-br from-orange-500 to-blue-600
              shadow-md shadow-orange-200 dark:shadow-orange-900/30
              hover:shadow-orange-300 dark:hover:shadow-orange-800/40 transition-shadow">
            <User size={15} className="text-white" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-11 z-20 w-44 rounded-2xl border shadow-xl p-1.5
                bg-white border-orange-100 shadow-orange-100
                dark:bg-[#0c2040] dark:border-[#1a3355] dark:shadow-[#071b3c]">
                <div className="px-3 py-2 border-b mb-1 border-orange-50 dark:border-[#1a3355]">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Subhradeep</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">QA Management Portal</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors
                    text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
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
