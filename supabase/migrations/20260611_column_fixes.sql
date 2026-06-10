-- ── Fix column names across multiple tables ──────────────────────

-- 1. project_checklist: rename text → title
ALTER TABLE IF EXISTS project_checklist RENAME COLUMN text TO title;

-- 2. goal_items: rename text → title
ALTER TABLE IF EXISTS goal_items RENAME COLUMN text TO title;

-- 3. systems: rename stack → tech_stack
ALTER TABLE IF EXISTS systems RENAME COLUMN stack TO tech_stack;

-- 4. moto_revenue: rename record_date → revenue_date, type → kind
ALTER TABLE IF EXISTS moto_revenue RENAME COLUMN record_date TO revenue_date;
ALTER TABLE IF EXISTS moto_revenue RENAME COLUMN type TO kind;

-- 5. system_files: rename url → file_url, add is_download boolean
ALTER TABLE IF EXISTS system_files RENAME COLUMN url TO file_url;
ALTER TABLE IF EXISTS system_files ADD COLUMN IF NOT EXISTS is_download boolean NOT NULL DEFAULT false;
