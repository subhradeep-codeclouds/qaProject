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
    <header className="h-16 flex items-center justify-between px-6 border-b border-violet-100 sticky top-0 z-30 bg-white/80 backdrop-blur-xl">

      <div>
        <h2 className="text-lg font-black text-slate-800">{title}</h2>
        <p className="text-xs text-slate-400 font-medium">{today}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden sm:flex items-center">
          <Search size={14} className="absolute left-3 text-slate-400" />
          <input
            type="text"
            placeholder="Quick search..."
            className="pl-9 pr-4 py-2 text-xs rounded-xl bg-violet-50 border border-violet-100 text-slate-600 placeholder:text-slate-400 focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 w-52 transition-all"
          />
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center hover:bg-violet-100 transition-colors">
          <Bell size={15} className="text-violet-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500" />
        </button>

        {/* Avatar + logout menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(s => !s)}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-200 hover:shadow-violet-300 transition-shadow">
            <User size={15} className="text-white" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-11 z-20 w-44 bg-white rounded-2xl border border-violet-100 shadow-xl shadow-violet-100 p-1.5">
                <div className="px-3 py-2 border-b border-violet-50 mb-1">
                  <p className="text-xs font-bold text-slate-700">Subhradeep</p>
                  <p className="text-[10px] text-slate-400">QA Management Portal</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors font-medium">
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
