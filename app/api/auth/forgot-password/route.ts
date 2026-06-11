import { NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase-admin'
import { sendForgotPasswordEmail } from '@/lib/mailer'

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  const { email } = await request.json()
  if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  const { data: user } = await adminSupabase
    .from('users')
    .select('id, name, email')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (!user) return NextResponse.json({ error: 'No account found with this email.' }, { status: 404 })

  const otp     = generateOtp()
  const expires = new Date(Date.now() + 10 * 60 * 1000)

  await adminSupabase.from('email_verifications').insert([{
    user_id:    user.id,
    email:      user.email,
    otp,
    expires_at: expires.toISOString(),
    used:       false,
  }])

  await sendForgotPasswordEmail(user.name, user.email, otp)

  return NextResponse.json({ success: true, userId: user.id })
}
