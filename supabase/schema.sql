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

-- ===========================
-- MIGRATION: Enhanced Project Sections
-- Run these additions after the base schema above
-- ===========================

-- Dedicated credentials per project
CREATE TABLE IF NOT EXISTS project_credentials (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  username     TEXT,
  password     TEXT,
  url          TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Environment URLs per project
CREATE TABLE IF NOT EXISTS project_urls (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  label        TEXT NOT NULL DEFAULT 'App URL',
  url          TEXT NOT NULL,
  env          TEXT DEFAULT 'dev'
               CHECK (env IN ('dev', 'staging', 'production', 'qa', 'custom')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Google Sheets / RTM / test doc links per project
CREATE TABLE IF NOT EXISTS project_sheets (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  url          TEXT NOT NULL,
  type         TEXT DEFAULT 'test_cases'
               CHECK (type IN ('test_cases', 'rtm', 'regression', 'smoke', 'other')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Project notes
CREATE TABLE IF NOT EXISTS project_notes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  date       DATE DEFAULT CURRENT_DATE,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- Row Level Security
-- Enable RLS on all tables so only authenticated sessions can access data.
-- These "allow all" policies preserve current behavior (single-user portal
-- with custom session auth). For multi-user setups, replace with user-scoped
-- policies using auth.uid().
-- ===========================

ALTER TABLE project_notes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_resources   ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_urls        ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_sheets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases          ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_reports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bugs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE standup_notes       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portal_all" ON project_notes       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "portal_all" ON projects            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "portal_all" ON project_resources   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "portal_all" ON project_credentials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "portal_all" ON project_urls        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "portal_all" ON project_sheets      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "portal_all" ON test_cases          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "portal_all" ON test_reports        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "portal_all" ON bugs                FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "portal_all" ON standup_notes       FOR ALL USING (true) WITH CHECK (true);
