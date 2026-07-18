ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS week_start text NOT NULL DEFAULT 'monday'
  CHECK (week_start IN ('monday', 'sunday'));
