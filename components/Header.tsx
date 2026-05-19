'use client'

import { Bell, Search, User, LogOut } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Header({ title }: { title: string }) {
  const today = format(new Date(), 'EEEE, MMMM do')
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06] sticky top-0 z-30"
      style={{ background: 'rgba(8, 8, 24, 0.80)', backdropFilter: 'blur(20px)' }}>

      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="text-xs text-slate-500">{today}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden sm:flex items-center">
          <Search size={14} className="absolute left-3 text-slate-500" />
          <input
            type="text"
            placeholder="Quick search..."
            className="pl-8 pr-4 py-2 text-xs rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 w-52"
          />
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.09] transition-colors">
          <Bell size={15} className="text-slate-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-500" />
        </button>

        {/* Avatar + logout menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(s => !s)}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20">
            <User size={15} className="text-white" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-11 z-20 w-44 glass-card p-1.5 shadow-xl shadow-black/40">
                <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                  <p className="text-xs font-medium text-white">QA Engineer</p>
                  <p className="text-[10px] text-slate-500">Senior QA</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors">
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
