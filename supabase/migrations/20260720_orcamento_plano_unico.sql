-- Orçamento deixa de ser por mês: plano único, sempre vigente.
-- orcamento_mes_overrides confirmada vazia antes do drop (verificado via
-- SELECT * — 0 linhas, nada a migrar pra valor_previsto_padrao).
DROP TABLE orcamento_mes_overrides;

-- Cada grupo agora escolhe entre valor manual fixo ou vínculo a
-- categoria(s) (realizado calculado do mês corrente).
ALTER TABLE orcamento_grupos
  ADD COLUMN modo text NOT NULL DEFAULT 'manual' CHECK (modo IN ('manual', 'categoria'));

-- Grupos que já tinham categorias_vinculadas preenchido claramente
-- pretendiam usar o modo 'categoria' — migra pra manter o comportamento
-- atual de cada grupo existente em vez de forçar todo mundo pra manual.
UPDATE orcamento_grupos SET modo = 'categoria' WHERE array_length(categorias_vinculadas, 1) > 0;
