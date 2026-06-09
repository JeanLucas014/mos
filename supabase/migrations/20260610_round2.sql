-- ============================================================
-- Round-2 migrations — 2026-06-10
-- ============================================================

-- ── moto_revenue ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS moto_revenue (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  record_date date NOT NULL,
  type        text NOT NULL CHECK (type IN ('entrada','gasto')),
  category    text NOT NULL,
  description text NOT NULL,
  amount_cents integer NOT NULL,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE moto_revenue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_select" ON moto_revenue;
DROP POLICY IF EXISTS "own_insert" ON moto_revenue;
DROP POLICY IF EXISTS "own_update" ON moto_revenue;
DROP POLICY IF EXISTS "own_delete" ON moto_revenue;
CREATE POLICY "own_select" ON moto_revenue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON moto_revenue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON moto_revenue FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_delete" ON moto_revenue FOR DELETE USING (auth.uid() = user_id);

-- ── systems ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS systems (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text,
  category      text NOT NULL DEFAULT 'App',
  status        text NOT NULL DEFAULT 'Ativo',
  url           text,
  stack         text[],
  thumbnail_url text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_select" ON systems;
DROP POLICY IF EXISTS "own_insert" ON systems;
DROP POLICY IF EXISTS "own_update" ON systems;
DROP POLICY IF EXISTS "own_delete" ON systems;
CREATE POLICY "own_select" ON systems FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON systems FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON systems FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_delete" ON systems FOR DELETE USING (auth.uid() = user_id);

-- ── system_files ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_files (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  system_id uuid NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  name      text NOT NULL,
  type      text NOT NULL DEFAULT 'Link',
  url       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE system_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_select" ON system_files;
DROP POLICY IF EXISTS "own_insert" ON system_files;
DROP POLICY IF EXISTS "own_update" ON system_files;
DROP POLICY IF EXISTS "own_delete" ON system_files;
CREATE POLICY "own_select" ON system_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON system_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON system_files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_delete" ON system_files FOR DELETE USING (auth.uid() = user_id);

-- ── Storage bucket for system thumbnails ────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('systems', 'systems', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: users can upload to their own folder
DROP POLICY IF EXISTS "systems_upload" ON storage.objects;
CREATE POLICY "systems_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'systems' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "systems_public_read" ON storage.objects;
CREATE POLICY "systems_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'systems');

DROP POLICY IF EXISTS "systems_delete" ON storage.objects;
CREATE POLICY "systems_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'systems' AND auth.uid()::text = (storage.foldername(name))[1]);
