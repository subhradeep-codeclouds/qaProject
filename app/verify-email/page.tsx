'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Bug, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function VerifyEmailContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const userId       = searchParams.get('userId') ?? ''
  const email        = searchParams.get('email') ?? ''

  const [otp,       setOtp]       = useState(['', '', '', '', '', ''])
  const [error,     setError]     = useState<string | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [resending, setResending] = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (countdown === 0) { setCanResend(true); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  function handleOtpChange(idx: number, val: string) {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[idx] = val.slice(-1)
    setOtp(next)
    setError(null)
    if (val && idx < 5) inputs.current[idx + 1]?.focus()
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      inputs.current[5]?.focus()
    }
  }

  async function handleVerify() {
    const code = otp.join('')
    if (code.length < 6) return setError('Enter the 6-digit OTP')
    setLoading(true)
    setError(null)
    const res  = await fetch('/api/auth/verify-otp', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId, otp: code }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      setSuccess(true)
      setTimeout(() => { router.push('/'); router.refresh() }, 1200)
    } else {
      setError(data.error ?? 'Verification failed')
    }
  }

  async function handleResend() {
    setResending(true)
    setError(null)
    await fetch('/api/auth/resend-otp', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId }),
    })
    setResending(false)
    setOtp(['', '', '', '', '', ''])
    setCountdown(60)
    setCanResend(false)
    inputs.current[0]?.focus()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg,#f0fdf4 0%,#ffffff 45%,#eff6ff 100%)' }}>

      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle,#86efac,transparent)', transform: 'translate(40%,-40%)' }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle,#93c5fd,transparent)', transform: 'translate(-30%,30%)' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-violet-200">
            <Bug size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-black text-slate-800">QADesk</h1>
        </div>

        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-violet-100 p-8"
          style={{ boxShadow: '0 8px 60px rgba(124,58,237,0.10)' }}>

          {success ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">🎉</div>
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-slate-800">Email verified!</h3>
              <p className="text-slate-400 text-sm mt-1">Taking you to your dashboard... ✨</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-7">
                <div className="text-4xl mb-3">📧</div>
                <h2 className="text-2xl font-black text-slate-800 mb-1">Check your email</h2>
                <p className="text-slate-400 text-sm">
                  We sent a 6-digit OTP to<br />
                  <span className="font-bold text-violet-600">{email}</span>
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
                  <span className="text-lg">⚠️</span>
                  <p className="text-sm text-red-600 font-semibold">{error}</p>
                </div>
              )}

              {/* OTP boxes */}
              <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { inputs.current[idx] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    className={`w-12 h-14 text-center text-2xl font-black rounded-xl border-2 outline-none transition-all
                      ${digit
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-slate-200 bg-slate-50 text-slate-800'}
                      focus:border-violet-500 focus:bg-violet-50 focus:ring-2 focus:ring-violet-100`}
                  />
                ))}
              </div>

              <button
                onClick={handleVerify}
                disabled={loading || otp.join('').length < 6}
                className="w-full py-3 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}
              >
                {loading
                  ? <><div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Verifying...</>
                  : <><CheckCircle2 size={16} />Verify Email</>
                }
              </button>

              <div className="text-center mt-5">
                {canResend ? (
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="flex items-center gap-1.5 mx-auto text-sm font-bold text-violet-600 hover:text-violet-500 transition-colors"
                  >
                    <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                    {resending ? 'Sending...' : 'Resend OTP'}
                  </button>
                ) : (
                  <p className="text-sm text-slate-400">
                    Resend OTP in <span className="font-bold text-slate-600">{countdown}s</span>
                  </p>
                )}
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <Link href="/login" className="flex items-center gap-1.5 justify-center text-sm text-slate-400 hover:text-slate-600 transition-colors">
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
