'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye, EyeOff, Lock, LogIn, CheckCircle2,
  Bug, Timer, Sparkles,
} from 'lucide-react'
import { format } from 'date-fns'

/* ─── Shift ──────────────────────────────────────────────── */
const SHIFT_START = 11 * 60 + 30
const SHIFT_END   = 20 * 60 + 30

function getShift(now: Date) {
  const cur = now.getHours() * 60 + now.getMinutes()
  if (cur < SHIFT_START) {
    const d = SHIFT_START - cur
    return { type: 'before' as const, h: Math.floor(d / 60), m: d % 60 }
  }
  if (cur < SHIFT_END) {
    const d = SHIFT_END - cur
    return { type: 'active' as const, h: Math.floor(d / 60), m: d % 60 }
  }
  return { type: 'done' as const, h: 0, m: 0 }
}

/* ─── Time themes ────────────────────────────────────────── */
function getTheme(h: number) {
  if (h >= 5  && h < 8)  return { bg: ['#f7971e','#ffd200','#ff6b6b','#a855f7'], emoji:'🌅', greet:'Good Morning',  desc:'Rise and shine!',            name:'sunrise',   accent:'#ffd200', glow:'rgba(255,210,0,0.4)'   }
  if (h >= 8  && h < 12) return { bg: ['#00b4db','#38ef7d','#11998e','#0083b0'], emoji:'☀️', greet:'Good Morning',  desc:'Bright productive day!',     name:'morning',   accent:'#38ef7d', glow:'rgba(56,239,125,0.4)'  }
  if (h >= 12 && h < 17) return { bg: ['#4776e6','#8e54e9','#f953c6','#b91d73'], emoji:'🌤️',greet:'Good Afternoon',desc:'Keep the momentum going!',   name:'afternoon', accent:'#f953c6', glow:'rgba(249,83,198,0.4)'  }
  if (h >= 17 && h < 20) return { bg: ['#f7971e','#dd5e89','#6e48aa','#4776e6'], emoji:'🌇', greet:'Good Evening',  desc:'Wrapping up beautifully!',   name:'evening',   accent:'#dd5e89', glow:'rgba(221,94,137,0.4)'  }
  return                         { bg: ['#0f0c29','#302b63','#24243e','#1a1a2e'], emoji:'🌙', greet:'Good Evening',  desc:"Still at it? Unstoppable!",  name:'night',     accent:'#a78bfa', glow:'rgba(167,139,250,0.5)'  }
}

const PARTICLES: Record<string,string[]> = {
  sunrise:   ['✦','✧','⋆','★','🌸','🌼'],
  morning:   ['☁️','✦','⋆','🌿','💚','🍃'],
  afternoon: ['✦','◆','⬟','✧','💜','⚡'],
  evening:   ['✦','★','⋆','🌺','🔥','💫'],
  night:     ['⭐','✨','💫','🌟','🌙','🪐'],
}

/* ─── Error reactions ────────────────────────────────────── */
const BLANK = [
  { emoji:'🤔', msg:"Don't forget to enter your password first!" },
  { emoji:'😶', msg:"The password field is still empty... go on!" },
]
const WRONG = [
  { emoji:'😯', msg:"Hmm, that password doesn't look right!" },
  { emoji:'😅', msg:"Nope! Double-check and try again." },
  { emoji:'🤦', msg:"Still wrong? Take a breath and try once more!" },
  { emoji:'🙈', msg:"Are you sure that's the right password?!" },
  { emoji:'😤', msg:"One more try — you've totally got this!" },
]

/* ─── Stars (night) ──────────────────────────────────────── */
function Stars() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 50 }).map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white animate-twinkle"
          style={{ width:`${1+(i%3)}px`, height:`${1+(i%3)}px`, top:`${(i*13+7)%85}%`, left:`${(i*19+3)%95}%`, animationDelay:`${(i*0.3)%3}s`, animationDuration:`${1.5+(i%3)*0.8}s` }} />
      ))}
    </div>
  )
}

/* ─── Particles ──────────────────────────────────────────── */
function Particles({ theme }: { theme: string }) {
  const syms = PARTICLES[theme] ?? ['✦']
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="absolute select-none"
          style={{ left:`${(i*17+5)%95}%`, bottom:'-5%', fontSize:`${10+(i%5)*4}px`, opacity:0,
            animation:`particleDrift ${8+(i%6)*2}s ${(i*0.7)%8}s ease-in linear infinite` }}>
          {syms[i % syms.length]}
        </div>
      ))}
    </div>
  )
}

/* ─── Aurora blobs ───────────────────────────────────────── */
function AuroraBlobs({ accent }: { accent: string }) {
  return (
    <>
      <div className="absolute top-[-120px] left-[-120px] w-[420px] h-[420px] rounded-full opacity-25 animate-aurora"
        style={{ background:`radial-gradient(circle,rgba(255,255,255,0.9),transparent)`, filter:'blur(2px)' }} />
      <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full opacity-20 animate-float-reverse"
        style={{ background:`radial-gradient(circle,rgba(255,255,255,0.7),transparent)` }} />
      <div className="absolute top-[35%] right-[-60px] w-72 h-72 rounded-full opacity-15 animate-float-slow"
        style={{ background:`radial-gradient(circle,${accent},transparent)` }} />
      <div className="absolute top-[15%] left-[52%] w-48 h-48 rounded-full opacity-20 animate-float"
        style={{ background:`radial-gradient(circle,rgba(255,255,255,0.6),transparent)`, animationDelay:'2s' }} />
      <div className="absolute bottom-[28%] left-[4%] w-32 h-32 rounded-full opacity-15 animate-aurora"
        style={{ background:`radial-gradient(circle,${accent},transparent)`, animationDelay:'4s' }} />
    </>
  )
}

/* ─── Warm Welcome ───────────────────────────────────────── */
const WELCOME_QUOTES = [
  { text: "Quality is never an accident — it's always the result of intelligent effort.", author: "John Ruskin" },
  { text: "Testing leads to failure, and failure leads to understanding.", author: "Burt Rutan" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  { text: "The bitterness of poor quality remains long after the sweetness of meeting the schedule.", author: "Karl Wiegers" },
]

function WarmWelcome({ accent, glow }: { accent: string; glow: string }) {
  const [qIdx, setQIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setQIdx(i => (i + 1) % WELCOME_QUOTES.length), 6000)
    return () => clearInterval(t)
  }, [])

  const q = WELCOME_QUOTES[qIdx]

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-2 text-center">

      {/* Wave emoji */}
      <div className="animate-float" style={{ display:'inline-block', filter:`drop-shadow(0 0 20px ${glow})` }}>
        <span className="text-6xl">👋</span>
      </div>

      {/* Welcome heading */}
      <div className="space-y-2 animate-fade-slide-up delay-100" style={{ animationFillMode:'forwards' }}>
        <h2 className="text-3xl font-black text-white leading-tight"
          style={{ textShadow:`0 0 32px ${glow}` }}>
          Welcome back,
        </h2>
        <p className="text-3xl font-black animate-shimmer-text bg-clip-text text-transparent leading-tight"
          style={{ backgroundImage:'linear-gradient(90deg,#fff,rgba(255,255,255,0.55),#fff)', backgroundSize:'200% auto' }}>
          Subhradeep!
        </p>
        <p className="text-white/55 text-sm pt-1">
          Your QA workspace is ready and waiting ✨
        </p>
      </div>

      {/* Pulsing dot divider */}
      <div className="flex items-center gap-3 animate-fade-slide-up delay-200" style={{ animationFillMode:'forwards' }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full animate-pulse"
            style={{ background:accent, animationDelay:`${i*0.35}s`, boxShadow:`0 0 8px ${glow}` }} />
        ))}
      </div>

      {/* Rotating quote card */}
      <div className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5
        animate-fade-slide-up delay-300" style={{ animationFillMode:'forwards' }}>
        <span className="text-2xl block mb-3">💬</span>
        <p className="text-white/80 text-[13px] italic leading-relaxed">
          &ldquo;{q.text}&rdquo;
        </p>
        <p className="text-white/40 text-[11px] mt-3 font-semibold tracking-wide">
          — {q.author}
        </p>
      </div>

    </div>
  )
}

/* ─── Orbiting logo ──────────────────────────────────────── */
function OrbitingLogo({ glow }: { glow: string }) {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border border-white/20 animate-rotate-sun" />
      {/* Orbiting dot 1 */}
      <div className="absolute inset-0 flex items-center justify-center animate-orbit">
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-300 shadow-lg" style={{ boxShadow:`0 0 8px ${glow}` }} />
      </div>
      {/* Orbiting dot 2 */}
      <div className="absolute inset-0 flex items-center justify-center animate-orbit-reverse">
        <div className="w-2 h-2 rounded-full bg-white/70" />
      </div>
      {/* Center icon */}
      <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30"
        style={{ boxShadow:`0 0 20px ${glow}` }}>
        <Bug size={20} className="text-white" />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState<{emoji:string;msg:string}|null>(null)
  const [loading, setLoading]           = useState(false)
  const [success, setSuccess]           = useState(false)
  const [now, setNow]                   = useState(new Date())
  const [shakeKey, setShakeKey]         = useState(0)
  const [emojiKey, setEmojiKey]         = useState(0)
  const [blankCount, setBlankCount]     = useState(0)
  const [wrongCount, setWrongCount]     = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const theme = getTheme(now.getHours())
  const shift = getShift(now)
  const gradient = `linear-gradient(135deg,${theme.bg.join(',')})`

  function triggerError(r: {emoji:string;msg:string}) {
    setError(r); setShakeKey(k => k+1); setEmojiKey(k => k+1)
    inputRef.current?.focus()
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) {
      triggerError(BLANK[blankCount % BLANK.length]); setBlankCount(c=>c+1); return
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
      triggerError(WRONG[Math.min(wrongCount, WRONG.length-1)]); setWrongCount(c=>c+1)
    }
  }

  return (
    <div className="min-h-screen flex overflow-hidden">

      {/* ══════════════ LEFT PANEL ══════════════ */}
      <div className="hidden lg:flex flex-col w-[60%] relative overflow-hidden"
        style={{ background: gradient }}>

        {/* Animated gradient overlay */}
        <div className="absolute inset-0 opacity-30 animate-gradient-shift"
          style={{ background: gradient, backgroundSize:'300% 300%' }} />

        {/* Scan line effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
          <div className="absolute left-0 right-0 h-20 animate-scan"
            style={{ background:'linear-gradient(transparent,rgba(255,255,255,0.15),transparent)' }} />
        </div>

        {/* Night stars */}
        {theme.name === 'night' && <Stars />}

        {/* Particles */}
        <Particles theme={theme.name} />

        {/* Aurora blobs */}
        <AuroraBlobs accent={theme.accent} />

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.9) 1px,transparent 1px)', backgroundSize:'26px 26px' }} />

        <div className="relative z-10 flex flex-col h-full px-10 py-8 gap-4 overflow-y-auto">

          {/* ── Logo row ── */}
          <div className="flex items-center gap-4 animate-fade-slide-right" style={{ animationFillMode:'forwards' }}>
            <OrbitingLogo glow={theme.glow} />
            <div>
              <h1 className="text-xl font-black text-white tracking-tight leading-tight whitespace-nowrap"
                style={{ textShadow:`0 0 20px ${theme.glow}` }}>
                Subhradeep Task Management
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Sparkles size={10} className="text-yellow-300" />
                <p className="text-[10px] text-white/60 font-semibold tracking-widest uppercase">Personal QA Workspace</p>
              </div>
            </div>
          </div>

          {/* ── Greeting + Clock combined (same size as shift div) ── */}
          <div className="animate-fade-slide-up delay-100" style={{ animationFillMode:'forwards' }}>
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20"
              style={{ boxShadow:`0 4px 24px ${theme.glow}` }}>
              {/* Emoji */}
              <span className="text-2xl animate-float flex-shrink-0" style={{ display:'inline-block' }}>{theme.emoji}</span>
              {/* Greeting text */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-base leading-tight">{theme.greet}!</p>
                <p className="text-white/55 text-[11px]">{theme.desc}</p>
              </div>
              {/* Time pill */}
              <div className="flex-shrink-0 text-right">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white tabular-nums leading-none"
                    style={{ textShadow:`0 0 12px ${theme.glow}` }}>
                    {format(now,'hh:mm')}
                  </span>
                  <span className="text-base font-black text-yellow-300">{format(now,'a')}</span>
                </div>
                <p className="text-[9px] text-white/40 text-right">{format(now,'EEE, MMM do')}</p>
              </div>
            </div>
          </div>

          {/* ── Shift countdown (same size div) ── */}
          <div className="animate-fade-slide-up delay-200" style={{ animationFillMode:'forwards' }}>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-sm ${
              shift.type==='active' ? 'bg-emerald-400/10 border-emerald-300/30' :
              shift.type==='done'   ? 'bg-white/8 border-white/15' :
                                      'bg-amber-400/10 border-amber-300/30'
            }`}>
              <Timer size={16} className={`flex-shrink-0 ${
                shift.type==='active' ? 'text-emerald-300' :
                shift.type==='done'   ? 'text-white/40' : 'text-amber-300'
              }`} />
              <p className="text-sm font-semibold text-white/90 leading-snug flex-1">
                {shift.type==='active' && <>Hey Subhradeep, only{' '}<span className="text-yellow-300 font-black">{shift.h}h {shift.m}m</span>{' '}left then you can logout for the day! 🎉</>}
                {shift.type==='before' && <>Shift starts in{' '}<span className="text-amber-300 font-black">{shift.h}h {shift.m}m</span>. Grab a coffee ☕</>}
                {shift.type==='done'   && <>Shift's over! Time to relax and recharge. 🌙</>}
              </p>
            </div>
          </div>

          {/* ── Warm Welcome ── */}
          <div className="animate-fade-slide-up delay-300 flex-1 min-h-0 flex flex-col" style={{ animationFillMode:'forwards' }}>
            <WarmWelcome accent={theme.accent} glow={theme.glow} />
          </div>
        </div>
      </div>

      {/* ══════════════ RIGHT PANEL ══════════════ */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden"
        style={{ background:'linear-gradient(135deg,#f0f0ff 0%,#ffffff 40%,#f5f0ff 100%)' }}>

        {/* BG blobs on right */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-30 animate-float-slow"
          style={{ background:'radial-gradient(circle,#c4b5fd,transparent)', transform:'translate(40%,-40%)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-20 animate-float"
          style={{ background:'radial-gradient(circle,#a5f3fc,transparent)', transform:'translate(-30%,30%)', animationDelay:'3s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full opacity-10 animate-aurora"
          style={{ background:'radial-gradient(circle,#f9a8d4,transparent)', transform:'translate(-50%,-50%)' }} />

        <div className="w-full max-w-sm relative z-10">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6 animate-fade-slide-up" style={{ animationFillMode:'forwards' }}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-violet-200 animate-pulse-ring">
              <Bug size={24} className="text-white" />
            </div>
            <h1 className="text-lg font-black text-slate-800">Subhradeep Task Management</h1>
            <p className="text-slate-400 text-sm mt-1">{theme.emoji} {format(now,'hh:mm a')}</p>
          </div>

          {/* ── Card ── */}
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-violet-100 p-8 animate-fade-slide-left"
            style={{ animationFillMode:'forwards', boxShadow:'0 8px 60px rgba(139,92,246,0.15), 0 2px 8px rgba(139,92,246,0.08)' }}>

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
                {/* Greeting + shimmer badge */}
                <div className="animate-fade-slide-up delay-100" style={{ animationFillMode:'forwards' }}>
                  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-5 border border-violet-200"
                    style={{ background:'linear-gradient(90deg,#f5f3ff,#fdf4ff,#f5f3ff)', backgroundSize:'200% auto' }}>
                    <span className="text-base">{theme.emoji}</span>
                    <span className="text-xs font-black text-violet-600 tracking-wide">{theme.greet}!</span>
                  </div>

                  <h2 className="text-[26px] font-black text-slate-800 leading-tight mb-2">
                    Welcome back to<br />
                    <span className="animate-shimmer-text bg-clip-text text-transparent"
                      style={{ backgroundImage:'linear-gradient(90deg,#7c3aed,#db2777,#7c3aed)', backgroundSize:'200% auto' }}>
                      your workspace
                    </span>
                  </h2>
                  <p className="text-slate-400 text-sm">Enter your password to continue.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4 mt-6">
                  {/* Error */}
                  {error && (
                    <div key={emojiKey} className="animate-error-pop flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                      <span className="text-3xl animate-bounce-emoji flex-shrink-0" style={{ display:'inline-block' }}>
                        {error.emoji}
                      </span>
                      <p className="text-sm text-red-600 font-bold pt-1">{error.msg}</p>
                    </div>
                  )}

                  {/* Password field */}
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
                        <button type="button" onClick={() => setShowPassword(s=>!s)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 transition-colors">
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl text-white font-black text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 hover:-translate-y-0.5"
                    style={{ background:'linear-gradient(135deg,#7c3aed,#4f46e5,#7c3aed)', backgroundSize:'200% auto', boxShadow:'0 4px 20px rgba(124,58,237,0.4)' }}>
                    {loading
                      ? <><div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Signing in...</>
                      : <><LogIn size={16} />Sign In to Portal</>
                    }
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
