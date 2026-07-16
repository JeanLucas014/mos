-- B2 (MOS_AUDIT.md): índices compostos adicionais para telas quentes (Extrato, Investimentos)
-- não cobertas pelos índices de C3.
--
-- idx_investimentos_user_tipo (user_id, tipo) já existia em produção como
-- fin_investimentos_user_id_tipo_idx — não recriado aqui.

CREATE INDEX IF NOT EXISTS idx_lancamentos_user_categoria
  ON fin_lancamentos(user_id, categoria_id);

CREATE INDEX IF NOT EXISTS idx_lancamentos_user_cartao
  ON fin_lancamentos(user_id, cartao_id) WHERE cartao_id IS NOT NULL;
