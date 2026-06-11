import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { adminSupabase } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const session = cookieStore.get('qa_portal_session')
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { currentPassword, newPassword } = await request.json()
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
  }

  const { data: user } = await adminSupabase
    .from('users')
    .select('id, password_hash')
    .eq('id', session.value)
    .maybeSingle()

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const valid = await bcrypt.compare(currentPassword, user.password_hash)
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })

  const hash = await bcrypt.hash(newPassword, 12)
  await adminSupabase.from('users').update({ password_hash: hash }).eq('id', user.id)

  return NextResponse.json({ success: true })
}
