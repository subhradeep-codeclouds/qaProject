import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { adminSupabase } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  const { userId, otp, newPassword } = await request.json()

  if (!userId || !otp || !newPassword) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

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

  const hash = await bcrypt.hash(newPassword, 12)

  await Promise.all([
    adminSupabase.from('email_verifications').update({ used: true }).eq('id', record.id),
    adminSupabase.from('users').update({ password_hash: hash }).eq('id', userId),
  ])

  return NextResponse.json({ success: true })
}
