-- Módulo Orçamento (Financeiro): planejamento mensal separado dos
-- lançamentos reais, comparando previsto x realizado. Segue o mesmo
-- padrão de RLS de fin_categorias/fin_lancamentos: policy única "own
-- rows" com user_id default auth.uid().

CREATE TABLE orcamento_config (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  meta_guardar_tipo   text NOT NULL DEFAULT 'percentual'
    CHECK (meta_guardar_tipo IN ('percentual', 'valor_fixo')),
  meta_guardar_valor  numeric NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orcamento_grupos (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  nome                    text NOT NULL,
  tipo                    text NOT NULL CHECK (tipo IN ('fixo', 'variavel')),
  -- fin_categorias.id é uuid (confirmado no schema) — array de uuid,
  -- não text, pra manter integridade referencial de fato.
  categorias_vinculadas   uuid[] NOT NULL DEFAULT '{}',
  valor_previsto_padrao   numeric NOT NULL DEFAULT 0,
  ordem                   integer NOT NULL DEFAULT 0,
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orcamento_entradas (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  nome                    text NOT NULL,
  valor_previsto_padrao   numeric NOT NULL DEFAULT 0,
  ordem                   integer NOT NULL DEFAULT 0,
  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orcamento_mes_overrides (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  mes_ref           date NOT NULL,
  tipo_referencia   text NOT NULL CHECK (tipo_referencia IN ('grupo', 'entrada', 'meta_guardar')),
  referencia_id     uuid,
  valor_override    numeric NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orcamento_mes_overrides_ref_check CHECK (
    (tipo_referencia = 'meta_guardar' AND referencia_id IS NULL) OR
    (tipo_referencia <> 'meta_guardar' AND referencia_id IS NOT NULL)
  )
);

-- mes_ref sempre normalizado pro dia 1 do mês.
ALTER TABLE orcamento_mes_overrides ADD CONSTRAINT orcamento_mes_overrides_mes_ref_dia1
  CHECK (date_trunc('month', mes_ref) = mes_ref);

CREATE INDEX idx_orcamento_config_user       ON orcamento_config(user_id);
CREATE INDEX idx_orcamento_grupos_user       ON orcamento_grupos(user_id);
CREATE INDEX idx_orcamento_entradas_user     ON orcamento_entradas(user_id);
CREATE INDEX idx_orcamento_overrides_user    ON orcamento_mes_overrides(user_id);
CREATE INDEX idx_orcamento_overrides_mes_ref ON orcamento_mes_overrides(mes_ref);

-- No máximo um override por (usuário, mês, tipo, referência). NULL não
-- é único por padrão no Postgres (permitiria vários overrides de
-- meta_guardar no mesmo mês), então usa COALESCE com um uuid sentinela
-- só pra fins de unicidade.
CREATE UNIQUE INDEX idx_orcamento_overrides_unique ON orcamento_mes_overrides (
  user_id, mes_ref, tipo_referencia,
  COALESCE(referencia_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

ALTER TABLE orcamento_config          ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_grupos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_entradas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_mes_overrides   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own rows" ON orcamento_config
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own rows" ON orcamento_grupos
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own rows" ON orcamento_entradas
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own rows" ON orcamento_mes_overrides
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
