-- ===========================
-- MIGRATION: Multi-User Auth + Storage Bucket Policies
-- Run this in Supabase SQL Editor
-- ===========================

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portal_all" ON users FOR ALL USING (true) WITH CHECK (true);

-- 2. Storage bucket policies for project-attachments
-- NOTE: First create the bucket in Supabase Dashboard → Storage → New bucket
--       Name: project-attachments  |  Public: OFF (private)
-- Then run these policies:

CREATE POLICY "allow_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'project-attachments');

CREATE POLICY "allow_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-attachments');

CREATE POLICY "allow_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'project-attachments');
