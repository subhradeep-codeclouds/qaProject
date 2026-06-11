import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminSupabase } from '@/lib/supabase-admin'

async function getUserId() {
  const cookieStore = await cookies()
  return cookieStore.get('qa_portal_session')?.value ?? null
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data } = await adminSupabase
    .from('user_calendar_data')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  return NextResponse.json({
    workStatus:  data?.work_status  ?? {},
    notes:       data?.notes        ?? [],
    userEvents:  data?.user_events  ?? [],
    todos:       data?.todos        ?? [],
  })
}

export async function PUT(request: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { workStatus, notes, userEvents, todos } = await request.json()

  await adminSupabase.from('user_calendar_data').upsert({
    user_id:     userId,
    work_status: workStatus ?? {},
    notes:       notes      ?? [],
    user_events: userEvents ?? [],
    todos:       todos      ?? [],
    updated_at:  new Date().toISOString(),
  }, { onConflict: 'user_id' })

  return NextResponse.json({ success: true })
}
