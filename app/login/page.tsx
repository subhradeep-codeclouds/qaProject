'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bug, Eye, EyeOff, Lock, LogIn, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

    setLoading(false)

    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      setError('Wrong password. Please try again.')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #080818 0%, #0d0d24 50%, #080818 100%)' }}>

      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl"
        style={{ background: 'radial-gradient(circle, #14b8a6, transparent)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full opacity-5 blur-3xl"
        style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }} />

      <div className="w-full max-w-md relative z-10">

        {/* Card */}
        <div className="glass-card p-8 animate-slide-up">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-violet-500/30">
              <Bug size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">QA Portal</h1>
            <p className="text-slate-400 text-sm mt-1">Senior QA Engineer Dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="label flex items-center gap-1.5">
                <Lock size={12} /> Portal Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Enter your password"
                  className="input-field pr-10"
                  autoFocus
                />
                <button type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {error && (
                <div className="mt-2 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                  <ShieldCheck size={12} /> {error}
                </div>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={16} /> Sign In
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-xs text-slate-600 mt-6">
            Personal access only · Session lasts 30 days
          </p>
        </div>

        {/* Floating labels */}
        <div className="flex justify-center gap-4 mt-6">
          {['Projects', 'Test Cases', 'Reports', 'Bug Tracker'].map(label => (
            <span key={label} className="text-[10px] text-slate-700 font-medium">{label}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
