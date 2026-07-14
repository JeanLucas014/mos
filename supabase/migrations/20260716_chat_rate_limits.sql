-- ============================================================
-- FIX M4 — rate limiting para a Edge Function mos-chat.
-- Sem policies de acesso direto do cliente — só a Edge Function
-- (via service role) deve tocar nessa tabela.
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_rate_limits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  count integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_rate_limits ENABLE ROW LEVEL SECURITY;
