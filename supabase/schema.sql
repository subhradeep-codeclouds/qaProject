-- ===========================
-- QA PORTAL - DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ===========================

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT NOT NULL DEFAULT '#8b5cf6',
  status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on-hold')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Project resources (links, credentials, docs, notes)
CREATE TABLE IF NOT EXISTS project_resources (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('link', 'credential', 'document', 'note')),
  title        TEXT NOT NULL,
  value        TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Test cases
CREATE TABLE IF NOT EXISTS test_cases (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  steps           TEXT,
  expected_result TEXT,
  actual_result   TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'pass', 'fail', 'blocked', 'skipped')),
  priority        TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Daily test reports
CREATE TABLE IF NOT EXISTS test_reports (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  test_date   DATE DEFAULT CURRENT_DATE,
  environment TEXT,
  total_cases INTEGER DEFAULT 0,
  passed      INTEGER DEFAULT 0,
  failed      INTEGER DEFAULT 0,
  blocked     INTEGER DEFAULT 0,
  skipped     INTEGER DEFAULT 0,
  bugs_found  INTEGER DEFAULT 0,
  summary     TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Bug tracker
CREATE TABLE IF NOT EXISTS bugs (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id          UUID REFERENCES projects(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  severity            TEXT DEFAULT 'high' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  status              TEXT DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'fixed', 'closed')),
  description         TEXT,
  steps_to_reproduce  TEXT,
  environment         TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Standup notes (one per day)
CREATE TABLE IF NOT EXISTS standup_notes (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date           DATE DEFAULT CURRENT_DATE UNIQUE,
  tested_today   TEXT,
  blockers       TEXT,
  plan_tomorrow  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER test_cases_updated_at
  BEFORE UPDATE ON test_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security (enable after setting up auth)
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE project_resources ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE test_reports ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bugs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE standup_notes ENABLE ROW LEVEL SECURITY;
