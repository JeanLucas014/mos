CREATE TABLE IF NOT EXISTS dismissed_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id text NOT NULL,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_id)
);

ALTER TABLE dismissed_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_dismissed_notifications ON dismissed_notifications
FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_dismissed_user
  ON dismissed_notifications(user_id);
