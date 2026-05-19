'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye, EyeOff, Lock, LogIn, CheckCircle2, Clock,
  FolderKanban, ClipboardList, FileBarChart2,
  Bug, Calendar, Zap, ChevronLeft, ChevronRight,
  ExternalLink, BookOpen, ChevronDown, ChevronUp,
  Newspaper, Timer,
} from 'lucide-react'
import { format } from 'date-fns'
import type { NewsArticle } from '@/app/api/news/route'

/* ─── Shift config ───────────────────────────────────────── */
const SHIFT_START = { h: 11, m: 30 } // 11:30 AM
const SHIFT_END   = { h: 20, m: 30 } // 8:30 PM

function getShiftStatus(now: Date) {
  const cur  = now.getHours() * 60 + now.getMinutes()
  const start = SHIFT_START.h * 60 + SHIFT_START.m
  const end   = SHIFT_END.h   * 60 + SHIFT_END.m

  if (cur < start) {
    const diff = start - cur
    return { type: 'before' as const, h: Math.floor(diff / 60), m: diff % 60 }
  }
  if (cur >= start && cur < end) {
    const diff = end - cur
    return { type: 'active' as const, h: Math.floor(diff / 60), m: diff % 60 }
  }
  return { type: 'done' as const, h: 0, m: 0 }
}

/* ─── Time themes ────────────────────────────────────────── */
function getTheme(hour: number) {
  if (hour >= 5  && hour < 8)  return { gradient: 'linear-gradient(135deg,#f7971e 0%,#ffd200 40%,#ff6b6b 70%,#a855f7 100%)', emoji:'🌅', greeting:'Good Morning',  desc:'Rise and shine!',            icon:'🌄', accent:'#ffd200', name:'sunrise'   }
  if (hour >= 8  && hour < 12) return { gradient: 'linear-gradient(135deg,#00b4db 0%,#38ef7d 40%,#11998e 70%,#0083b0 100%)', emoji:'☀️', greeting:'Good Morning',  desc:'A bright productive day!',   icon:'☀️', accent:'#38ef7d', name:'morning'   }
  if (hour >= 12 && hour < 17) return { gradient: 'linear-gradient(135deg,#4776e6 0%,#8e54e9 40%,#f953c6 70%,#b91d73 100%)', emoji:'🌤️',greeting:'Good Afternoon',desc:'Keep the momentum going!',   icon:'🌞', accent:'#f953c6', name:'afternoon' }
  if (hour >= 17 && hour < 20) return { gradient: 'linear-gradient(135deg,#f7971e 0%,#dd5e89 40%,#6e48aa 70%,#4776e6 100%)', emoji:'🌇', greeting:'Good Evening',  desc:'Wrapping up beautifully!',   icon:'🌆', accent:'#dd5e89', name:'evening'   }
  return                               { gradient: 'linear-gradient(135deg,#0f0c29 0%,#302b63 40%,#24243e 70%,#1a1a2e 100%)', emoji:'🌙', greeting:'Good Evening',  desc:'Still at it? Unstoppable!',  icon:'🌙', accent:'#a78bfa', name:'night'     }
}

/* ─── Error reactions ────────────────────────────────────── */
const BLANK_ERR = [
  { emoji:'🤔', msg:"Don't forget to enter your password first!" },
  { emoji:'😶', msg:"The password field is empty... try again!" },
]
const WRONG_ERR = [
  { emoji:'😯', msg:"Hmm, that password doesn't look right!" },
  { emoji:'😅', msg:"Nope! Double-check and try again." },
  { emoji:'🤦', msg:"Still wrong? Take a breath and try once more!" },
  { emoji:'🙈', msg:"Are you sure that's the right password?!" },
  { emoji:'😤', msg:"One more try — you've got this!" },
]

/* ─── Particles ──────────────────────────────────────────── */
const PARTICLES_BY_THEME: Record<string,string[]> = {
  sunrise:   ['✦','✧','⋆','★','🌸'],
  morning:   ['☁️','✦','⋆','🌿','💚'],
  afternoon: ['✦','◆','⬟','✧','💜'],
  evening:   ['✦','★','⋆','🌺','🔥'],
  night:     ['⭐','✨','💫','🌟','🌙'],
}

function Particles({ theme }: { theme: string }) {
  const syms = PARTICLES_BY_THEME[theme] ?? ['✦']
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} className="absolute select-none"
          style={{
            left: `${(i * 17 + 5) % 95}%`,
            bottom: '-5%',
            fontSize: `${10 + (i % 5) * 4}px`,
            opacity: 0,
            animation: `particleDrift ${8 + (i % 6) * 2}s ${(i * 0.7) % 8}s ease-in linear infinite`,
          }}>
          {syms[i % syms.length]}
        </div>
      ))}
    </div>
  )
}

function Stars() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white animate-twinkle"
          style={{
            width:`${1+(i%3)}px`, height:`${1+(i%3)}px`,
            top:`${(i*13+7)%85}%`, left:`${(i*19+3)%95}%`,
            animationDelay:`${(i*0.3)%3}s`, animationDuration:`${1.5+(i%3)*0.8}s`,
          }} />
      ))}
    </div>
  )
}

/* ─── News carousel ──────────────────────────────────────── */
function NewsCarousel() {
  const [articles, setArticles]   = useState<NewsArticle[]>([])
  const [index, setIndex]         = useState(0)
  const [open, setOpen]           = useState(true)
  const [fetching, setFetching]   = useState(true)

  useEffect(() => {
    fetch('/api/news').then(r => r.json()).then(d => {
      if (d.articles) setArticles(d.articles)
      setFetching(false)
    }).catch(() => setFetching(false))
  }, [])

  const prev = () => setIndex(i => (i - 1 + articles.length) % articles.length)
  const next = () => setIndex(i => (i + 1) % articles.length)
  const art  = articles[index]

  const TAG_COLORS = ['bg-violet-100 text-violet-700','bg-teal-100 text-teal-700','bg-pink-100 text-pink-700','bg-orange-100 text-orange-700']

  return (
    <div className="mt-4">
      {/* Toggle header */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all">
        <div className="flex items-center gap-2">
          <Newspaper size={15} className="text-white" />
          <span className="text-sm font-bold text-white">Latest QA & Automation News</span>
          {!fetching && articles.length > 0 && (
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">{articles.length} articles</span>
          )}
        </div>
        {open ? <ChevronUp size={15} className="text-white/70" /> : <ChevronDown size={15} className="text-white/70" />}
      </button>

      {open && (
        <div className="mt-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
          {fetching ? (
            <div className="flex items-center gap-3 py-4">
              <div className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin flex-shrink-0" />
              <p className="text-white/70 text-sm">Fetching latest articles...</p>
            </div>
          ) : articles.length === 0 ? (
            <p className="text-white/60 text-sm text-center py-4">No articles found. Check your connection.</p>
          ) : (
            <>
              {/* Article card */}
              <div className="mb-3">
                <div className="flex flex-wrap gap-1 mb-2">
                  {art.tag_list.slice(0,3).map((tag,i) => (
                    <span key={tag} className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${TAG_COLORS[i % TAG_COLORS.length]}`}>
                      #{tag}
                    </span>
                  ))}
                </div>
                <p className="text-white font-bold text-sm leading-snug line-clamp-2 mb-1">{art.title}</p>
                <p className="text-white/60 text-[11px] line-clamp-2 mb-2">{art.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] text-white/50">
                    <BookOpen size={10} />
                    <span>{art.reading_time_minutes} min read</span>
                    <span>·</span>
                    <span>{art.readable_publish_date}</span>
                    <span>·</span>
                    <span>{art.user.name}</span>
                  </div>
                  <a href={art.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-bold text-yellow-300 hover:text-yellow-200 transition-colors">
                    Read <ExternalLink size={9} />
                  </a>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <button onClick={prev}
                  className="flex items-center gap-1 text-[11px] text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg">
                  <ChevronLeft size={12} /> Prev
                </button>
                <span className="text-[10px] text-white/40">{index + 1} / {articles.length}</span>
                <button onClick={next}
                  className="flex items-center gap-1 text-[11px] text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg">
                  Next <ChevronRight size={12} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Main ───────────────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]             = useState<{emoji:string;msg:string}|null>(null)
  const [loading, setLoading]         = useState(false)
  const [success, setSuccess]         = useState(false)
  const [now, setNow]                 = useState(new Date())
  const [shakeKey, setShakeKey]       = useState(0)
  const [emojiKey, setEmojiKey]       = useState(0)
  const [blankCount, setBlankCount]   = useState(0)
  const [wrongCount, setWrongCount]   = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const theme  = getTheme(now.getHours())
  const shift  = getShiftStatus(now)

  function triggerError(r: {emoji:string;msg:string}) {
    setError(r)
    setShakeKey(k => k + 1)
    setEmojiKey(k => k + 1)
    inputRef.current?.focus()
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) {
      triggerError(BLANK_ERR[blankCount % BLANK_ERR.length])
      setBlankCount(c => c + 1)
      return
    }
    setLoading(true); setError(null)
    const res = await fetch('/api/auth/login', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setSuccess(true)
      setTimeout(() => { router.push('/'); router.refresh() }, 900)
    } else {
      setLoading(false); setPassword('')
      triggerError(WRONG_ERR[Math.min(wrongCount, WRONG_ERR.length - 1)])
      setWrongCount(c => c + 1)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ══════ LEFT PANEL ══════ */}
      <div className="hidden lg:flex flex-col w-[60%] relative overflow-hidden"
        style={{ background: theme.gradient }}>

        <div className="absolute inset-0 animate-gradient-shift opacity-25"
          style={{ background: theme.gradient, backgroundSize:'300% 300%' }} />
        {theme.name === 'night' && <Stars />}
        <Particles theme={theme.name} />

        {/* Blobs */}
        <div className="absolute top-[-100px] left-[-100px] w-96 h-96 rounded-full opacity-20 animate-float"
          style={{ background:'radial-gradient(circle,rgba(255,255,255,0.8),transparent)' }} />
        <div className="absolute bottom-[-80px] right-[-80px] w-[30rem] h-[30rem] rounded-full opacity-15 animate-float-reverse"
          style={{ background:'radial-gradient(circle,rgba(255,255,255,0.6),transparent)' }} />
        <div className="absolute top-[30%] right-[-50px] w-56 h-56 rounded-full opacity-10 animate-float-slow"
          style={{ background:`radial-gradient(circle,${theme.accent},transparent)` }} />

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.8) 1px,transparent 1px)', backgroundSize:'28px 28px' }} />

        <div className="relative z-10 flex flex-col h-full px-10 py-8 overflow-y-auto">

          {/* Logo */}
          <div className="animate-fade-slide-right" style={{ animationFillMode:'forwards' }}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 animate-pulse-ring flex-shrink-0">
                <Bug size={20} className="text-white" />
              </div>
              <h1 className="text-lg font-black text-white tracking-tight whitespace-nowrap drop-shadow-sm">
                Subhradeep Task Management
              </h1>
            </div>
          </div>

          {/* Clock — HH:MM AM/PM only */}
          <div className="mt-6 animate-fade-slide-up delay-100" style={{ animationFillMode:'forwards' }}>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 inline-block shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl animate-float" style={{ display:'inline-block' }}>{theme.emoji}</span>
                <div>
                  <p className="text-white font-black text-lg leading-tight">{theme.greeting}!</p>
                  <p className="text-white/60 text-xs">{theme.desc}</p>
                </div>
              </div>
              {/* Clock display */}
              <div className="flex items-end gap-1">
                <div className="text-center">
                  <div className="text-5xl font-black text-white tabular-nums leading-none drop-shadow-lg">
                    {format(now, 'hh')}
                  </div>
                  <div className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">HRS</div>
                </div>
                <div className="text-4xl font-black text-white/50 mb-1 leading-none animate-pulse">:</div>
                <div className="text-center">
                  <div className="text-5xl font-black text-white tabular-nums leading-none drop-shadow-lg">
                    {format(now, 'mm')}
                  </div>
                  <div className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">MIN</div>
                </div>
                <div className="mb-1.5 ml-2">
                  <span className="text-xl font-black text-yellow-300 drop-shadow">{format(now,'a')}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 pt-2.5 mt-1 border-t border-white/10">
                <Clock size={11} className="text-white/40" />
                <span className="text-xs text-white/55 font-medium">{format(now,'EEEE, MMMM do yyyy')}</span>
              </div>
            </div>
          </div>

          {/* Shift countdown */}
          <div className="mt-3 animate-fade-slide-up delay-200" style={{ animationFillMode:'forwards' }}>
            <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl border backdrop-blur-sm ${
              shift.type === 'active' ? 'bg-emerald-400/10 border-emerald-300/30' :
              shift.type === 'done'   ? 'bg-white/10 border-white/20' :
                                        'bg-amber-400/10 border-amber-300/30'
            }`}>
              <Timer size={16} className={
                shift.type === 'active' ? 'text-emerald-300 flex-shrink-0 mt-0.5' :
                shift.type === 'done'   ? 'text-white/50 flex-shrink-0 mt-0.5' :
                                          'text-amber-300 flex-shrink-0 mt-0.5'
              } />
              <p className="text-sm font-semibold text-white/90 leading-snug">
                {shift.type === 'active' && <>Hey Subhradeep, only <span className="text-yellow-300 font-black">{shift.h}h {shift.m}m</span> left then you can logout for the day! 🎉</>}
                {shift.type === 'before' && <>Your shift starts in <span className="text-amber-300 font-black">{shift.h}h {shift.m}m</span>. Grab a coffee ☕</>}
                {shift.type === 'done'   && <>Shift's over! Time to relax and recharge. 🌙</>}
              </p>
            </div>
          </div>

          {/* News carousel */}
          <div className="mt-3 animate-fade-slide-up delay-300" style={{ animationFillMode:'forwards', flex: 1 }}>
            <NewsCarousel />
          </div>
        </div>
      </div>

      {/* ══════ RIGHT PANEL ══════ */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-violet-50 via-white to-indigo-50 relative overflow-hidden">

        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20 animate-float-slow"
          style={{ background:'radial-gradient(circle,#c4b5fd,transparent)', transform:'translate(40%,-40%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-15 animate-float"
          style={{ background:'radial-gradient(circle,#a5f3fc,transparent)', transform:'translate(-30%,30%)', animationDelay:'3s' }} />

        <div className="w-full max-w-sm relative z-10">

          {/* Mobile header */}
          <div className="lg:hidden text-center mb-6 animate-fade-slide-up" style={{ animationFillMode:'forwards' }}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-violet-200 animate-pulse-ring">
              <Bug size={24} className="text-white" />
            </div>
            <h1 className="text-lg font-black text-slate-800">Subhradeep Task Management</h1>
            <p className="text-slate-400 text-sm mt-1">{theme.emoji} {format(now,'hh:mm a')}</p>
          </div>

          {/* Login card */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-violet-100 border border-violet-100 p-8 animate-fade-slide-left"
            style={{ animationFillMode:'forwards' }}>

            {success ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4 animate-success-bounce" style={{ display:'inline-block' }}>🎉</div>
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 animate-pulse-ring">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Welcome back!</h3>
                <p className="text-slate-400 text-sm mt-1">Taking you to your dashboard... ✨</p>
              </div>
            ) : (
              <>
                <div className="animate-fade-slide-up delay-100" style={{ animationFillMode:'forwards' }}>
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
                  {/* Error reaction */}
                  {error && (
                    <div key={emojiKey} className="animate-error-pop flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                      <span className="text-3xl animate-bounce-emoji flex-shrink-0" style={{ display:'inline-block' }}>
                        {error.emoji}
                      </span>
                      <p className="text-sm text-red-600 font-semibold pt-1">{error.msg}</p>
                    </div>
                  )}

                  {/* Input */}
                  <div>
                    <label className="label">Password</label>
                    <div key={shakeKey} className={shakeKey > 0 ? 'animate-shake' : ''}>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          ref={inputRef}
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => { setPassword(e.target.value); setError(null) }}
                          placeholder="Enter your password"
                          className={`input-field pl-10 pr-10 ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100 bg-red-50/30' : ''}`}
                          autoFocus
                        />
                        <button type="button" onClick={() => setShowPassword(s => !s)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 transition-colors">
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-sm transition-all duration-200 shadow-lg shadow-violet-200 hover:shadow-violet-300 hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:translate-y-0 active:scale-95">
                    {loading ? (
                      <><div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Signing in...</>
                    ) : (
                      <><LogIn size={16} />Sign In to Portal</>
                    )}
                  </button>
                </form>

                <p className="text-center text-[11px] text-slate-300 mt-6">
                  Personal access · Session lasts 30 days
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
