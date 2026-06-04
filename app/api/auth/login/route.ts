import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { adminSupabase } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  if (!password)      return NextResponse.json({ error: 'Password is required' }, { status: 400 })

  const { data: user } = await adminSupabase
    .from('users')
    .select('id, name, email, password_hash, email_verified')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (!user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

  if (!user.email_verified) {
    return NextResponse.json({ error: 'Please verify your email before logging in.', needsVerification: true, userId: user.id, email: user.email }, { status: 403 })
  }

  const response = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email } })
  response.cookies.set('qa_portal_session', user.id, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 30,
    path:     '/',
  })
  return response
}
