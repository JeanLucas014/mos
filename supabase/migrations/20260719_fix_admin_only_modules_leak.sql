-- Correção de segurança: os módulos "faturamento" e "sistemas" (Jean-only,
-- ver ModuleDef.adminOnly em src/lib/modules.ts) tinham vazado pra
-- enabled_modules da conta demo (e sumido da conta do Jean). Restaura o
-- estado correto na base de dados; a defesa em profundidade real agora
-- vive no código (RequireAdmin.tsx + checks de is_admin em Sidebar.tsx/
-- ModulosTab.tsx), não mais só em enabled_modules.

UPDATE user_settings
SET enabled_modules = array(
  SELECT DISTINCT unnest(enabled_modules || ARRAY['faturamento', 'sistemas'])
)
WHERE user_id = '64ab5956-18b1-432d-82f0-1ad8bc4761db';

UPDATE user_settings
SET enabled_modules = array(
  SELECT unnest(enabled_modules) EXCEPT SELECT unnest(ARRAY['faturamento', 'sistemas'])
)
WHERE user_id <> '64ab5956-18b1-432d-82f0-1ad8bc4761db';
