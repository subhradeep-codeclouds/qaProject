import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const { storagePath, expiresIn = 3600 } = await request.json()

  if (!storagePath) return NextResponse.json({ error: 'Missing storagePath' }, { status: 400 })

  const { data, error } = await adminSupabase.storage
    .from('project-attachments')
    .createSignedUrl(storagePath, expiresIn)

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Failed' }, { status: 500 })
  return NextResponse.json({ signedUrl: data.signedUrl })
}
