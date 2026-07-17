-- Habilita a replicação Realtime (postgres_changes) nas tabelas usadas
-- pelo useRealtimeSync (substitui polling por eventos em tempo real no
-- Financeiro, Tarefas, Agenda, Hábitos e no sino de notificações).
--
-- RLS já é 100% aplicado nessas tabelas (confirmado na auditoria) — o
-- Realtime do Supabase respeita RLS por padrão, então cada usuário só
-- recebe eventos das próprias linhas.

ALTER PUBLICATION supabase_realtime ADD TABLE tasks, calendar_events, fin_lancamentos, fin_recorrentes, habit_logs;
