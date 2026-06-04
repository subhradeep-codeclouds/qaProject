import { NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  const { userId, otp } = await request.json()

  if (!userId || !otp) return NextResponse.json({ error: 'Missing userId or OTP' }, { status: 400 })

  const { data: record } = await adminSupabase
    .from('email_verifications')
    .select('*')
    .eq('user_id', userId)
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!record) return NextResponse.json({ error: 'OTP not found or already used' }, { status: 400 })

  if (new Date(record.expires_at) < new Date()) {
    return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 })
  }

  if (record.otp !== otp.trim()) {
    return NextResponse.json({ error: 'Incorrect OTP. Please try again.' }, { status: 400 })
  }

  // Mark OTP as used and user as verified
  await Promise.all([
    adminSupabase.from('email_verifications').update({ used: true }).eq('id', record.id),
    adminSupabase.from('users').update({ email_verified: true }).eq('id', userId),
  ])

  const { data: user } = await adminSupabase
    .from('users')
    .select('id, name, email')
    .eq('id', userId)
    .single()

  const response = NextResponse.json({ success: true, user })
  response.cookies.set('qa_portal_session', userId, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 30,
    path:     '/',
  })
  return response
}
