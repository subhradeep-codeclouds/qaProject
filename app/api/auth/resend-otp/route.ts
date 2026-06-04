import { NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase-admin'
import { sendOtpEmail } from '@/lib/mailer'

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
  const { userId } = await request.json()

  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const { data: user } = await adminSupabase
    .from('users')
    .select('id, name, email')
    .eq('id', userId)
    .maybeSingle()

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const otp     = generateOtp()
  const expires = new Date(Date.now() + 10 * 60 * 1000)

  await adminSupabase.from('email_verifications').insert([{
    user_id:    user.id,
    email:      user.email,
    otp,
    expires_at: expires.toISOString(),
    used:       false,
  }])

  await sendOtpEmail(user.name, otp)

  return NextResponse.json({ success: true })
}
