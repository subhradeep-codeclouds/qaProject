import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { name, email, password } = await request.json()

  if (!name?.trim())              return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!email?.trim())             return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  if (!password || password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Email is already registered' }, { status: 400 })

  const password_hash = await bcrypt.hash(password, 10)

  const { data: user, error } = await supabase
    .from('users')
    .insert([{ name: name.trim(), email: email.toLowerCase().trim(), password_hash }])
    .select('id, name, email')
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })

  const response = NextResponse.json({ success: true, user: { name: user.name, email: user.email } })
  response.cookies.set('qa_portal_session', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return response
}
