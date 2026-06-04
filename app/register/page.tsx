'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Eye, EyeOff, Lock, Mail, User, UserPlus, CheckCircle2, Bug, Sparkles,
} from 'lucide-react'
import { format } from 'date-fns'

function getTheme(h: number) {
  if (h >= 5  && h < 8)  return { bg: ['#f7971e','#ffd200','#ff6b6b','#a855f7'], emoji:'🌅', name:'sunrise',   accent:'#ffd200', glow:'rgba(255,210,0,0.4)'   }
  if (h >= 8  && h < 12) return { bg: ['#00b4db','#38ef7d','#11998e','#0083b0'], emoji:'☀️', name:'morning',   accent:'#38ef7d', glow:'rgba(56,239,125,0.4)'  }
  if (h >= 12 && h < 17) return { bg: ['#4776e6','#8e54e9','#f953c6','#b91d73'], emoji:'🌤️',name:'afternoon', accent:'#f953c6', glow:'rgba(249,83,198,0.4)'  }
  if (h >= 17 && h < 20) return { bg: ['#f7971e','#dd5e89','#6e48aa','#4776e6'], emoji:'🌇', name:'evening',   accent:'#dd5e89', glow:'rgba(221,94,137,0.4)'  }
  return                         { bg: ['#0f0c29','#302b63','#24243e','#1a1a2e'], emoji:'🌙', name:'night',     accent:'#a78bfa', glow:'rgba(167,139,250,0.5)'  }
}

const PARTICLES: Record<string,string[]> = {
  sunrise:   ['✦','✧','⋆','★','🌸','🌼'],
  morning:   ['☁️','✦','⋆','🌿','💚','🍃'],
  afternoon: ['✦','◆','⬟','✧','💜','⚡'],
  evening:   ['✦','★','⋆','🌺','🔥','💫'],
  night:     ['⭐','✨','💫','🌟','🌙','🪐'],
}

function Stars() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 50 }).map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white animate-twinkle"
          style={{ width:`${1+(i%3)}px`, height:`${1+(i%3)}px`, top:`${(i*13+7)%85}%`,
            left:`${(i*19+3)%95}%`, animationDelay:`${(i*0.3)%3}s`, animationDuration:`${1.5+(i%3)*0.8}s` }} />
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

/* ═══════════════════════════════════════════════════════════ */
export default function RegisterPage() {
  const router = useRouter()
  const [name,            setName]            = useState('')
  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword,    setShowPassword]    = useState(false)
  const [showConfirm,     setShowConfirm]     = useState(false)
  const [error,           setError]           = useState<string | null>(null)
  const [loading,         setLoading]         = useState(false)
  const [success,         setSuccess]         = useState(false)
  const [now,             setNow]             = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const theme    = getTheme(now.getHours())
  const gradient = `linear-gradient(135deg,${theme.bg.join(',')})`

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim())     return setError('Name is required')
    if (!email.trim())    return setError('Email is required')
    if (password.length < 6) return setError('Password must be at least 6 characters')
    if (password !== confirmPassword) return setError('Passwords do not match')

    setLoading(true)
    setError(null)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await res.json()
    if (res.ok) {
      setSuccess(true)
      setTimeout(() => {
        router.push(`/verify-email?userId=${data.userId}&email=${encodeURIComponent(data.email)}`)
      }, 800)
    } else {
      setLoading(false)
      setError(data.error ?? 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen flex overflow-hidden">

      {/* ══════════ LEFT PANEL ══════════ */}
      <div className="hidden lg:flex flex-col w-[55%] relative overflow-hidden" style={{ background: gradient }}>
        <div className="absolute inset-0 opacity-30 animate-gradient-shift" style={{ background: gradient, backgroundSize:'300% 300%' }} />
        {theme.name === 'night' && <Stars />}
        <Particles theme={theme.name} />
        <div className="absolute top-[-80px] left-[-80px] w-[350px] h-[350px] rounded-full opacity-25 animate-aurora"
          style={{ background:`radial-gradient(circle,rgba(255,255,255,0.9),transparent)`, filter:'blur(2px)' }} />
        <div className="absolute bottom-[-60px] right-[-60px] w-[400px] h-[400px] rounded-full opacity-20 animate-float-reverse"
          style={{ background:`radial-gradient(circle,rgba(255,255,255,0.7),transparent)` }} />
        <div className="absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.9) 1px,transparent 1px)', backgroundSize:'26px 26px' }} />

        <div className="relative z-10 flex flex-col h-full px-10 py-8 gap-8">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30"
              style={{ boxShadow:`0 0 20px ${theme.glow}` }}>
              <Bug size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight" style={{ textShadow:`0 0 20px ${theme.glow}` }}>QADesk</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Sparkles size={10} className="text-yellow-300" />
                <p className="text-[10px] text-white/60 font-semibold tracking-widest uppercase">Quality Assurance Workspace</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 flex flex-col items-center justify-center gap-8 text-center">
            <div style={{ filter:`drop-shadow(0 0 24px ${theme.glow})` }}>
              <span className="text-7xl">🚀</span>
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-black text-white" style={{ textShadow:`0 0 32px ${theme.glow}` }}>
                Join the team!
              </h2>
              <p className="text-white/60 text-base max-w-xs">
                Create your account and start collaborating on quality assurance with your team.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="space-y-3 w-full max-w-xs">
              {[
                { icon:'📋', text:'Manage projects & test cases' },
                { icon:'🐛', text:'Track bugs and reports' },
                { icon:'📎', text:'Share files & credentials securely' },
                { icon:'📝', text:'Daily standup & notes' },
              ].map(f => (
                <div key={f.icon} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3">
                  <span className="text-xl">{f.icon}</span>
                  <p className="text-white/80 text-sm font-medium">{f.text}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/30 text-xs text-center">{theme.emoji} {format(now, 'hh:mm a · EEE, MMM do')}</p>
        </div>
      </div>

      {/* ══════════ RIGHT PANEL ══════════ */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden"
        style={{ background:'linear-gradient(135deg,#f0fdf4 0%,#ffffff 45%,#eff6ff 100%)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 animate-float-slow"
          style={{ background:'radial-gradient(circle,#86efac,transparent)', transform:'translate(40%,-40%)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-15 animate-float"
          style={{ background:'radial-gradient(circle,#93c5fd,transparent)', transform:'translate(-30%,30%)', animationDelay:'3s' }} />

        <div className="w-full max-w-sm relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-emerald-200">
              <Bug size={24} className="text-white" />
            </div>
            <h1 className="text-lg font-black text-slate-800">QADesk</h1>
          </div>

          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-emerald-100 p-8"
            style={{ boxShadow:'0 8px 60px rgba(34,197,94,0.12), 0 2px 8px rgba(59,130,246,0.08)' }}>

            {success ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4" style={{ display:'inline-block' }}>🎉</div>
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Account created!</h3>
                <p className="text-slate-400 text-sm mt-1">Sending verification OTP to your email... 📧</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-4 border border-emerald-200 bg-emerald-50">
                    <span className="text-base">✨</span>
                    <span className="text-xs font-black text-emerald-700 tracking-wide">Create Account</span>
                  </div>
                  <h2 className="text-[24px] font-black text-slate-800 leading-tight mb-1">
                    Start your journey<br />
                    <span className="bg-clip-text text-transparent"
                      style={{ backgroundImage:'linear-gradient(90deg,#22c55e,#3b82f6)', WebkitBackgroundClip:'text' }}>
                      with QADesk
                    </span>
                  </h2>
                  <p className="text-slate-400 text-sm">Fill in the details to get started.</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  {error && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                      <span className="text-xl flex-shrink-0">⚠️</span>
                      <p className="text-sm text-red-600 font-bold pt-0.5">{error}</p>
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label className="label">Full Name</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={e => { setName(e.target.value); setError(null) }}
                        placeholder="John Doe"
                        className="input-field pl-10"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="label">Email</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError(null) }}
                        placeholder="you@example.com"
                        className="input-field pl-10"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="label">Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(null) }}
                        placeholder="Min. 6 characters"
                        className="input-field pl-10 pr-10"
                      />
                      <button type="button" onClick={() => setShowPassword(s => !s)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-500 transition-colors">
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="label">Confirm Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => { setConfirmPassword(e.target.value); setError(null) }}
                        placeholder="Repeat your password"
                        className="input-field pl-10 pr-10"
                      />
                      <button type="button" onClick={() => setShowConfirm(s => !s)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-500 transition-colors">
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl text-white font-black text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 hover:-translate-y-0.5"
                    style={{ background:'linear-gradient(135deg,#22c55e,#3b82f6)', boxShadow:'0 4px 20px rgba(34,197,94,0.35)' }}>
                    {loading
                      ? <><div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Creating account...</>
                      : <><UserPlus size={16} />Create Account</>
                    }
                  </button>
                </form>

                <p className="text-center text-sm text-slate-400 mt-6">
                  Already have an account?{' '}
                  <Link href="/login" className="text-violet-600 font-bold hover:text-violet-500 transition-colors">
                    Sign In
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
