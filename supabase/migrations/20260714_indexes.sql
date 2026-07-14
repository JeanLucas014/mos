-- ============================================================
-- Índices de performance — run in Supabase SQL Editor
-- Toda tabela filtra por user_id via RLS (auth.uid() = user_id).
-- Postgres não indexa FKs automaticamente, então sem esses índices
-- cada query vira um seq-scan da tabela inteira.
-- ============================================================

-- ── Tarefas ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tasks_user_pending
  ON tasks(user_id, due_date) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_project
  ON tasks(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_parent
  ON tasks(parent_id) WHERE parent_id IS NOT NULL;

-- ── Hábitos ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_habits_user       ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date
  ON habit_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit  ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_exceptions_habit
  ON habit_exceptions(habit_id);

-- ── Projetos / Metas ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_projects_user     ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_checklist_project
  ON project_checklist(project_id);
CREATE INDEX IF NOT EXISTS idx_goals_user        ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_items_goal    ON goal_items(goal_id);

-- ── Notas / Biblioteca / Estudos ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notes_user        ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_books_user        ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_studies_user      ON studies(user_id);
CREATE INDEX IF NOT EXISTS idx_study_files_study
  ON study_files(study_id) WHERE study_id IS NOT NULL;

-- ── Esportes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sports_user_date
  ON sports(user_id, sport_date);
CREATE INDEX IF NOT EXISTS idx_sport_goals_user  ON sport_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_sport_races_user_date
  ON sport_races(user_id, race_date);
CREATE INDEX IF NOT EXISTS idx_sport_shopping_user
  ON sport_shopping(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_user_date    ON runs(user_id, run_date);

-- ── Agenda ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_start
  ON calendar_events(user_id, start_at);

-- ── Financeiro ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fin_lancamentos_user_data
  ON fin_lancamentos(user_id, data);
CREATE INDEX IF NOT EXISTS idx_fin_lancamentos_parent
  ON fin_lancamentos(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fin_lancamentos_ano
  ON fin_lancamentos(ano_id);
CREATE INDEX IF NOT EXISTS idx_fin_lancamentos_categoria
  ON fin_lancamentos(categoria_id) WHERE categoria_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fin_recorrentes_user_ativo
  ON fin_recorrentes(user_id) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_fin_categorias_user ON fin_categorias(user_id);
CREATE INDEX IF NOT EXISTS idx_fin_cartoes_user    ON fin_cartoes(user_id);
CREATE INDEX IF NOT EXISTS idx_fin_anos_user        ON fin_anos(user_id);
CREATE INDEX IF NOT EXISTS idx_fin_metas_user        ON fin_metas(user_id);
CREATE INDEX IF NOT EXISTS idx_fin_investimentos_user_data
  ON fin_investimentos(user_id, data_compra);

-- ── Faturamento / Moto ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_invoices_user      ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_moto_revenue_user_date
  ON moto_revenue(user_id, revenue_date);

-- ── Compras / Sistemas / Cofre / Integrações ────────────────────
CREATE INDEX IF NOT EXISTS idx_shopping_items_user ON shopping_items(user_id);
CREATE INDEX IF NOT EXISTS idx_systems_user        ON systems(user_id);
CREATE INDEX IF NOT EXISTS idx_system_files_system
  ON system_files(system_id);
CREATE INDEX IF NOT EXISTS idx_vault_items_user    ON vault_items(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_user_provider
  ON integrations(user_id, provider);

-- ── Config de usuário ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_settings_user
  ON user_settings(user_id);
