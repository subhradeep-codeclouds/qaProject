'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Eye, EyeOff, Lock, Mail, LogIn, CheckCircle2,
  Bug, Sparkles, KeyRound, ArrowLeft, ShieldCheck,
} from 'lucide-react'
import { format } from 'date-fns'

/* ─── Time themes ────────────────────────────────────────── */
function getTheme(h: number) {
  if (h >= 5  && h < 8)  return { bg: ['#f7971e','#ffd200','#ff6b6b','#a855f7'], emoji:'🌅', greet:'Good Morning',  desc:'Rise and shine!',           name:'sunrise',   accent:'#ffd200', glow:'rgba(255,210,0,0.4)'   }
  if (h >= 8  && h < 12) return { bg: ['#00b4db','#38ef7d','#11998e','#0083b0'], emoji:'☀️', greet:'Good Morning',  desc:'Bright productive day!',    name:'morning',   accent:'#38ef7d', glow:'rgba(56,239,125,0.4)'  }
  if (h >= 12 && h < 17) return { bg: ['#4776e6','#8e54e9','#f953c6','#b91d73'], emoji:'🌤️',greet:'Good Afternoon',desc:'Keep the momentum going!',  name:'afternoon', accent:'#f953c6', glow:'rgba(249,83,198,0.4)'  }
  if (h >= 17 && h < 20) return { bg: ['#f7971e','#dd5e89','#6e48aa','#4776e6'], emoji:'🌇', greet:'Good Evening',  desc:'Wrapping up beautifully!',  name:'evening',   accent:'#dd5e89', glow:'rgba(221,94,137,0.4)'  }
  return                         { bg: ['#0f0c29','#302b63','#24243e','#1a1a2e'], emoji:'🌙', greet:'Good Evening',  desc:"Still at it? Unstoppable!", name:'night',     accent:'#a78bfa', glow:'rgba(167,139,250,0.5)'  }
}

const PARTICLES: Record<string,string[]> = {
  sunrise:   ['✦','✧','⋆','★','🌸','🌼'],
  morning:   ['☁️','✦','⋆','🌿','💚','🍃'],
  afternoon: ['✦','◆','⬟','✧','💜','⚡'],
  evening:   ['✦','★','⋆','🌺','🔥','💫'],
  night:     ['⭐','✨','💫','🌟','🌙','🪐'],
}

const QUOTES = [
  { text: "Quality is never an accident — it's always the result of intelligent effort.", author: "John Ruskin" },
  { text: "Testing leads to failure, and failure leads to understanding.", author: "Burt Rutan" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  { text: "The bitterness of poor quality remains long after the sweetness of meeting the schedule.", author: "Karl Wiegers" },
]

function Stars() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 50 }).map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white animate-twinkle"
          style={{ width:`${1+(i%3)}px`, height:`${1+(i%3)}px`, top:`${(i*13+7)%85}%`, left:`${(i*19+3)%95}%`,
            animationDelay:`${(i*0.3)%3}s`, animationDuration:`${1.5+(i%3)*0.8}s` }} />
      ))}
    </div>
  )
}

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

function LeftPanel({ theme, now, gradient }: { theme: ReturnType<typeof getTheme>; now: Date; gradient: string }) {
  const [qIdx, setQIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setQIdx(i => (i + 1) % QUOTES.length), 6000)
    return () => clearInterval(t)
  }, [])
  const q = QUOTES[qIdx]

  return (
    <div className="hidden lg:flex flex-col w-[60%] relative overflow-hidden" style={{ background: gradient }}>
      <div className="absolute inset-0 opacity-30 animate-gradient-shift" style={{ background: gradient, backgroundSize:'300% 300%' }} />
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute left-0 right-0 h-20 animate-scan"
          style={{ background:'linear-gradient(transparent,rgba(255,255,255,0.15),transparent)' }} />
      </div>
      {theme.name === 'night' && <Stars />}
      <Particles theme={theme.name} />
      <AuroraBlobs accent={theme.accent} />
      <div className="absolute inset-0 opacity-[0.08]"
        style={{ backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.9) 1px,transparent 1px)', backgroundSize:'26px 26px' }} />

      <div className="relative z-10 flex flex-col h-full px-10 py-8 gap-6 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-4 animate-fade-slide-right" style={{ animationFillMode:'forwards' }}>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30"
            style={{ boxShadow:`0 0 20px ${theme.glow}` }}>
            <Bug size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight leading-tight" style={{ textShadow:`0 0 20px ${theme.glow}` }}>
              QADesk
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Sparkles size={10} className="text-yellow-300" />
              <p className="text-[10px] text-white/60 font-semibold tracking-widest uppercase">Quality Assurance Workspace</p>
            </div>
          </div>
        </div>

        {/* Clock */}
        <div className="animate-fade-slide-up delay-100" style={{ animationFillMode:'forwards' }}>
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20"
            style={{ boxShadow:`0 4px 24px ${theme.glow}` }}>
            <span className="text-2xl animate-float flex-shrink-0">{theme.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-base leading-tight">{theme.greet}!</p>
              <p className="text-white/55 text-[11px]">{theme.desc}</p>
            </div>
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

        {/* Welcome */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-2 text-center animate-fade-slide-up delay-200" style={{ animationFillMode:'forwards' }}>
          <div className="animate-float" style={{ filter:`drop-shadow(0 0 20px ${theme.glow})` }}>
            <span className="text-6xl">👋</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white leading-tight" style={{ textShadow:`0 0 32px ${theme.glow}` }}>
              Welcome back,
            </h2>
            <p className="text-3xl font-black animate-shimmer-text bg-clip-text text-transparent leading-tight"
              style={{ backgroundImage:'linear-gradient(90deg,#fff,rgba(255,255,255,0.55),#fff)', backgroundSize:'200% auto' }}>
              QA Team!
            </p>
            <p className="text-white/55 text-sm pt-1">Your workspace is ready and waiting ✨</p>
          </div>
          <div className="flex items-center gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full animate-pulse"
                style={{ background:theme.accent, animationDelay:`${i*0.35}s`, boxShadow:`0 0 8px ${theme.glow}` }} />
            ))}
          </div>
          <div className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5">
            <span className="text-2xl block mb-3">💬</span>
            <p className="text-white/80 text-[13px] italic leading-relaxed">&ldquo;{q.text}&rdquo;</p>
            <p className="text-white/40 text-[11px] mt-3 font-semibold tracking-wide">— {q.author}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const router = useRouter()
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [success,      setSuccess]      = useState(false)
  const [now,          setNow]          = useState(new Date())
  const [shakeKey,     setShakeKey]     = useState(0)
  const emailRef = useRef<HTMLInputElement>(null)

  // Forgot password flow
  const [fpView,        setFpView]        = useState<'login' | 'forgot-email' | 'forgot-otp' | 'forgot-reset' | 'forgot-done'>('login')
  const [fpEmail,       setFpEmail]       = useState('')
  const [fpUserId,      setFpUserId]      = useState('')
  const [fpOtp,         setFpOtp]         = useState('')
  const [fpNewPwd,      setFpNewPwd]      = useState('')
  const [fpConfirmPwd,  setFpConfirmPwd]  = useState('')
  const [fpShowPwd,     setFpShowPwd]     = useState(false)
  const [fpLoading,     setFpLoading]     = useState(false)
  const [fpError,       setFpError]       = useState<string | null>(null)

  async function handleSendForgotOtp() {
    if (!fpEmail.trim()) { setFpError('Please enter your email.'); return }
    setFpLoading(true); setFpError(null)
    const res  = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fpEmail }) })
    const data = await res.json()
    setFpLoading(false)
    if (res.ok) { setFpUserId(data.userId); setFpView('forgot-otp') }
    else setFpError(data.error ?? 'Failed to send OTP')
  }

  async function handleVerifyForgotOtp() {
    if (!fpOtp.trim()) { setFpError('Please enter the OTP.'); return }
    setFpLoading(true); setFpError(null)
    const res  = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: fpUserId, otp: fpOtp, newPassword: 'VERIFY_ONLY' }) })
    const data = await res.json()
    setFpLoading(false)
    // We only want to verify the OTP here, not reset yet — use a lightweight check
    // Actually just move to reset view; final reset call will re-verify OTP
    if (res.ok || data.error === 'Password must be at least 6 characters') {
      setFpView('forgot-reset')
    } else {
      setFpError(data.error ?? 'Invalid OTP')
    }
  }

  async function handleResetPassword() {
    if (!fpNewPwd || fpNewPwd.length < 6) { setFpError('Password must be at least 6 characters.'); return }
    if (fpNewPwd !== fpConfirmPwd) { setFpError('Passwords do not match.'); return }
    setFpLoading(true); setFpError(null)
    const res  = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: fpUserId, otp: fpOtp, newPassword: fpNewPwd }) })
    const data = await res.json()
    setFpLoading(false)
    if (res.ok) setFpView('forgot-done')
    else setFpError(data.error ?? 'Failed to reset password')
  }

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const theme    = getTheme(now.getHours())
  const gradient = `linear-gradient(135deg,${theme.bg.join(',')})`

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      setShakeKey(k => k + 1)
      return
    }
    setLoading(true)
    setError(null)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (res.ok) {
      setSuccess(true)
      setTimeout(() => { router.push('/'); router.refresh() }, 900)
    } else if (data.needsVerification) {
      router.push(`/verify-email?userId=${data.userId}&email=${encodeURIComponent(data.email)}`)
    } else {
      setLoading(false)
      setError(data.error ?? 'Login failed')
      setShakeKey(k => k + 1)
    }
  }

  return (
    <div className="min-h-screen flex overflow-hidden">
      <LeftPanel theme={theme} now={now} gradient={gradient} />

      {/* ══════════════ RIGHT PANEL ══════════════ */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden"
        style={{ background:'linear-gradient(135deg,#fff7ed 0%,#ffffff 45%,#eff6ff 100%)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-25 animate-float-slow"
          style={{ background:'radial-gradient(circle,#fdba74,transparent)', transform:'translate(40%,-40%)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-20 animate-float"
          style={{ background:'radial-gradient(circle,#93c5fd,transparent)', transform:'translate(-30%,30%)', animationDelay:'3s' }} />

        <div className="w-full max-w-sm relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-violet-200">
              <Bug size={24} className="text-white" />
            </div>
            <h1 className="text-lg font-black text-slate-800">QADesk</h1>
            <p className="text-slate-400 text-sm mt-1">{theme.emoji} {format(now,'hh:mm a')}</p>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-violet-100 p-8 animate-fade-slide-left"
            style={{ animationFillMode:'forwards', boxShadow:'0 8px 60px rgba(249,115,22,0.12), 0 2px 8px rgba(59,130,246,0.08)' }}>

            {success ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4 animate-success-bounce" style={{ display:'inline-block' }}>🎉</div>
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Welcome back!</h3>
                <p className="text-slate-400 text-sm mt-1">Taking you to your dashboard... ✨</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-4 border border-violet-200"
                    style={{ background:'linear-gradient(90deg,#fff7ed,#fffbf5,#fff7ed)' }}>
                    <span className="text-base">{theme.emoji}</span>
                    <span className="text-xs font-black text-violet-600 tracking-wide">Sign In</span>
                  </div>
                  <h2 className="text-[26px] font-black text-slate-800 leading-tight mb-1">
                    Welcome back to<br />
                    <span className="animate-shimmer-text bg-clip-text text-transparent"
                      style={{ backgroundImage:'linear-gradient(90deg,#f97316,#3b82f6,#f97316)', backgroundSize:'200% auto' }}>
                      your workspace
                    </span>
                  </h2>
                  <p className="text-slate-400 text-sm">Enter your credentials to continue.</p>
                </div>

                {/* ── Forgot password views ── */}
                {fpView === 'forgot-email' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <button onClick={() => { setFpView('login'); setFpError(null) }} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                        <ArrowLeft size={16} className="text-slate-400" />
                      </button>
                      <p className="text-sm font-bold text-slate-700">Forgot Password</p>
                    </div>
                    <p className="text-sm text-slate-400">Enter your account email. We&apos;ll send an OTP to reset your password.</p>
                    {fpError && <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5"><p className="text-sm text-red-600 font-bold">{fpError}</p></div>}
                    <div>
                      <label className="label">Email</label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="email" value={fpEmail} onChange={e => { setFpEmail(e.target.value); setFpError(null) }}
                          placeholder="you@example.com" className="input-field pl-10" autoFocus
                          onKeyDown={e => e.key === 'Enter' && handleSendForgotOtp()} />
                      </div>
                    </div>
                    <button onClick={handleSendForgotOtp} disabled={fpLoading}
                      className="w-full py-3 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg,#f97316,#3b82f6)', boxShadow: '0 4px 20px rgba(249,115,22,0.35)' }}>
                      {fpLoading ? <><div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Sending...</> : <><KeyRound size={16} />Send OTP</>}
                    </button>
                  </div>
                )}

                {fpView === 'forgot-otp' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <button onClick={() => { setFpView('forgot-email'); setFpError(null) }} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                        <ArrowLeft size={16} className="text-slate-400" />
                      </button>
                      <p className="text-sm font-bold text-slate-700">Enter OTP</p>
                    </div>
                    <p className="text-sm text-slate-400">We sent a 6-digit OTP to your email. It expires in 10 minutes.</p>
                    {fpError && <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5"><p className="text-sm text-red-600 font-bold">{fpError}</p></div>}
                    <div>
                      <label className="label">OTP Code</label>
                      <input value={fpOtp} onChange={e => { setFpOtp(e.target.value); setFpError(null) }}
                        placeholder="123456" maxLength={6} className="input-field text-center text-2xl font-black tracking-[0.5em]" autoFocus
                        onKeyDown={e => e.key === 'Enter' && handleVerifyForgotOtp()} />
                    </div>
                    <button onClick={handleVerifyForgotOtp} disabled={fpLoading}
                      className="w-full py-3 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg,#f97316,#3b82f6)', boxShadow: '0 4px 20px rgba(249,115,22,0.35)' }}>
                      {fpLoading ? <><div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Verifying...</> : <><ShieldCheck size={16} />Verify OTP</>}
                    </button>
                    <button onClick={handleSendForgotOtp} className="w-full text-xs text-violet-500 hover:text-violet-600 font-semibold transition-colors">
                      Resend OTP
                    </button>
                  </div>
                )}

                {fpView === 'forgot-reset' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <button onClick={() => { setFpView('forgot-otp'); setFpError(null) }} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                        <ArrowLeft size={16} className="text-slate-400" />
                      </button>
                      <p className="text-sm font-bold text-slate-700">Set New Password</p>
                    </div>
                    {fpError && <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5"><p className="text-sm text-red-600 font-bold">{fpError}</p></div>}
                    <div>
                      <label className="label">New Password</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type={fpShowPwd ? 'text' : 'password'} value={fpNewPwd} onChange={e => { setFpNewPwd(e.target.value); setFpError(null) }}
                          placeholder="Min. 6 characters" className="input-field pl-10 pr-10" autoFocus />
                        <button type="button" onClick={() => setFpShowPwd(s => !s)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-500">
                          {fpShowPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="label">Confirm Password</label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type={fpShowPwd ? 'text' : 'password'} value={fpConfirmPwd} onChange={e => { setFpConfirmPwd(e.target.value); setFpError(null) }}
                          placeholder="Repeat new password" className="input-field pl-10"
                          onKeyDown={e => e.key === 'Enter' && handleResetPassword()} />
                      </div>
                    </div>
                    <button onClick={handleResetPassword} disabled={fpLoading}
                      className="w-full py-3 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg,#f97316,#3b82f6)', boxShadow: '0 4px 20px rgba(249,115,22,0.35)' }}>
                      {fpLoading ? <><div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Saving...</> : <><ShieldCheck size={16} />Reset Password</>}
                    </button>
                  </div>
                )}

                {fpView === 'forgot-done' && (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                      <CheckCircle2 size={32} className="text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-black text-slate-800">Password Reset!</h3>
                    <p className="text-sm text-slate-400">Your password has been updated. You can now sign in with your new password.</p>
                    <button onClick={() => { setFpView('login'); setFpError(null); setFpOtp(''); setFpNewPwd(''); setFpConfirmPwd('') }}
                      className="w-full py-3 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg,#f97316,#3b82f6)' }}>
                      <LogIn size={16} /> Back to Sign In
                    </button>
                  </div>
                )}

                {/* ── Login form (default) ── */}
                {fpView === 'login' && (
                  <>
                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <div key={shakeKey} className="animate-error-pop flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                      <span className="text-2xl flex-shrink-0">😔</span>
                      <p className="text-sm text-red-600 font-bold pt-0.5">{error}</p>
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label className="label">Email</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        ref={emailRef}
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError(null) }}
                        placeholder="you@example.com"
                        className={`input-field pl-10 ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100 bg-red-50/30' : ''}`}
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="label !mb-0">Password</label>
                      <button type="button" onClick={() => { setFpEmail(email); setFpView('forgot-email'); setFpError(null) }}
                        className="text-xs text-violet-500 hover:text-violet-600 font-semibold transition-colors">
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(null) }}
                        placeholder="Enter your password"
                        className={`input-field pl-10 pr-10 ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100 bg-red-50/30' : ''}`}
                      />
                      <button type="button" onClick={() => setShowPassword(s => !s)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-500 transition-colors">
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl text-white font-black text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 hover:-translate-y-0.5"
                    style={{ background:'linear-gradient(135deg,#f97316,#3b82f6,#f97316)', backgroundSize:'200% auto', boxShadow:'0 4px 20px rgba(249,115,22,0.35)' }}>
                    {loading
                      ? <><div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Signing in...</>
                      : <><LogIn size={16} />Sign In</>
                    }
                  </button>
                </form>

                <p className="text-center text-sm text-slate-400 mt-6">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="text-violet-600 font-bold hover:text-violet-500 transition-colors">
                    Register
                  </Link>
                </p>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
