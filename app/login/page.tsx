'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye, EyeOff, Lock, LogIn, ShieldCheck,
  FolderKanban, ClipboardList, FileBarChart2,
  Bug, Calendar, MessageSquare, Zap, CheckCircle2
} from 'lucide-react'

const features = [
  { icon: FolderKanban, label: 'Project Hub',    desc: 'Manage all projects',     color: 'from-violet-500 to-purple-600',   delay: 'delay-100' },
  { icon: ClipboardList, label: 'Test Cases',    desc: 'Track every test case',   color: 'from-blue-500 to-indigo-600',     delay: 'delay-200' },
  { icon: FileBarChart2, label: 'Daily Reports', desc: 'Log testing reports',     color: 'from-teal-500 to-cyan-600',       delay: 'delay-300' },
  { icon: Bug,           label: 'Bug Tracker',   desc: 'Capture & track bugs',    color: 'from-orange-500 to-red-500',      delay: 'delay-100' },
  { icon: Calendar,      label: 'Calendar',      desc: 'View your meetings',      color: 'from-pink-500 to-rose-600',       delay: 'delay-200' },
  { icon: Zap,           label: 'Standup Notes', desc: 'Daily standup log',       color: 'from-yellow-500 to-amber-500',    delay: 'delay-300' },
]

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) return setError('Please enter your password')
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      setSuccess(true)
      setTimeout(() => { router.push('/'); router.refresh() }, 800)
    } else {
      setLoading(false)
      setError('Wrong password. Please try again.')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left Panel ── */}
      <div className="hidden lg:flex flex-col w-[58%] relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 30%, #db2777 70%, #f97316 100%)' }}>

        {/* Floating decorative blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full opacity-20 animate-float"
          style={{ background: 'radial-gradient(circle, #fff, transparent)' }} />
        <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 rounded-full opacity-15 animate-float-reverse"
          style={{ background: 'radial-gradient(circle, #fff, transparent)' }} />
        <div className="absolute top-[40%] right-[-40px] w-48 h-48 rounded-full opacity-10 animate-float"
          style={{ background: 'radial-gradient(circle, #fbbf24, transparent)' }} />
        <div className="absolute top-[20%] left-[60%] w-32 h-32 rounded-full opacity-20 animate-float-reverse"
          style={{ background: 'radial-gradient(circle, #34d399, transparent)' }} />

        {/* Dot grid pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10 flex flex-col h-full px-12 py-12">

          {/* Logo + Name */}
          <div className="animate-fade-slide-right">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 animate-pulse-ring">
                <Bug size={26} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
                  Subhradeep QA
                </h1>
                <p className="text-white/70 text-sm font-medium tracking-widest uppercase">Management</p>
              </div>
            </div>
          </div>

          {/* Headline */}
          <div className="mt-12 animate-fade-slide-up delay-100">
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              Your complete<br />
              <span className="text-yellow-300">QA workspace</span><br />
              in one place.
            </h2>
            <p className="text-white/70 text-base leading-relaxed max-w-sm">
              Manage projects, test cases, bug reports, and daily standups — all from a single powerful dashboard.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-3 gap-3 mt-10">
            {features.map(({ icon: Icon, label, desc, color, delay }) => (
              <div key={label}
                className={`animate-fade-slide-up ${delay} opacity-0`}
                style={{ animationFillMode: 'forwards' }}>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-3.5 hover:bg-white/20 transition-all duration-200 group">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-2.5 shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                    <Icon size={16} className="text-white" />
                  </div>
                  <p className="text-white text-xs font-bold">{label}</p>
                  <p className="text-white/60 text-[10px] mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom stats */}
          <div className="mt-auto pt-8 flex items-center gap-6 animate-fade-slide-up delay-500" style={{ animationFillMode: 'forwards' }}>
            {[
              { label: 'Projects', val: '∞' },
              { label: 'Test Cases', val: '∞' },
              { label: 'Free Forever', val: '✓' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black text-white">{s.val}</p>
                <p className="text-white/60 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-violet-50 via-white to-indigo-50">
        <div className="w-full max-w-sm animate-fade-slide-up" style={{ animationFillMode: 'forwards' }}>

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-violet-200">
              <Bug size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-800">Subhradeep QA Management</h1>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-violet-100 border border-violet-100 p-8">

            {success ? (
              /* Success state */
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 animate-pulse-ring">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Welcome back!</h3>
                <p className="text-slate-400 text-sm mt-1">Taking you to your dashboard...</p>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-black text-slate-800">Welcome back! 👋</h2>
                  <p className="text-slate-400 text-sm mt-1">Enter your password to access your portal</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="label">Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError('') }}
                        placeholder="Enter your password"
                        className="input-field pl-10 pr-10"
                        autoFocus
                      />
                      <button type="button"
                        onClick={() => setShowPassword(s => !s)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 transition-colors">
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    {error && (
                      <div className="mt-2.5 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl">
                        <ShieldCheck size={13} /> {error}
                      </div>
                    )}
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-violet-200 hover:shadow-violet-300 hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:translate-y-0">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn size={16} /> Sign In to Portal
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-violet-50">
                  <div className="flex items-center justify-center gap-4">
                    {['Projects', 'Reports', 'Bugs', 'Calendar'].map((f, i) => (
                      <span key={f} className="text-[10px] text-slate-400 font-medium">{f}</span>
                    ))}
                  </div>
                  <p className="text-center text-[10px] text-slate-300 mt-2">Personal access · Session lasts 30 days</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
