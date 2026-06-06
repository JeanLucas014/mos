# DATABASE.md — JL OS (Supabase / Postgres)

Schema completo para o sistema funcionar de verdade. Inclui tabelas dos 14 módulos,
políticas RLS e seeds com os dados de exemplo do protótipo.

> **Princípio:** toda tabela tem `user_id uuid references auth.users` e RLS ativa, para
> o sistema já nascer multi-user e seguro. No MVP single-user, o Jean é o único `user_id`.

---

## 0. Setup base

Rode no **SQL Editor** do Supabase, na ordem deste arquivo. Antes de tudo:

```sql
-- extensão para uuid
create extension if not exists "pgcrypto";

-- função helper: updated_at automático
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
```

Padrão repetido em todas as tabelas (não vou repetir os comentários):
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()` + trigger `set_updated_at`

E o bloco de RLS (troque `TABELA`):
```sql
alter table TABELA enable row level security;
create policy "own_select" on TABELA for select using (auth.uid() = user_id);
create policy "own_insert" on TABELA for insert with check (auth.uid() = user_id);
create policy "own_update" on TABELA for update using (auth.uid() = user_id);
create policy "own_delete" on TABELA for delete using (auth.uid() = user_id);
```

> Dica: para `user_id` preencher sozinho, defina `default auth.uid()` na coluna.

---

## 1. profiles (perfil do usuário)
```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Jean',
  city text default 'Belo Horizonte',
  marathon_goal text default 'sub-3h',
  created_at timestamptz not null default now()
);
```
Usado na saudação ("Bom dia, **Jean**") e no badge do hero.

---

## 2. tasks (Tarefas & To-do · módulo 3)
```sql
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  project text,                          -- ex: 'corrida', 'nata', 'pessoal'
  done boolean not null default false,
  due_date date,
  position int default 0,                -- para reordenar
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```
Telas: aparece em **Tarefas** e resumida no **Dashboard** ("X pendentes").

---

## 3. habits + habit_logs (Hábitos · módulo 6)
```sql
create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,                    -- 'Correr', 'Ler 30min'...
  created_at timestamptz not null default now()
);

create table habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  habit_id uuid not null references habits(id) on delete cascade,
  log_date date not null,
  unique (habit_id, log_date)            -- 1 marca por dia por hábito
);
```
O **streak** (dias seguidos) é calculado no cliente/SQL a partir de `habit_logs`.
O protótipo mostra a semana (seg→dom) com quadradinhos preenchidos.

---

## 4. projects (Projetos · módulo 4)
```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  meta text,                             -- 'cliente · entrega 04 jun'
  status text not null default 'ativo',  -- 'em dev'|'início'|'ativo'|'pausado'|'live'
  progress int not null default 0,       -- 0..100
  delivered boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```
Status mapeia para `<Pill>`: em dev=azul, início=âmbar, ativo/live=verde, pausado=cinza.

---

## 5. goals (Metas · módulo 5)
```sql
create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  progress int not null default 0,       -- 0..100
  label text,                            -- ex '11 / 24', 'R$ 71k'
  created_at timestamptz not null default now()
);
```

---

## 6. shopping_items (Lista de compras · módulo 7)
```sql
create table shopping_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
```

---

## 7. transactions (Financeiro · módulo 8)
```sql
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  description text not null,
  amount_cents bigint not null,          -- positivo=entrada, negativo=saída
  kind text not null default 'out',      -- 'in' | 'out'
  category text,
  occurred_at date not null default current_date,
  created_at timestamptz not null default now()
);
```
**Sempre em centavos.** Os tiles (Saldo, Entradas, Saídas) são agregações desta tabela.
O App Finanças que o Jean já tem pode ser a fonte — ver `INTEGRATIONS.md` §7 (opcional).

---

## 8. invoices (Faturamento · módulo 9)
```sql
create table invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  service text not null,                 -- 'Plugin reservas v2.1'
  client text not null,                  -- 'Super Kart BH'
  amount_cents bigint not null,
  status text not null default 'enviado',-- 'enviado'|'em dev'|'aprovado'|'recorrente'|'pago'
  due_date date,
  created_at timestamptz not null default now()
);
```
"Total a receber" = soma de `amount_cents` onde `status != 'pago'`.

---

## 9. notes (Notas · módulo 10)
```sql
create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text default 'Sem título',
  body text default '',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
```
No protótipo é um único bloco com autosave; no real, suportar várias notas. **Autosave:**
debounce de ~500ms → `update`. Mostrar "✓ salvo" como no protótipo.

---

## 10. books (Biblioteca · módulo 11)
```sql
create table books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  author text,
  status text not null default 'quero_ler', -- 'lido'|'lendo'|'quero_ler'
  cover_url text,                            -- Supabase Storage (bucket 'covers')
  progress int default 0,                    -- 0..100 para 'lendo'
  created_at timestamptz not null default now()
);
```

---

## 11. studies + study_files (Estudos · módulo 12)
```sql
create table studies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,                    -- 'React Avançado'
  meta text,                             -- 'módulo 4 de 8 · 50%'
  progress int default 0,
  status text default 'ativo',           -- 'ativo'|'no prazo'|'concluido'
  created_at timestamptz not null default now()
);

create table study_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  study_id uuid references studies(id) on delete set null,
  name text not null,
  kind text default 'PDF',               -- 'PDF'|'DOC'|'MD'...
  source text default 'drive',           -- 'drive'|'storage'|'notion'
  external_url text,
  updated_at timestamptz not null default now()
);
```
`study_files` pode espelhar arquivos do Google Drive — ver `INTEGRATIONS.md` §2.

---

## 12. vault_items (Senhas · módulo 13) — SENSÍVEL
```sql
create table vault_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  service text not null,                 -- 'GitHub'
  username text,                         -- guardado em claro (não é o segredo)
  password_cipher text not null,         -- senha CRIPTOGRAFADA no cliente
  password_iv text not null,             -- IV/nonce do AES-GCM
  created_at timestamptz not null default now()
);
```
**NUNCA** guardar a senha em texto puro. Criptografar no cliente (AES-GCM via Web Crypto)
com uma chave derivada de um master password do Jean — detalhes em `INTEGRATIONS.md` §6.
O backend só vê o ciphertext.

---

## 13. runs (Corridas · módulo 14)
```sql
create table runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null default 'easy',     -- 'long'|'interval'|'easy'|'tempo'
  distance_m int not null,               -- metros
  duration_s int not null,               -- segundos (para calcular pace)
  pace_label text,                       -- '5:20/km' (ou calcular)
  run_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);
```
Tiles de Corridas (volume do mês, pace médio, nº de treinos) = agregações desta tabela.
Pode ser alimentada por integração com Strava no futuro (fora do escopo agora).

---

## 14. events (Agenda · módulo 2)
```sql
create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  category text default 'geral',         -- 'treino'|'reuniao'|'estudo'|'geral' → cor da barra
  source text default 'local',           -- 'local'|'gcal'
  external_id text,                      -- id do Google Calendar (para sync)
  created_at timestamptz not null default now()
);
```
Categoria → cor da barrinha no protótipo: treino=verde, reunião/geral=azul, estudo=âmbar.
Eventos com `source='gcal'` vêm da integração — ver `INTEGRATIONS.md` §3.

---

## 15. integrations (Integrações · módulo +)
```sql
create table integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  provider text not null,                -- 'drive'|'notion'|'gcal'|'vercel'|'github'|'supabase'
  connected boolean not null default false,
  -- tokens NÃO ficam aqui se possível; preferir Supabase Vault / Edge Function secrets
  access_token_cipher text,
  refresh_token_cipher text,
  meta jsonb default '{}',               -- escopos, conta conectada, etc
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);
```
Ver `INTEGRATIONS.md` para o fluxo OAuth de cada provider e onde guardar tokens com segurança.

---

## 16. Seeds (dados de exemplo = os do protótipo)

Rode depois de criar seu usuário (pegue o uuid em Authentication → Users). Exemplos:

```sql
-- substitua :uid pelo seu auth user id
insert into tasks (user_id, title, project, done) values
(:uid,'Treino longo — 18km','corrida',false),
(:uid,'Deploy v2.1 Super Kart','nata',false),
(:uid,'Revisar proposta AWC Airsoft','nata',true),
(:uid,'Ler 30 páginas','pessoal',false),
(:uid,'Atualizar landing JL OS','jl os',true);

insert into habits (user_id, name) values
(:uid,'Correr'),(:uid,'Ler 30min'),(:uid,'3L de água'),(:uid,'Commit diário');

insert into projects (user_id,name,meta,status,progress,delivered) values
(:uid,'Super Kart — Reservas v2.1','cliente · entrega 04 jun','em dev',72,false),
(:uid,'AWC Airsoft — Loja Shopify','e-commerce · proposta aprovada','início',18,false),
(:uid,'Nata System — CRM','produto próprio','ativo',88,false),
(:uid,'Jean System','produto próprio · MVP','pausado',30,false);

insert into goals (user_id,name,progress,label) values
(:uid,'Maratona sub-3h',74,'74%'),
(:uid,'Ler 24 livros',46,'11 / 24'),
(:uid,'Lançar o Jean System',30,'30%'),
(:uid,'10 clientes Nata recorrentes',70,'7 / 10'),
(:uid,'Faturar R$ 120k no ano',59,'R$ 71k');

insert into invoices (user_id,service,client,amount_cents,status) values
(:uid,'Plugin reservas v2.1','Super Kart BH',240000,'enviado'),
(:uid,'Loja Shopify','AWC Airsoft',320000,'em dev'),
(:uid,'Landing page','Studio Bloom',110000,'aprovado'),
(:uid,'Manutenção mensal','Nata clientes',70000,'recorrente');

insert into books (user_id,title,author,status) values
(:uid,'Hábitos Atômicos','James Clear','lido'),
(:uid,'Pode Doer','Alex Hutchinson','lendo'),
(:uid,'Clean Code','Robert C. Martin','lido'),
(:uid,'A Coragem de Ser Imperfeito','Brené Brown','quero_ler'),
(:uid,'Refactoring','Martin Fowler','quero_ler');
```
(Repita o padrão para `shopping_items`, `runs`, `events`, `studies` usando os valores
visíveis em `design_reference/Dashboard.html`.)

---

## 17. Views úteis (agregações do Dashboard)
Crie views para o Dashboard não recalcular no cliente:
```sql
create view v_dashboard_summary as
select
  auth.uid() as user_id,
  (select count(*) from tasks where not done) as open_tasks,
  (select coalesce(sum(distance_m),0)/1000 from runs
     where date_trunc('month',run_date)=date_trunc('month',current_date)) as km_month,
  (select coalesce(sum(amount_cents),0) from invoices where status<>'pago') as receivable_cents;
```
(Views respeitam a RLS das tabelas base.)
