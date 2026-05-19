import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Project = {
  id: string
  name: string
  description: string | null
  color: string
  status: 'active' | 'completed' | 'on-hold'
  created_at: string
  updated_at: string
}

export type ProjectResource = {
  id: string
  project_id: string
  type: 'link' | 'credential' | 'document' | 'note'
  title: string
  value: string | null
  is_sensitive: boolean
  created_at: string
}

export type TestCase = {
  id: string
  project_id: string
  title: string
  description: string | null
  steps: string | null
  expected_result: string | null
  actual_result: string | null
  status: 'pending' | 'pass' | 'fail' | 'blocked' | 'skipped'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: string | null
  created_at: string
  updated_at: string
}

export type TestReport = {
  id: string
  project_id: string
  title: string
  test_date: string
  environment: string | null
  total_cases: number
  passed: number
  failed: number
  blocked: number
  skipped: number
  summary: string | null
  bugs_found: number
  notes: string | null
  created_at: string
}

export type StandupNote = {
  id: string
  date: string
  tested_today: string | null
  blockers: string | null
  plan_tomorrow: string | null
  created_at: string
}
