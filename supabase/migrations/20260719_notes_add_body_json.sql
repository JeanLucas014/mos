ALTER TABLE notes ADD COLUMN IF NOT EXISTS body_json jsonb;
-- body (text) é mantida como espelho em texto puro do conteúdo rico —
-- usada no preview da lista de notas e como fallback caso body_json
-- seja nulo (notas ainda não migradas/criadas antes do editor rico).
