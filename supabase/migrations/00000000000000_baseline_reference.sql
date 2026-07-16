-- ═══════════════════════════════════════════════════════════════════
-- BASELINE DE REFERÊNCIA — NÃO REAPLICAR
-- ═══════════════════════════════════════════════════════════════════
-- Gerado em 2026-07-16 via introspecção direta do banco de produção
-- (MCP Supabase, project fuykgxogvqvfwzqfigxz), como parte do item B12
-- do MOS_AUDIT.md.
--
-- Este arquivo documenta o schema COMPLETO tal como existe hoje em
-- produção. As migrations anteriores (20260609 em diante) são
-- incrementais e não representam o schema inteiro, porque a maioria
-- das tabelas foi criada fora de migration (diretamente no dashboard).
--
-- NÃO RODAR ESTE ARQUIVO — as tabelas já existem. Ele serve apenas
-- como referência de leitura para quem precisar entender o schema
-- completo sem acessar o dashboard do Supabase.
--
-- Achados relevantes desta extração (ver MOS_AUDIT_STATUS.md para o
-- resumo completo):
--   • RLS está habilitado em 100% das tabelas públicas (47/47) — o
--     maior ponto cego de segurança do audit original está resolvido.
--   • Todas as tabelas de usuário seguem o padrão own_* (auth.uid() =
--     user_id), exceto fin_taxas_economicas (tabela de referência
--     pública, sem user_id — correto).
--   • storage.objects: bucket "systems" permite SELECT para qualquer
--     usuário autenticado (não só o dono) — mesmo achado do M24,
--     revisar se intencional. Bucket "covers" segue o mesmo padrão.
--   • Vários índices duplicados/redundantes (ex: idx_books_user e
--     idx_books_user_id no mesmo (user_id), repetido em ~15 tabelas)
--     — candidatos a limpeza futura, não removidos aqui para não
--     arriscar uma migration destrutiva sem mais contexto.
-- ═══════════════════════════════════════════════════════════════════


-- ─── TABELAS ──────────────────────────────────────────────────────────

-- Table: books
CREATE TABLE public.books (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  author text,
  status text NOT NULL DEFAULT 'quero_ler'::text,
  cover_url text,
  progress integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  favorite boolean NOT NULL DEFAULT false,
  category text,
  total_pages integer,
  pages_read integer DEFAULT 0,
  started_at date,
  finished_at date,
  rating integer DEFAULT 0,
  format text DEFAULT 'fisico'::text
);

-- Table: calendar_events
CREATE TABLE public.calendar_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  description text,
  start_at timestamp with time zone NOT NULL,
  end_at timestamp with time zone NOT NULL,
  all_day boolean DEFAULT false,
  color text DEFAULT '#0EA5E9'::text,
  location text,
  recurrence_rule text,
  created_at timestamp with time zone DEFAULT now(),
  tags text[] DEFAULT '{}'::text[]
);

-- Table: calendar_rotinas
CREATE TABLE public.calendar_rotinas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  titulo text NOT NULL,
  descricao text,
  hora_inicio time without time zone,
  hora_fim time without time zone,
  dias_semana text[] NOT NULL DEFAULT '{}'::text[],
  cor text DEFAULT '#0EA5E9'::text,
  ativa boolean DEFAULT true,
  ordem integer DEFAULT 0
);

-- Table: calendar_tags
CREATE TABLE public.calendar_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#0EA5E9'::text
);

-- Table: chat_rate_limits
CREATE TABLE public.chat_rate_limits (
  user_id uuid NOT NULL,
  count integer NOT NULL DEFAULT 0,
  window_start timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: events (LEGADO — ver C4 do audit, código morto usa esta tabela)
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  description text,
  starts_at timestamp with time zone NOT NULL,
  ends_at timestamp with time zone,
  category text DEFAULT 'geral'::text,
  source text DEFAULT 'local'::text,
  external_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: fin_anos
CREATE TABLE public.fin_anos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  ano integer NOT NULL,
  saldo_inicial numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: fin_cartoes
CREATE TABLE public.fin_cartoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  nome text NOT NULL,
  cor text
);

-- Table: fin_categorias
CREATE TABLE public.fin_categorias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  nome text NOT NULL,
  natureza text NOT NULL,
  cor text,
  rapida boolean DEFAULT false,
  ordem integer DEFAULT 0
);

-- Table: fin_investimentos
CREATE TABLE public.fin_investimentos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  nome text NOT NULL,
  tipo text NOT NULL,
  subtipo text,
  ticker text,
  instituicao text,
  cor text DEFAULT '#0EA5E9'::text,
  quantidade numeric(20,8),
  preco_medio numeric(20,8),
  valor_atual numeric(20,2),
  valor_aplicado numeric(20,2),
  data_atualizacao date,
  indexador text,
  taxa_adicional numeric(8,4),
  data_compra date,
  data_vencimento date,
  liquidez text DEFAULT 'no_vencimento'::text,
  ativo boolean DEFAULT true,
  notas text,
  criado_em timestamp with time zone DEFAULT now()
);

-- Table: fin_investimentos_movimentos
CREATE TABLE public.fin_investimentos_movimentos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  investimento_id uuid NOT NULL,
  tipo text NOT NULL,
  valor numeric(20,2) NOT NULL,
  quantidade numeric(20,8),
  preco_unitario numeric(20,8),
  data date NOT NULL,
  notas text,
  criado_em timestamp with time zone DEFAULT now()
);

-- Table: fin_lancamentos
CREATE TABLE public.fin_lancamentos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  ano_id uuid NOT NULL,
  parent_id uuid,
  data date NOT NULL,
  natureza text NOT NULL,
  nome text NOT NULL,
  valor numeric(12,2),
  is_grupo boolean DEFAULT false,
  categoria_id uuid,
  cartao_id uuid,
  saida_tipo text,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  is_previsao boolean DEFAULT false,
  pluggy_tx_id text,
  pago boolean DEFAULT false
);

-- Table: fin_metas
CREATE TABLE public.fin_metas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  nome text NOT NULL,
  alvo numeric(12,2) NOT NULL,
  atual numeric(12,2) NOT NULL DEFAULT 0,
  ordem integer DEFAULT 0
);

-- Table: fin_previsao_config
CREATE TABLE public.fin_previsao_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  nome text NOT NULL,
  valor numeric(12,2) NOT NULL DEFAULT 0,
  ordem integer DEFAULT 0
);

-- Table: fin_recorrentes
CREATE TABLE public.fin_recorrentes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  nome text NOT NULL,
  valor numeric(12,2) NOT NULL DEFAULT 0,
  dia_previsto integer NOT NULL,
  natureza text NOT NULL DEFAULT 'saida'::text,
  saida_tipo text DEFAULT 'fixa'::text,
  categoria_id uuid,
  ativo boolean DEFAULT true
);

-- Table: fin_taxas_economicas (tabela de referência pública, sem user_id)
CREATE TABLE public.fin_taxas_economicas (
  indicador text NOT NULL,
  valor_anual numeric(10,4),
  valor_mensal numeric(10,6),
  data_referencia date,
  atualizado_em timestamp with time zone DEFAULT now()
);

-- Table: goal_items
CREATE TABLE public.goal_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  goal_id uuid NOT NULL,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  position integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  text text
);

-- Table: goals
CREATE TABLE public.goals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  label text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  area text DEFAULT 'pessoal'::text
);

-- Table: habit_exceptions
CREATE TABLE public.habit_exceptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  habit_id uuid NOT NULL,
  exception_date date NOT NULL
);

-- Table: habit_logs
CREATE TABLE public.habit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  habit_id uuid NOT NULL,
  log_date date NOT NULL
);

-- Table: habits
CREATE TABLE public.habits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: integrations
CREATE TABLE public.integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  provider text NOT NULL,
  connected boolean NOT NULL DEFAULT false,
  access_token_cipher text,
  refresh_token_cipher text,
  meta jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: invoices
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  service text NOT NULL,
  client text NOT NULL,
  amount_cents bigint NOT NULL,
  status text NOT NULL DEFAULT 'enviado'::text,
  due_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: moto_revenue
CREATE TABLE public.moto_revenue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  revenue_date date NOT NULL,
  description text NOT NULL DEFAULT 'Corrida'::text,
  amount_cents bigint NOT NULL DEFAULT 0,
  kind text NOT NULL DEFAULT 'entrada'::text,
  category text DEFAULT 'corrida'::text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: notes
CREATE TABLE public.notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text DEFAULT 'Sem título'::text,
  body text DEFAULT ''::text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: pluggy_connections
CREATE TABLE public.pluggy_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  item_id text NOT NULL,
  bank_name text NOT NULL,
  account_type text NOT NULL,
  account_id text,
  status text DEFAULT 'active'::text,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: profiles
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Jean'::text,
  city text DEFAULT 'Belo Horizonte'::text,
  marathon_goal text DEFAULT 'sub-3h'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: project_checklist
CREATE TABLE public.project_checklist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  project_id uuid NOT NULL,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  position integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  text text
);

-- Table: projects
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  meta text,
  status text NOT NULL DEFAULT 'ativo'::text,
  progress integer NOT NULL DEFAULT 0,
  delivered boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text
);

-- Table: runs
CREATE TABLE public.runs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL DEFAULT 'easy'::text,
  distance_m integer NOT NULL,
  duration_s integer NOT NULL,
  pace_label text,
  run_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: shopping_items
CREATE TABLE public.shopping_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  category text NOT NULL DEFAULT 'Geral'::text
);

-- Table: sport_goals
CREATE TABLE public.sport_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  sport text NOT NULL DEFAULT 'corrida'::text,
  name text NOT NULL,
  target text,
  done boolean NOT NULL DEFAULT false,
  target_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  distance_km numeric,
  duration_s integer,
  linked_race_id uuid
);

-- Table: sport_races
CREATE TABLE public.sport_races (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  sport text NOT NULL DEFAULT 'corrida'::text,
  name text NOT NULL,
  race_date date NOT NULL,
  location text,
  distance text,
  goal_time text,
  registered boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: sport_shopping
CREATE TABLE public.sport_shopping (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  sport text NOT NULL DEFAULT 'corrida'::text,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: sports
CREATE TABLE public.sports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  sport text NOT NULL DEFAULT 'corrida'::text,
  kind text NOT NULL DEFAULT 'easy'::text,
  distance_m integer,
  duration_s integer NOT NULL,
  pace_label text,
  sport_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  external_id text
);

-- Table: studies
CREATE TABLE public.studies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  meta text,
  progress integer DEFAULT 0,
  status text DEFAULT 'ativo'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: study_files
CREATE TABLE public.study_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  study_id uuid,
  name text NOT NULL,
  kind text DEFAULT 'PDF'::text,
  source text DEFAULT 'drive'::text,
  external_url text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: system_files
CREATE TABLE public.system_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  system_id uuid NOT NULL,
  name text NOT NULL,
  file_url text NOT NULL,
  file_type text DEFAULT 'link'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  file_size bigint,
  mime_type text,
  is_download boolean DEFAULT false
);

-- Table: systems
CREATE TABLE public.systems (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  description text,
  category text DEFAULT 'app'::text,
  status text DEFAULT 'ativo'::text,
  url text,
  tech_stack text[],
  thumbnail_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  stack text
);

-- Table: task_comments
CREATE TABLE public.task_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: task_projects
CREATE TABLE public.task_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6b7280'::text,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: task_recurrence
CREATE TABLE public.task_recurrence (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  freq text NOT NULL,
  interval_n integer NOT NULL DEFAULT 1,
  days_of_week text[],
  end_date date,
  next_due date NOT NULL
);

-- Table: tasks
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  description text,
  priority integer NOT NULL DEFAULT 4,
  project_id uuid,
  parent_id uuid,
  due_date date,
  due_time time without time zone,
  completed_at timestamp with time zone,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Table: transactions
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  description text NOT NULL,
  amount_cents bigint NOT NULL,
  kind text NOT NULL DEFAULT 'out'::text,
  category text,
  occurred_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table: user_settings
CREATE TABLE public.user_settings (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  enabled_modules text[] NOT NULL DEFAULT '{}'::text[],
  onboarding_completed boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  notification_prefs jsonb DEFAULT '{"contas_hoje": true, "tarefas_hoje": true, "eventos_agenda": true, "contas_vencidas": true, "habitos_fim_dia": true, "tarefas_vencidas": true}'::jsonb,
  theme text DEFAULT 'system'::text,
  is_admin boolean NOT NULL DEFAULT false
);

-- Table: user_sports
CREATE TABLE public.user_sports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  key text NOT NULL,
  label text NOT NULL,
  ordem integer DEFAULT 0
);

-- Table: vault_items
CREATE TABLE public.vault_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  service text NOT NULL,
  username text,
  password_cipher text NOT NULL,
  password_iv text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  kind text NOT NULL DEFAULT 'senha'::text
);


-- ─── PRIMARY KEYS ─────────────────────────────────────────────────────

ALTER TABLE public.books ADD CONSTRAINT books_pkey PRIMARY KEY (id);
ALTER TABLE public.calendar_events ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);
ALTER TABLE public.calendar_rotinas ADD CONSTRAINT calendar_rotinas_pkey PRIMARY KEY (id);
ALTER TABLE public.calendar_tags ADD CONSTRAINT calendar_tags_pkey PRIMARY KEY (id);
ALTER TABLE public.chat_rate_limits ADD CONSTRAINT chat_rate_limits_pkey PRIMARY KEY (user_id);
ALTER TABLE public.events ADD CONSTRAINT events_pkey PRIMARY KEY (id);
ALTER TABLE public.fin_anos ADD CONSTRAINT fin_anos_pkey PRIMARY KEY (id);
ALTER TABLE public.fin_cartoes ADD CONSTRAINT fin_cartoes_pkey PRIMARY KEY (id);
ALTER TABLE public.fin_categorias ADD CONSTRAINT fin_categorias_pkey PRIMARY KEY (id);
ALTER TABLE public.fin_investimentos ADD CONSTRAINT fin_investimentos_pkey PRIMARY KEY (id);
ALTER TABLE public.fin_investimentos_movimentos ADD CONSTRAINT fin_investimentos_movimentos_pkey PRIMARY KEY (id);
ALTER TABLE public.fin_lancamentos ADD CONSTRAINT fin_lancamentos_pkey PRIMARY KEY (id);
ALTER TABLE public.fin_metas ADD CONSTRAINT fin_metas_pkey PRIMARY KEY (id);
ALTER TABLE public.fin_previsao_config ADD CONSTRAINT fin_previsao_config_pkey PRIMARY KEY (id);
ALTER TABLE public.fin_recorrentes ADD CONSTRAINT fin_recorrentes_pkey PRIMARY KEY (id);
ALTER TABLE public.fin_taxas_economicas ADD CONSTRAINT fin_taxas_economicas_pkey PRIMARY KEY (indicador);
ALTER TABLE public.goal_items ADD CONSTRAINT goal_items_pkey PRIMARY KEY (id);
ALTER TABLE public.goals ADD CONSTRAINT goals_pkey PRIMARY KEY (id);
ALTER TABLE public.habit_exceptions ADD CONSTRAINT habit_exceptions_pkey PRIMARY KEY (id);
ALTER TABLE public.habit_logs ADD CONSTRAINT habit_logs_pkey PRIMARY KEY (id);
ALTER TABLE public.habits ADD CONSTRAINT habits_pkey PRIMARY KEY (id);
ALTER TABLE public.integrations ADD CONSTRAINT integrations_pkey PRIMARY KEY (id);
ALTER TABLE public.invoices ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);
ALTER TABLE public.moto_revenue ADD CONSTRAINT moto_revenue_pkey PRIMARY KEY (id);
ALTER TABLE public.notes ADD CONSTRAINT notes_pkey PRIMARY KEY (id);
ALTER TABLE public.pluggy_connections ADD CONSTRAINT pluggy_connections_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.project_checklist ADD CONSTRAINT project_checklist_pkey PRIMARY KEY (id);
ALTER TABLE public.projects ADD CONSTRAINT projects_pkey PRIMARY KEY (id);
ALTER TABLE public.runs ADD CONSTRAINT runs_pkey PRIMARY KEY (id);
ALTER TABLE public.shopping_items ADD CONSTRAINT shopping_items_pkey PRIMARY KEY (id);
ALTER TABLE public.sport_goals ADD CONSTRAINT sport_goals_pkey PRIMARY KEY (id);
ALTER TABLE public.sport_races ADD CONSTRAINT sport_races_pkey PRIMARY KEY (id);
ALTER TABLE public.sport_shopping ADD CONSTRAINT sport_shopping_pkey PRIMARY KEY (id);
ALTER TABLE public.sports ADD CONSTRAINT sports_pkey PRIMARY KEY (id);
ALTER TABLE public.studies ADD CONSTRAINT studies_pkey PRIMARY KEY (id);
ALTER TABLE public.study_files ADD CONSTRAINT study_files_pkey PRIMARY KEY (id);
ALTER TABLE public.system_files ADD CONSTRAINT system_files_pkey PRIMARY KEY (id);
ALTER TABLE public.systems ADD CONSTRAINT systems_pkey PRIMARY KEY (id);
ALTER TABLE public.task_comments ADD CONSTRAINT task_comments_pkey PRIMARY KEY (id);
ALTER TABLE public.task_projects ADD CONSTRAINT task_projects_pkey PRIMARY KEY (id);
ALTER TABLE public.task_recurrence ADD CONSTRAINT task_recurrence_pkey PRIMARY KEY (id);
ALTER TABLE public.tasks ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);
ALTER TABLE public.transactions ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);
ALTER TABLE public.user_settings ADD CONSTRAINT user_settings_pkey PRIMARY KEY (user_id);
ALTER TABLE public.user_sports ADD CONSTRAINT user_sports_pkey PRIMARY KEY (id);
ALTER TABLE public.vault_items ADD CONSTRAINT vault_items_pkey PRIMARY KEY (id);


-- ─── FOREIGN KEYS & UNIQUE CONSTRAINTS ────────────────────────────────

ALTER TABLE public.books ADD CONSTRAINT books_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.calendar_events ADD CONSTRAINT calendar_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.calendar_rotinas ADD CONSTRAINT calendar_rotinas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.calendar_tags ADD CONSTRAINT calendar_tags_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.chat_rate_limits ADD CONSTRAINT chat_rate_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.events ADD CONSTRAINT events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.fin_anos ADD CONSTRAINT fin_anos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.fin_anos ADD CONSTRAINT fin_anos_user_id_ano_key UNIQUE (user_id, ano);
ALTER TABLE public.fin_cartoes ADD CONSTRAINT fin_cartoes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.fin_categorias ADD CONSTRAINT fin_categorias_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.fin_investimentos ADD CONSTRAINT fin_investimentos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.fin_investimentos_movimentos ADD CONSTRAINT fin_investimentos_movimentos_investimento_id_fkey FOREIGN KEY (investimento_id) REFERENCES fin_investimentos(id) ON DELETE CASCADE;
ALTER TABLE public.fin_investimentos_movimentos ADD CONSTRAINT fin_investimentos_movimentos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.fin_lancamentos ADD CONSTRAINT fin_lancamentos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES fin_categorias(id);
ALTER TABLE public.fin_lancamentos ADD CONSTRAINT fin_lancamentos_cartao_id_fkey FOREIGN KEY (cartao_id) REFERENCES fin_cartoes(id);
ALTER TABLE public.fin_lancamentos ADD CONSTRAINT fin_lancamentos_pluggy_tx_id_key UNIQUE (pluggy_tx_id);
ALTER TABLE public.fin_lancamentos ADD CONSTRAINT fin_lancamentos_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES fin_lancamentos(id) ON DELETE CASCADE;
ALTER TABLE public.fin_lancamentos ADD CONSTRAINT fin_lancamentos_ano_id_fkey FOREIGN KEY (ano_id) REFERENCES fin_anos(id) ON DELETE CASCADE;
ALTER TABLE public.fin_lancamentos ADD CONSTRAINT fin_lancamentos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.fin_metas ADD CONSTRAINT fin_metas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.fin_previsao_config ADD CONSTRAINT fin_previsao_config_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.fin_recorrentes ADD CONSTRAINT fin_recorrentes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.fin_recorrentes ADD CONSTRAINT fin_recorrentes_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES fin_categorias(id);
ALTER TABLE public.goal_items ADD CONSTRAINT goal_items_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE;
ALTER TABLE public.goal_items ADD CONSTRAINT goal_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.goals ADD CONSTRAINT goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.habit_exceptions ADD CONSTRAINT habit_exceptions_habit_id_fkey FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE;
ALTER TABLE public.habit_exceptions ADD CONSTRAINT habit_exceptions_habit_id_exception_date_key UNIQUE (habit_id, exception_date);
ALTER TABLE public.habit_exceptions ADD CONSTRAINT habit_exceptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.habit_logs ADD CONSTRAINT habit_logs_habit_id_log_date_key UNIQUE (habit_id, log_date);
ALTER TABLE public.habit_logs ADD CONSTRAINT habit_logs_habit_id_fkey FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE;
ALTER TABLE public.habit_logs ADD CONSTRAINT habit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.habits ADD CONSTRAINT habits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.integrations ADD CONSTRAINT integrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.integrations ADD CONSTRAINT integrations_user_id_provider_key UNIQUE (user_id, provider);
ALTER TABLE public.invoices ADD CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.moto_revenue ADD CONSTRAINT moto_revenue_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.notes ADD CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.pluggy_connections ADD CONSTRAINT pluggy_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.pluggy_connections ADD CONSTRAINT pluggy_connections_item_id_key UNIQUE (item_id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.project_checklist ADD CONSTRAINT project_checklist_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.project_checklist ADD CONSTRAINT project_checklist_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.projects ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.runs ADD CONSTRAINT runs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.shopping_items ADD CONSTRAINT shopping_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.sport_goals ADD CONSTRAINT sport_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.sport_goals ADD CONSTRAINT sport_goals_linked_race_id_fkey FOREIGN KEY (linked_race_id) REFERENCES sport_races(id);
ALTER TABLE public.sport_races ADD CONSTRAINT sport_races_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.sport_shopping ADD CONSTRAINT sport_shopping_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.sports ADD CONSTRAINT sports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.studies ADD CONSTRAINT studies_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.study_files ADD CONSTRAINT study_files_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.study_files ADD CONSTRAINT study_files_study_id_fkey FOREIGN KEY (study_id) REFERENCES studies(id) ON DELETE SET NULL;
ALTER TABLE public.system_files ADD CONSTRAINT system_files_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.system_files ADD CONSTRAINT system_files_system_id_fkey FOREIGN KEY (system_id) REFERENCES systems(id) ON DELETE CASCADE;
ALTER TABLE public.systems ADD CONSTRAINT systems_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.task_comments ADD CONSTRAINT task_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.task_comments ADD CONSTRAINT task_comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE public.task_projects ADD CONSTRAINT task_projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.task_recurrence ADD CONSTRAINT task_recurrence_task_id_fkey FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE public.task_recurrence ADD CONSTRAINT task_recurrence_task_id_key UNIQUE (task_id);
ALTER TABLE public.tasks ADD CONSTRAINT tasks_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.tasks ADD CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES task_projects(id) ON DELETE SET NULL;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_settings ADD CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.user_sports ADD CONSTRAINT user_sports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.user_sports ADD CONSTRAINT user_sports_user_id_key_key UNIQUE (user_id, key);
ALTER TABLE public.vault_items ADD CONSTRAINT vault_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- ─── ÍNDICES (inclui duplicados existentes em produção — ver nota no topo) ─

CREATE INDEX idx_books_user ON public.books USING btree (user_id);
CREATE INDEX idx_books_user_id ON public.books USING btree (user_id);
CREATE INDEX calendar_events_user_id_start_at_end_at_idx ON public.calendar_events USING btree (user_id, start_at, end_at);
CREATE INDEX idx_calendar_events_user_start ON public.calendar_events USING btree (user_id, start_at);
CREATE INDEX idx_calendar_rotinas_user_id ON public.calendar_rotinas USING btree (user_id);
CREATE INDEX idx_calendar_tags_user_id ON public.calendar_tags USING btree (user_id);
CREATE INDEX idx_events_user_id ON public.events USING btree (user_id);
CREATE INDEX idx_fin_anos_user ON public.fin_anos USING btree (user_id);
CREATE INDEX idx_fin_cartoes_user ON public.fin_cartoes USING btree (user_id);
CREATE INDEX idx_fin_cartoes_user_id ON public.fin_cartoes USING btree (user_id);
CREATE INDEX idx_fin_categorias_user ON public.fin_categorias USING btree (user_id);
CREATE INDEX idx_fin_categorias_user_id ON public.fin_categorias USING btree (user_id);
CREATE INDEX fin_investimentos_user_id_tipo_idx ON public.fin_investimentos USING btree (user_id, tipo);
CREATE INDEX idx_fin_investimentos_user_data ON public.fin_investimentos USING btree (user_id, data_compra);
CREATE INDEX idx_fin_investimentos_movimentos_user_id ON public.fin_investimentos_movimentos USING btree (user_id);
CREATE INDEX fin_lancamentos_parent_id_idx ON public.fin_lancamentos USING btree (parent_id);
CREATE INDEX fin_lancamentos_user_id_ano_id_data_idx ON public.fin_lancamentos USING btree (user_id, ano_id, data);
CREATE INDEX idx_fin_lancamentos_ano ON public.fin_lancamentos USING btree (ano_id);
CREATE INDEX idx_fin_lancamentos_categoria ON public.fin_lancamentos USING btree (categoria_id) WHERE (categoria_id IS NOT NULL);
CREATE INDEX idx_fin_lancamentos_parent ON public.fin_lancamentos USING btree (parent_id) WHERE (parent_id IS NOT NULL);
CREATE INDEX idx_fin_lancamentos_user_data ON public.fin_lancamentos USING btree (user_id, data);
CREATE INDEX idx_lancamentos_user_cartao ON public.fin_lancamentos USING btree (user_id, cartao_id) WHERE (cartao_id IS NOT NULL);
CREATE INDEX idx_lancamentos_user_categoria ON public.fin_lancamentos USING btree (user_id, categoria_id);
CREATE INDEX idx_fin_metas_user ON public.fin_metas USING btree (user_id);
CREATE INDEX idx_fin_metas_user_id ON public.fin_metas USING btree (user_id);
CREATE INDEX idx_fin_previsao_config_user_id ON public.fin_previsao_config USING btree (user_id);
CREATE INDEX idx_fin_recorrentes_user_ativo ON public.fin_recorrentes USING btree (user_id) WHERE (ativo = true);
CREATE INDEX idx_fin_recorrentes_user_id ON public.fin_recorrentes USING btree (user_id);
CREATE INDEX idx_goal_items_goal ON public.goal_items USING btree (goal_id);
CREATE INDEX idx_goal_items_user_id ON public.goal_items USING btree (user_id);
CREATE INDEX idx_goals_user ON public.goals USING btree (user_id);
CREATE INDEX idx_goals_user_id ON public.goals USING btree (user_id);
CREATE INDEX idx_habit_exceptions_habit ON public.habit_exceptions USING btree (habit_id);
CREATE INDEX idx_habit_exceptions_user_id ON public.habit_exceptions USING btree (user_id);
CREATE INDEX idx_habit_logs_habit ON public.habit_logs USING btree (habit_id);
CREATE INDEX idx_habit_logs_user_date ON public.habit_logs USING btree (user_id, log_date);
CREATE INDEX idx_habit_logs_user_id ON public.habit_logs USING btree (user_id);
CREATE INDEX idx_habits_user ON public.habits USING btree (user_id);
CREATE INDEX idx_habits_user_id ON public.habits USING btree (user_id);
CREATE INDEX idx_integrations_user_provider ON public.integrations USING btree (user_id, provider);
CREATE INDEX idx_invoices_user ON public.invoices USING btree (user_id);
CREATE INDEX idx_invoices_user_id ON public.invoices USING btree (user_id);
CREATE INDEX idx_moto_revenue_user_date ON public.moto_revenue USING btree (user_id, revenue_date);
CREATE INDEX idx_moto_revenue_user_id ON public.moto_revenue USING btree (user_id);
CREATE INDEX idx_notes_user ON public.notes USING btree (user_id);
CREATE INDEX idx_notes_user_id ON public.notes USING btree (user_id);
CREATE INDEX idx_pluggy_connections_user_id ON public.pluggy_connections USING btree (user_id);
CREATE INDEX idx_project_checklist_project ON public.project_checklist USING btree (project_id);
CREATE INDEX idx_project_checklist_user_id ON public.project_checklist USING btree (user_id);
CREATE INDEX idx_projects_user ON public.projects USING btree (user_id);
CREATE INDEX idx_projects_user_id ON public.projects USING btree (user_id);
CREATE INDEX idx_runs_user_date ON public.runs USING btree (user_id, run_date);
CREATE INDEX idx_runs_user_id ON public.runs USING btree (user_id);
CREATE INDEX idx_shopping_items_user ON public.shopping_items USING btree (user_id);
CREATE INDEX idx_shopping_items_user_id ON public.shopping_items USING btree (user_id);
CREATE INDEX idx_sport_goals_user ON public.sport_goals USING btree (user_id);
CREATE INDEX idx_sport_goals_user_id ON public.sport_goals USING btree (user_id);
CREATE INDEX idx_sport_races_user_date ON public.sport_races USING btree (user_id, race_date);
CREATE INDEX idx_sport_races_user_id ON public.sport_races USING btree (user_id);
CREATE INDEX idx_sport_shopping_user ON public.sport_shopping USING btree (user_id);
CREATE INDEX idx_sport_shopping_user_id ON public.sport_shopping USING btree (user_id);
CREATE UNIQUE INDEX idx_sports_external_id ON public.sports USING btree (user_id, external_id) WHERE (external_id IS NOT NULL);
CREATE INDEX idx_sports_user_date ON public.sports USING btree (user_id, sport_date);
CREATE INDEX idx_sports_user_id ON public.sports USING btree (user_id);
CREATE INDEX idx_studies_user ON public.studies USING btree (user_id);
CREATE INDEX idx_studies_user_id ON public.studies USING btree (user_id);
CREATE INDEX idx_study_files_study ON public.study_files USING btree (study_id) WHERE (study_id IS NOT NULL);
CREATE INDEX idx_study_files_user_id ON public.study_files USING btree (user_id);
CREATE INDEX idx_system_files_system ON public.system_files USING btree (system_id);
CREATE INDEX idx_system_files_user_id ON public.system_files USING btree (user_id);
CREATE INDEX idx_systems_user ON public.systems USING btree (user_id);
CREATE INDEX idx_systems_user_id ON public.systems USING btree (user_id);
CREATE INDEX idx_task_comments_user_id ON public.task_comments USING btree (user_id);
CREATE INDEX idx_task_projects_user_id ON public.task_projects USING btree (user_id);
CREATE INDEX idx_tasks_parent ON public.tasks USING btree (parent_id) WHERE (parent_id IS NOT NULL);
CREATE INDEX idx_tasks_project ON public.tasks USING btree (project_id) WHERE (project_id IS NOT NULL);
CREATE INDEX idx_tasks_user_pending ON public.tasks USING btree (user_id, due_date) WHERE (completed_at IS NULL);
CREATE INDEX tasks_parent_id_idx ON public.tasks USING btree (parent_id);
CREATE INDEX tasks_project_id_idx ON public.tasks USING btree (project_id);
CREATE INDEX tasks_user_id_completed_at_due_date_idx ON public.tasks USING btree (user_id, completed_at, due_date);
CREATE INDEX idx_user_settings_user ON public.user_settings USING btree (user_id);
CREATE INDEX idx_vault_items_user ON public.vault_items USING btree (user_id);
CREATE INDEX idx_vault_items_user_id ON public.vault_items USING btree (user_id);


-- ─── ROW LEVEL SECURITY (habilitado em 100% das tabelas — 47/47) ──────

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_rotinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_anos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_cartoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_investimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_investimentos_movimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_previsao_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_recorrentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_taxas_economicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moto_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pluggy_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_races ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_shopping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_recurrence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rate_limits ENABLE ROW LEVEL SECURITY;

-- Policies (padrão own_* / auth.uid() = user_id em todas as tabelas de usuário)

CREATE POLICY "own_delete" ON public.books AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.books AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.books AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.books AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own" ON public.calendar_events AS PERMISSIVE FOR ALL TO public USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "own" ON public.calendar_rotinas AS PERMISSIVE FOR ALL TO public USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "own" ON public.calendar_tags AS PERMISSIVE FOR ALL TO public USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "own_delete" ON public.events AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.events AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.events AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.events AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own rows" ON public.fin_anos AS PERMISSIVE FOR ALL TO public USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "own rows" ON public.fin_cartoes AS PERMISSIVE FOR ALL TO public USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "own rows" ON public.fin_categorias AS PERMISSIVE FOR ALL TO public USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "own" ON public.fin_investimentos AS PERMISSIVE FOR ALL TO public USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "own" ON public.fin_investimentos_movimentos AS PERMISSIVE FOR ALL TO public USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "own rows" ON public.fin_lancamentos AS PERMISSIVE FOR ALL TO public USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "own rows" ON public.fin_metas AS PERMISSIVE FOR ALL TO public USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "own rows" ON public.fin_previsao_config AS PERMISSIVE FOR ALL TO public USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "own rows" ON public.fin_recorrentes AS PERMISSIVE FOR ALL TO public USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "auth_write" ON public.fin_taxas_economicas AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "public_read" ON public.fin_taxas_economicas AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "own_delete" ON public.goal_items AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.goal_items AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.goal_items AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.goal_items AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_delete" ON public.goals AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.goals AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.goals AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.goals AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_delete" ON public.habit_exceptions AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.habit_exceptions AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.habit_exceptions AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.habit_exceptions AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_delete" ON public.habit_logs AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.habit_logs AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.habit_logs AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.habit_logs AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_delete" ON public.habits AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.habits AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.habits AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.habits AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_delete" ON public.integrations AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.integrations AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.integrations AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.integrations AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_delete" ON public.invoices AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.invoices AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.invoices AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.invoices AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_delete" ON public.moto_revenue AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.moto_revenue AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.moto_revenue AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.moto_revenue AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_delete" ON public.notes AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.notes AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.notes AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.notes AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own rows" ON public.pluggy_connections AS PERMISSIVE FOR ALL TO public USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "own_delete" ON public.profiles AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = id));
CREATE POLICY "own_insert" ON public.profiles AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = id));
CREATE POLICY "own_select" ON public.profiles AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = id));
CREATE POLICY "own_update" ON public.profiles AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = id));
CREATE POLICY "own_delete" ON public.project_checklist AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.project_checklist AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.project_checklist AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.project_checklist AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_delete" ON public.projects AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.projects AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.projects AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.projects AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_delete" ON public.runs AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.runs AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.runs AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.runs AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_delete" ON public.shopping_items AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.shopping_items AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.shopping_items AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.shopping_items AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_delete" ON public.sport_goals AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.sport_goals AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.sport_goals AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.sport_goals AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_delete" ON public.sport_races AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.sport_races AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.sport_races AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.sport_races AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_delete" ON public.sport_shopping AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.sport_shopping AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.sport_shopping AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.sport_shopping AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_delete" ON public.sports AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.sports AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.sports AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.sports AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_delete" ON public.studies AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.studies AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.studies AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.studies AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_delete" ON public.study_files AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.study_files AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.study_files AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.study_files AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_delete" ON public.system_files AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.system_files AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.system_files AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.system_files AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_delete" ON public.systems AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.systems AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.systems AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.systems AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own" ON public.task_comments AS PERMISSIVE FOR ALL TO public USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "own" ON public.task_projects AS PERMISSIVE FOR ALL TO public USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "own" ON public.task_recurrence AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1 FROM tasks t WHERE ((t.id = task_recurrence.task_id) AND (t.user_id = auth.uid())))));
CREATE POLICY "own" ON public.tasks AS PERMISSIVE FOR ALL TO public USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "own_delete" ON public.transactions AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.transactions AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.transactions AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.transactions AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own" ON public.user_settings AS PERMISSIVE FOR ALL TO public USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "own" ON public.user_sports AS PERMISSIVE FOR ALL TO public USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "own_delete" ON public.vault_items AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_insert" ON public.vault_items AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own_select" ON public.vault_items AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own_update" ON public.vault_items AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
