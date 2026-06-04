import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const { id, storagePath } = await request.json()

  if (!id || !storagePath) {
    return NextResponse.json({ error: 'Missing id or storagePath' }, { status: 400 })
  }

  await adminSupabase.storage.from('project-attachments').remove([storagePath])
  const { error } = await adminSupabase.from('project_attachments').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
