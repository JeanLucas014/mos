-- ============================================================
-- Module improvements migration — run in Supabase SQL Editor
-- ============================================================

-- 1. TASKS — add priority column
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority text DEFAULT 'media' CHECK (priority IN ('alta','media','baixa'));

-- 2. PROJECTS — add notes column
ALTER TABLE projects ADD COLUMN IF NOT EXISTS notes text;

-- 3. PROJECT_CHECKLIST — new table
CREATE TABLE IF NOT EXISTS project_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  text text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  position int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE project_checklist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_select" ON project_checklist;
DROP POLICY IF EXISTS "own_insert" ON project_checklist;
DROP POLICY IF EXISTS "own_update" ON project_checklist;
DROP POLICY IF EXISTS "own_delete" ON project_checklist;
CREATE POLICY "own_select" ON project_checklist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON project_checklist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON project_checklist FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_delete" ON project_checklist FOR DELETE USING (auth.uid() = user_id);

-- 4. GOALS — add area column
ALTER TABLE goals ADD COLUMN IF NOT EXISTS area text DEFAULT 'geral';

-- 5. GOAL_ITEMS — new table
CREATE TABLE IF NOT EXISTS goal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  text text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE goal_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_select" ON goal_items;
DROP POLICY IF EXISTS "own_insert" ON goal_items;
DROP POLICY IF EXISTS "own_update" ON goal_items;
DROP POLICY IF EXISTS "own_delete" ON goal_items;
CREATE POLICY "own_select" ON goal_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON goal_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON goal_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_delete" ON goal_items FOR DELETE USING (auth.uid() = user_id);

-- 6. HABIT_EXCEPTIONS — new table
CREATE TABLE IF NOT EXISTS habit_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  exception_date date NOT NULL,
  UNIQUE (habit_id, exception_date)
);
ALTER TABLE habit_exceptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_select" ON habit_exceptions;
DROP POLICY IF EXISTS "own_insert" ON habit_exceptions;
DROP POLICY IF EXISTS "own_delete" ON habit_exceptions;
CREATE POLICY "own_select" ON habit_exceptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON habit_exceptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_delete" ON habit_exceptions FOR DELETE USING (auth.uid() = user_id);

-- 7. SPORT_GOALS — add pace calculator fields
ALTER TABLE sport_goals ADD COLUMN IF NOT EXISTS distance_km numeric;
ALTER TABLE sport_goals ADD COLUMN IF NOT EXISTS duration_s integer;
ALTER TABLE sport_goals ADD COLUMN IF NOT EXISTS linked_race_id uuid REFERENCES sport_races(id) ON DELETE SET NULL;
