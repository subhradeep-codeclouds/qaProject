'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye, EyeOff, Lock, LogIn, CheckCircle2, Clock,
  FolderKanban, ClipboardList, FileBarChart2,
  Bug, Calendar, Zap,
} from 'lucide-react'
import { format } from 'date-fns'

/* ─── Time-based themes ─────────────────────────────────── */
function getTimeTheme(hour: number) {
  if (hour >= 5 && hour < 8) return {
    name: 'sunrise',
    gradient: 'linear-gradient(135deg, #f7971e 0%, #ffd200 40%, #ff6b6b 70%, #a855f7 100%)',
    greeting: 'Good Morning', emoji: '🌅',
    desc: 'Rise and shine! Your tasks await.',
    particles: ['✦', '✧', '⋆', '★'],
    icon: '🌄',
    accent: '#ffd200',
  }
  if (hour >= 8 && hour < 12) return {
    name: 'morning',
    gradient: 'linear-gradient(135deg, #00b4db 0%, #38ef7d 40%, #11998e 70%, #0083b0 100%)',
    greeting: 'Good Morning', emoji: '☀️',
    desc: 'A bright new day full of possibilities!',
    particles: ['☁️', '🌤', '✦', '⋆'],
    icon: '☀️',
    accent: '#38ef7d',
  }
  if (hour >= 12 && hour < 17) return {
    name: 'afternoon',
    gradient: 'linear-gradient(135deg, #4776e6 0%, #8e54e9 40%, #f953c6 70%, #b91d73 100%)',
    greeting: 'Good Afternoon', emoji: '🌤️',
    desc: 'Keep the momentum going strong!',
    particles: ['✦', '◆', '⬟', '✧'],
    icon: '🌞',
    accent: '#f953c6',
  }
  if (hour >= 17 && hour < 20) return {
    name: 'evening',
    gradient: 'linear-gradient(135deg, #f7971e 0%, #dd5e89 40%, #6e48aa 70%, #4776e6 100%)',
    greeting: 'Good Evening', emoji: '🌇',
    desc: 'Wrapping up the day beautifully!',
    particles: ['✦', '★', '⋆', '✧'],
    icon: '🌆',
    accent: '#dd5e89',
  }
  return {
    name: 'night',
    gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 40%, #24243e 70%, #1a1a2e 100%)',
    greeting: 'Good Evening', emoji: '🌙',
    desc: 'Still at it? You are unstoppable!',
    particles: ['⭐', '✨', '💫', '🌟'],
    icon: '🌙',
    accent: '#a78bfa',
  }
}

/* ─── Error reactions ────────────────────────────────────── */
const errorReactions = [
  { emoji: '😶', msg: "Oops! You forgot to type your password!" },
  { emoji: '😯', msg: "Hmm, that password doesn't look right!" },
  { emoji: '😅', msg: "Nope! Double-check and try again." },
  { emoji: '🤦', msg: "Still wrong? Take a breath and try again!" },
  { emoji: '🙈', msg: "Are you sure that's the right password?!" },
]

const blankReactions = [
  { emoji: '🤔', msg: "Don't forget to enter your password first!" },
  { emoji: '😶', msg: "The password field is empty... give it a go!" },
]

const features = [
  { icon: FolderKanban,  label: 'Project Hub',   desc: 'All projects in one place', color: 'from-violet-500 to-purple-600' },
  { icon: ClipboardList, label: 'Test Cases',    desc: 'Track every test case',     color: 'from-blue-500 to-indigo-500'   },
  { icon: FileBarChart2, label: 'Daily Reports', desc: 'Log testing results',       color: 'from-teal-500 to-cyan-500'     },
  { icon: Bug,           label: 'Bug Tracker',   desc: 'Capture & fix bugs fast',   color: 'from-orange-500 to-red-500'    },
  { icon: Calendar,      label: 'Calendar',      desc: 'Never miss a meeting',      color: 'from-pink-500 to-rose-500'     },
  { icon: Zap,           label: 'Standup Notes', desc: 'Quick daily log',           color: 'from-yellow-500 to-amber-500'  },
]

/* ─── Floating particles ─────────────────────────────────── */
function Particles({ symbols }: { symbols: string[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 18 }).map((_, i) => {
        const sym = symbols[i % symbols.length]
        const size = 10 + (i % 5) * 4
        const left = (i * 17 + 5) % 95
        const delay = (i * 0.7) % 8
        const dur = 8 + (i % 6) * 2
        return (
          <div key={i}
            className="absolute select-none"
            style={{
              left: `${left}%`,
              bottom: '-5%',
              fontSize: `${size}px`,
              opacity: 0,
              animation: `particleDrift ${dur}s ${delay}s ease-in linear infinite`,
            }}>
            {sym}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Stars (night only) ─────────────────────────────────── */
function Stars() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            width: `${1 + (i % 3)}px`,
            height: `${1 + (i % 3)}px`,
            top: `${(i * 13 + 7) % 85}%`,
            left: `${(i * 19 + 3) % 95}%`,
            animationDelay: `${(i * 0.3) % 3}s`,
            animationDuration: `${1.5 + (i % 3) * 0.8}s`,
          }} />
      ))}
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]             = useState<{ emoji: string; msg: string } | null>(null)
  const [loading, setLoading]         = useState(false)
  const [success, setSuccess]         = useState(false)
  const [now, setNow]                 = useState(new Date())
  const [shakeKey, setShakeKey]       = useState(0)
  const [emojiKey, setEmojiKey]       = useState(0)
  const [attemptCount, setAttemptCount] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const theme   = getTimeTheme(now.getHours())
  const hours   = format(now, 'hh')
  const minutes = format(now, 'mm')
  const seconds = format(now, 'ss')
  const ampm    = format(now, 'a')
  const dateStr = format(now, 'EEEE, MMMM do yyyy')

  function triggerError(reaction: { emoji: string; msg: string }) {
    setError(reaction)
    setShakeKey(k => k + 1)
    setEmojiKey(k => k + 1)
    inputRef.current?.focus()
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    if (!password.trim()) {
      const r = blankReactions[attemptCount % blankReactions.length]
      triggerError(r)
      setAttemptCount(c => c + 1)
      return
    }

    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      setSuccess(true)
      setTimeout(() => { router.push('/'); router.refresh() }, 1000)
    } else {
      setLoading(false)
      setPassword('')
      const r = errorReactions[Math.min(attemptCount, errorReactions.length - 1)]
      triggerError(r)
      setAttemptCount(c => c + 1)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ══════════════ LEFT PANEL ══════════════ */}
      <div className="hidden lg:flex flex-col w-[58%] relative overflow-hidden"
        style={{ background: theme.gradient }}>

        {/* Animated gradient overlay */}
        <div className="absolute inset-0 animate-gradient-shift opacity-30"
          style={{ background: theme.gradient, backgroundSize: '300% 300%' }} />

        {/* Night stars */}
        {theme.name === 'night' && <Stars />}

        {/* Floating particles */}
        <Particles symbols={theme.particles} />

        {/* Floating blobs */}
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 rounded-full opacity-20 animate-float"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.8), transparent)' }} />
        <div className="absolute bottom-[-80px] right-[-80px] w-[28rem] h-[28rem] rounded-full opacity-15 animate-float-reverse"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.6), transparent)' }} />
        <div className="absolute top-[35%] right-[-60px] w-64 h-64 rounded-full opacity-10 animate-float-slow"
          style={{ background: `radial-gradient(circle, ${theme.accent}, transparent)` }} />
        <div className="absolute top-[15%] left-[55%] w-40 h-40 rounded-full opacity-20 animate-float"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.5), transparent)', animationDelay: '2s' }} />
        <div className="absolute bottom-[25%] left-[5%] w-28 h-28 rounded-full opacity-15 animate-float-reverse"
          style={{ background: `radial-gradient(circle, ${theme.accent}, transparent)`, animationDelay: '3s' }} />

        {/* Rotating ring (day themes) */}
        {theme.name !== 'night' && (
          <div className="absolute top-8 right-8 w-20 h-20 rounded-full border-2 border-white/20 animate-rotate-sun flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border border-white/30" />
          </div>
        )}

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative z-10 flex flex-col h-full px-12 py-10">

          {/* Logo */}
          <div className="animate-fade-slide-right" style={{ animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 animate-pulse-ring flex-shrink-0">
                <Bug size={22} className="text-white" />
              </div>
              <h1 className="text-xl font-black text-white tracking-tight whitespace-nowrap drop-shadow-sm">
                Subhradeep Task Management
              </h1>
            </div>
          </div>

          {/* Live Clock */}
          <div className="mt-8 animate-fade-slide-up delay-100" style={{ animationFillMode: 'forwards' }}>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 inline-block shadow-2xl">

              {/* Greeting */}
              <div className="flex items-center gap-2 mb-5">
                <span className="text-3xl animate-float" style={{ display: 'inline-block' }}>{theme.emoji}</span>
                <div>
                  <p className="text-white font-black text-xl leading-tight">{theme.greeting}!</p>
                  <p className="text-white/60 text-xs mt-0.5">{theme.desc}</p>
                </div>
              </div>

              {/* Clock digits */}
              <div className="flex items-end gap-1.5">
                {[
                  { val: hours,   label: 'HRS',  color: 'text-white' },
                  { val: ':',     label: '',      color: 'text-white/50' },
                  { val: minutes, label: 'MIN',   color: 'text-white' },
                  { val: ':',     label: '',      color: 'text-white/50' },
                  { val: seconds, label: 'SEC',   color: 'text-yellow-300' },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className={`text-5xl font-black tabular-nums leading-none ${item.color} drop-shadow-lg`}>
                      {item.val}
                    </div>
                    {item.label && <div className="text-[9px] text-white/40 uppercase tracking-widest mt-1">{item.label}</div>}
                  </div>
                ))}
                <div className="mb-2 ml-2">
                  <span className="text-lg font-bold text-white/60">{ampm}</span>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 pt-3 mt-1 border-t border-white/10">
                <Clock size={12} className="text-white/40" />
                <span className="text-xs text-white/60 font-medium">{dateStr}</span>
              </div>
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-3 gap-3 mt-7">
            {features.map(({ icon: Icon, label, desc, color }, i) => {
              const delays = ['delay-100','delay-200','delay-300','delay-100','delay-200','delay-300']
              return (
                <div key={label} className={`animate-fade-slide-up ${delays[i]} opacity-0`}
                  style={{ animationFillMode: 'forwards' }}>
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-3.5 hover:bg-white/25 hover:scale-105 hover:shadow-xl transition-all duration-250 group cursor-default">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-2.5 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-200`}>
                      <Icon size={16} className="text-white" />
                    </div>
                    <p className="text-white text-xs font-bold">{label}</p>
                    <p className="text-white/55 text-[10px] mt-0.5">{desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bottom bar */}
          <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between animate-fade-slide-up delay-700"
            style={{ animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-6">
              {[{ l: 'Projects', v: '∞' }, { l: 'Reports', v: '∞' }, { l: 'Free Forever', v: '✓' }].map(s => (
                <div key={s.l} className="text-center">
                  <p className="text-xl font-black text-white">{s.v}</p>
                  <p className="text-white/50 text-[10px]">{s.l}</p>
                </div>
              ))}
            </div>
            <div className="text-4xl animate-float" style={{ display: 'inline-block', animationDelay: '1s' }}>
              {theme.icon}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════ RIGHT PANEL ══════════════ */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-violet-50 via-white to-indigo-50 relative overflow-hidden">

        {/* Soft bg blobs on right */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20 animate-float-slow"
          style={{ background: 'radial-gradient(circle, #c4b5fd, transparent)', transform: 'translate(40%, -40%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-15 animate-float"
          style={{ background: 'radial-gradient(circle, #a5f3fc, transparent)', transform: 'translate(-30%, 30%)', animationDelay: '3s' }} />

        <div className="w-full max-w-sm relative z-10">

          {/* Mobile header */}
          <div className="lg:hidden text-center mb-6 animate-fade-slide-up" style={{ animationFillMode: 'forwards' }}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-violet-200 animate-pulse-ring">
              <Bug size={24} className="text-white" />
            </div>
            <h1 className="text-lg font-black text-slate-800">Subhradeep Task Management</h1>
            <p className="text-slate-400 text-sm mt-1">{theme.emoji} {theme.greeting} · {format(now, 'hh:mm:ss a')}</p>
          </div>

          {/* ── Login Card ── */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-violet-100 border border-violet-100 p-8 animate-fade-slide-left"
            style={{ animationFillMode: 'forwards' }}>

            {success ? (
              /* ── Success state ── */
              <div className="text-center py-8">
                <div className="text-6xl mb-4 animate-success-bounce" style={{ display: 'inline-block' }}>🎉</div>
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 animate-pulse-ring">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Welcome back!</h3>
                <p className="text-slate-400 text-sm mt-1">Taking you to your dashboard... ✨</p>
              </div>

            ) : (
              <>
                {/* Greeting pill */}
                <div className="animate-fade-slide-up delay-100" style={{ animationFillMode: 'forwards' }}>
                  <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-full px-3 py-1.5 mb-5">
                    <span className="text-base">{theme.emoji}</span>
                    <span className="text-xs font-bold text-violet-600">{theme.greeting}!</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 leading-tight mb-1">
                    Welcome back to<br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-500">
                      your workspace
                    </span>
                  </h2>
                  <p className="text-slate-400 text-sm">Enter your password to continue.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4 mt-6">

                  {/* Error emoji reaction */}
                  {error && (
                    <div key={emojiKey} className="animate-error-pop flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                      <span className="text-3xl animate-bounce-emoji flex-shrink-0" style={{ display: 'inline-block' }}>
                        {error.emoji}
                      </span>
                      <p className="text-sm text-red-600 font-semibold pt-1">{error.msg}</p>
                    </div>
                  )}

                  {/* Password input */}
                  <div>
                    <label className="label">Password</label>
                    <div
                      key={shakeKey}
                      className={shakeKey > 0 ? 'animate-shake' : ''}
                      style={{ animationFillMode: 'forwards' }}>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          ref={inputRef}
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => { setPassword(e.target.value); setError(null) }}
                          placeholder="Enter your password"
                          className={`input-field pl-10 pr-10 transition-all ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100 bg-red-50/30' : ''}`}
                          autoFocus
                        />
                        <button type="button"
                          onClick={() => setShowPassword(s => !s)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 transition-colors">
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit button */}
                  <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-violet-200 hover:shadow-violet-300 hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:translate-y-0 active:scale-95">
                    {loading ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <><LogIn size={16} /> Sign In to Portal</>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                  <p className="text-[11px] text-slate-400">Personal access · Session lasts 30 days</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
