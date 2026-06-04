import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { adminSupabase } from '@/lib/supabase-admin'
import { sendOtpEmail } from '@/lib/mailer'

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  const { name, email, password } = await request.json()

  if (!name?.trim())        return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!email?.trim())       return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  if (!password || password.length < 6)
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

  const normalizedEmail = email.toLowerCase().trim()

  const { data: existing } = await adminSupabase
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Email is already registered' }, { status: 400 })

  const password_hash = await bcrypt.hash(password, 10)

  const { data: user, error } = await adminSupabase
    .from('users')
    .insert([{ name: name.trim(), email: normalizedEmail, password_hash, email_verified: false }])
    .select('id, name, email')
    .single()

  if (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Failed to create account. Make sure the users table exists in Supabase.' }, { status: 500 })
  }

  const otp     = generateOtp()
  const expires = new Date(Date.now() + 10 * 60 * 1000)

  await adminSupabase.from('email_verifications').insert([{
    user_id:    user.id,
    email:      normalizedEmail,
    otp,
    expires_at: expires.toISOString(),
    used:       false,
  }])

  try {
    await sendOtpEmail(user.name, otp)
  } catch (emailErr) {
    console.error('Email send failed:', emailErr)
  }

  return NextResponse.json({ success: true, userId: user.id, email: normalizedEmail })
}
