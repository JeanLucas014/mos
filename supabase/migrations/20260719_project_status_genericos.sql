-- Migra status de projeto pros 5 valores genéricos novos (não mais
-- focados em desenvolvimento de software).
-- Mapeamento aplicado (confirmado contra os valores reais em uso):
--   'início'  -> 'planejamento'   (fase de início = planejamento)
--   'em dev'  -> 'em_andamento'   (trabalho ativo)
--   'ativo'   -> 'em_andamento'   (default antigo, sem linhas no momento)
--   'live'    -> 'concluido'      (entregue/no ar, sem linhas no momento)
--   'pausado' -> 'pausado'        (sem mudança)
--   'em_andamento' (já existia solto, fora do enum antigo) -> sem mudança

UPDATE projects SET status = 'planejamento' WHERE status = 'início';
UPDATE projects SET status = 'em_andamento' WHERE status IN ('em dev', 'ativo');
UPDATE projects SET status = 'concluido'    WHERE status = 'live';

ALTER TABLE projects ALTER COLUMN status SET DEFAULT 'planejamento';

ALTER TABLE projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('planejamento', 'em_andamento', 'pausado', 'concluido', 'cancelado'));
