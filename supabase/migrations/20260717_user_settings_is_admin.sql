-- ============================================================
-- FIX M5 — centralizar identificação de admin numa única fonte
-- da verdade, substituindo os hardcodes JEAN_ID (UUID) e
-- ADMIN_EMAIL (email) espalhados pelo código.
-- ============================================================

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

UPDATE user_settings
SET is_admin = true
WHERE user_id = '64ab5956-18b1-432d-82f0-1ad8bc4761db';
