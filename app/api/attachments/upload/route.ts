import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role client bypasses RLS — server-only, never expose to client
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const formData  = await request.formData()
  const file      = formData.get('file') as File | null
  const projectId = formData.get('projectId') as string | null

  if (!file || !projectId) {
    return NextResponse.json({ error: 'Missing file or projectId' }, { status: 400 })
  }

  const safeName  = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path      = `${projectId}/${Date.now()}-${safeName}`
  const buffer    = Buffer.from(await file.arrayBuffer())
  const mimeType  = file.type || 'application/octet-stream'

  const { error: storageErr } = await adminSupabase.storage
    .from('project-attachments')
    .upload(path, buffer, { contentType: mimeType })

  if (storageErr) {
    return NextResponse.json({ error: storageErr.message }, { status: 500 })
  }

  const { error: dbErr } = await adminSupabase.from('project_attachments').insert([{
    project_id:   projectId,
    name:         file.name,
    storage_path: path,
    size:         file.size,
    mime_type:    file.type || null,
  }])

  if (dbErr) {
    // Clean up the uploaded file if DB insert fails
    await adminSupabase.storage.from('project-attachments').remove([path])
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
