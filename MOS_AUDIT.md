# MOS — Auditoria Completa

**Data:** 2026-07-13
**Versão analisada:** commit `648afbf` (branch `main`)
**Total de problemas encontrados:** 54 (8 🔴 críticos · 24 🟡 médios · 22 🔵 melhorias)
**Escopo lido:** configs, 3 migrations, `db.ts`, core (`main`/`App`/`index.css`/`lib`/`contexts`/`stores`), hooks principais, layout, 19 Edge Functions (4 lidas na íntegra + grep em todas), amostra ampla de páginas. Métricas obtidas por `grep`/`wc` em todo o `src`.

---

## Resumo Executivo

O MOS é um app **ambicioso e surpreendentemente completo** para um projeto pessoal: 14+ módulos, PWA instalável, criptografia client-side real no cofre de senhas, MFA nativo, chat com IA contextualizada por dados reais, e integrações OAuth (Strava, Google Calendar, GitHub, Vercel, Pluggy/Open Finance). A camada de segurança das Edge Functions é **melhor do que a média** — cada função valida o JWT antes de usar o service role e escopa as queries por `user.id`. Não há secrets hardcoded. O modelo de IA (`claude-haiku-4-5`) está correto e atualizado.

Porém, o projeto carrega **dívida técnica estrutural que já dói e vai doer muito mais com crescimento**. Três problemas se destacam:

1. **`src/types/db.ts` está profundamente desatualizado.** Ele documenta um schema que não existe mais (tabela `events` em vez de `calendar_events`, `tasks` com colunas antigas, sem `user_settings`/`task_projects`/`fin_previsao_config`, sem colunas `pago`/`is_previsao`). Para contornar, o código usa `as any` **223 vezes em 42 arquivos** — o que efetivamente **desliga o TypeScript** na camada de dados, exatamente onde os bugs são mais caros. Regenerar os tipos é a maior alavanca de qualidade do projeto.

2. **Zero resiliência a falhas de runtime.** Não existe nenhum `ErrorBoundary` no app inteiro. Qualquer exceção de render em qualquer página derruba a aplicação inteira para uma tela branca.

3. **O banco não tem índices declarados** e cada query filtra por `user_id` (via RLS). Funciona liso com 1 usuário; vira seq-scan em toda tabela com 10.000.

Nada disso é fatal hoje — o app funciona e o dono é o usuário principal. Mas se a intenção é escalar para outros usuários, os itens 🔴 abaixo precisam ser resolvidos **antes** de captar base. A prioridade nº 1 (custo/benefício imbatível) é **regenerar `db.ts`** e adicionar **um `ErrorBoundary`** — juntos, algumas horas de trabalho que elevam drasticamente a robustez.

---

## Score por Dimensão

| Dimensão | Score | Status |
|---|---|---|
| Bugs e Erros | 5/10 | 🟡 |
| Banco de dados e Segurança | 6/10 | 🟡 |
| Performance | 5/10 | 🟡 |
| Código morto / Dívida técnica | 3/10 | 🔴 |
| Arquitetura | 5/10 | 🟡 |
| UX e Design | 7/10 | 🟢 |
| Mobile e Responsividade | 6/10 | 🟡 |
| Edge Functions e Integrações | 7/10 | 🟢 |
| vs Concorrentes | 6/10 | 🟡 |
| Roadmap | — | — |

---

## 🔴 Crítico — Corrigir Imediatamente

### C1. `db.ts` desatualizado → 223 `as any` desligam o TypeScript na camada de dados
- **Arquivos:** `src/types/db.ts` (schema inteiro) + 42 arquivos consumidores.
- **Evidência:** `db.ts` define a tabela `tasks` com `{ title, project, done, due_date, priority, position }`, mas o código real (`src/pages/Tarefas/index.tsx`, `src/hooks/useDashboard.ts:63`) consulta `parent_id`, `completed_at`, `project_id`, `ordem`, `due_time`, `description`. A tabela `task_projects` (usada em Tarefas), `user_settings` (usada em `useUserSettings.ts`, `useNotifications.ts`), `calendar_events` (usada na Agenda roteada e no dashboard) e `fin_previsao_config` **nem existem** no `db.ts`. As colunas `pago` e `is_previsao` de `fin_lancamentos` (usadas em `useDashboard.ts:404` e `ConfigTab.tsx`) também faltam.
- **Impacto:** o TypeScript não consegue validar **nenhuma** query — nomes de coluna errados, tipos errados e tabelas inexistentes passam batido em build. Bugs de schema só aparecem em produção. É a causa raiz da maior parte dos outros bugs.
- **Como corrigir:**
  ```bash
  npx supabase gen types typescript --linked > src/types/db.ts
  ```
  Depois, remover os `as any` arquivo por arquivo (comece pelos hooks e pelo `MesTab`/`ConfigTab`, que concentram 37 casts) e deixar o compilador apontar as divergências reais. Meta realista: sair de 223 para < 20 casts legítimos.

### C2. Nenhum `ErrorBoundary` no app inteiro → um erro de render = tela branca total
- **Arquivos:** `src/App.tsx`, `src/components/layout/AppShell.tsx` (confirmado: `grep ErrorBoundary` retorna nada).
- **Impacto:** qualquer exceção em qualquer página (ex.: um `.find()` em `undefined`, um dado malformado do Supabase) desmonta a árvore React inteira. O usuário vê branco, sem recuperação além de recarregar.
- **Como corrigir:** criar `src/components/ErrorBoundary.tsx` (class component com `getDerivedStateFromError`) e envolver o `<Outlet />` no `AppShell`, além de um boundary externo no `App`.
  ```tsx
  class ErrorBoundary extends React.Component<{children: ReactNode}, {err: Error | null}> {
    state = { err: null }
    static getDerivedStateFromError(err: Error) { return { err } }
    componentDidCatch(err: Error, info: React.ErrorInfo) { console.error(err, info) }
    render() {
      if (this.state.err) return <FallbackUI onReset={() => this.setState({ err: null })} />
      return this.props.children
    }
  }
  ```
  No `AppShell`: `<main>...<ErrorBoundary><Outlet /></ErrorBoundary>...</main>` — assim um crash de página não derruba a navegação.

### C3. Banco sem índices → não escala além de dezenas de usuários
- **Evidência:** `grep "create index"` nas 3 migrations retorna vazio. Postgres **não** indexa colunas de FK automaticamente.
- **Impacto:** toda query passa por RLS (`auth.uid() = user_id`) e filtra por `user_id`; sem índice, é seq-scan na tabela inteira. Com 1 usuário é instantâneo; com 10.000 usuários e milhares de `fin_lancamentos`/`sports`/`tasks` cada, as queries do dashboard degradam para segundos.
- **Como corrigir:** migration com índices nas colunas de filtro mais quentes:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_tasks_user           ON tasks(user_id) WHERE completed_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_lancamentos_user_data ON fin_lancamentos(user_id, data);
  CREATE INDEX IF NOT EXISTS idx_sports_user_date       ON sports(user_id, sport_date);
  CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date   ON habit_logs(user_id, log_date);
  CREATE INDEX IF NOT EXISTS idx_calendar_user_start    ON calendar_events(user_id, start_at);
  CREATE INDEX IF NOT EXISTS idx_recorrentes_user       ON fin_recorrentes(user_id) WHERE ativo = true;
  ```

### C4. Código morto pesado versionado no git (inclui uma implementação de Agenda inteira, obsoleta)
- **Arquivos:**
  - `Dashboard.jsx` na raiz — **188 KB** (protótipo antigo, versionado).
  - `src/pages/AgendaPage.tsx` — **1104 linhas**, **não importado** por `App.tsx` (a Agenda roteada é `src/pages/Agenda/index.tsx`). Pior: usa a tabela **`events`** (colunas `starts_at`/`ends_at`/`category`), enquanto a Agenda real usa **`calendar_events`** (`start_at`/`end_at`/`color`). Manter os dois confunde e induz a bugs.
  - `src/pages/TasksPage.tsx` — **366 linhas**, não importado (a rota usa `src/pages/Tarefas/index.tsx`).
  - `financeiro-ref/` (188 KB) e `design_handoff_jl_os/` (224 KB) — material de referência versionado.
- **Impacto:** ~600 KB de ruído no repo; risco real de alguém editar o arquivo errado (ex.: mexer em `AgendaPage.tsx` achando que é a Agenda ativa).
- **Como corrigir:** `git rm` de `Dashboard.jsx`, `src/pages/AgendaPage.tsx`, `src/pages/TasksPage.tsx`; mover `financeiro-ref/` e `design_handoff_jl_os/` para fora do repo (ou `.gitignore`). Rodar `tsc --noEmit` depois para confirmar que nada quebrou.

### C5. Onboarding pode nunca disparar para novos usuários
- **Arquivos:** `src/components/layout/AppShell.tsx:15` + `src/hooks/useUserSettings.ts:22-27`.
- **Problema:** `useUserSettings` retorna, quando **não há linha** (`PGRST116`), um default com `onboarding_completed: true`. O `AppShell` só redireciona para `/onboarding` quando `settings.onboarding_completed === false`. Logo, um usuário recém-criado **sem linha** em `user_settings` recebe `true` e **pula o onboarding**. Só funciona se o fluxo de signup criar a linha com `false` — o que não está garantido no código lido.
- **Impacto:** novos usuários potencialmente caem direto no dashboard vazio, sem escolher módulos.
- **Como corrigir:** o default para "sem linha" deve ser `onboarding_completed: false`, OU garantir (trigger no signup / Edge Function) que toda conta nasce com uma linha `user_settings` com `false`.

### C6. Timezone: "hoje" calculado em UTC quebra dados no fuso do Brasil (UTC-3)
- **Arquivos (padrão `new Date().toISOString().slice(0,10)`):** `useDashboard.ts:28,336,391`, `useNotifications.ts:74`, `Tarefas/index.tsx` (várias), Edge `mos-chat/index.ts:35`, entre outros.
- **Problema:** `toISOString()` converte para UTC. Em UTC-3, todo horário local ≥ 21:00 já é o "dia seguinte" em UTC. Então, das 21h à meia-noite, "hoje" vira amanhã.
- **Impacto concreto:** hábitos marcados à noite contam no dia errado (streaks quebram — `calcStreak` em `useDashboard.ts:31`), tarefas viram "vencidas" cedo demais, o card financeiro do mês inclui/exclui lançamentos na virada, notificações de "para hoje" ficam erradas à noite.
- **Como corrigir:** centralizar num helper que respeita o fuso local:
  ```ts
  export const todayLocal = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }
  ```
  Substituir **todos** os `toISOString().slice(0,10)` que representam "data local" por `todayLocal()`. (Manter ISO/UTC apenas onde se compara com `timestamptz`, como `start_at`.)

### C7. Colisão de cache key no React Query: `['books']` com dois shapes diferentes
- **Arquivos:** `useDashboard.ts:288` (`useDashBooks`, `select('*')`) e `useDashboard.ts:363` (`useDashEstudos`, `select('id, status, progress')`) — **mesma** queryKey `['books']`.
- **Problema:** o React Query deduplica por chave. O primeiro a montar popula o cache; o segundo recebe o shape do primeiro. Se `useDashEstudos` ganhar a corrida, `useDashBooks` recebe objetos só com `{id, status, progress}` — sem `title`, `author`, `cover_url` etc. — e a UI de biblioteca no dashboard renderiza vazio/quebrado de forma **intermitente** (depende da ordem de montagem).
- **Como corrigir:** usar chaves distintas por shape — ex.: `['books']` (completo) e `['books','dash-estudos']` (parcial) — ou padronizar num único `select('*')` e derivar em memória.

### C8. `.single()` usado 35× lança erro quando não há linha
- **Arquivos:** 35 ocorrências; caso claro em `useNotifications.ts:46` (`user_settings ... .single()`), `Agenda/index.tsx:143,160,207,223`.
- **Problema:** `.single()` retorna erro se 0 (ou >1) linhas. Em `useNotificationPrefs`, um usuário sem linha de settings faz a query **lançar**, e como não há tratamento de `PGRST116`, o hook entra em estado de erro (o sino de notificações quebra). Vários `.single()` na Agenda assumem que a linha existe.
- **Como corrigir:** trocar por `.maybeSingle()` sempre que "0 linhas" for um estado válido, e tratar `null`. (`useUserSettings.ts:22` já faz isso corretamente ignorando `PGRST116` — usar como referência.)

---

## 🟡 Médio — Corrigir em Breve

### M1. Notificações: waterfall de 6 queries sequenciais
`useNotifications.ts:67-213` faz até 6 `await` em série (tarefas vencidas, hoje, eventos, contas vencidas, contas hoje, hábitos). Deveriam ir em `Promise.all`. Além disso, o resultado depende de `prefs` que **não está na queryKey** (`['app_notifications', user?.id]`) → mudar preferências não re-dispara a query de forma confiável. **Fix:** paralelizar com `Promise.all` e incluir um hash de `prefs` na key.

### M2. Logs de debug em produção
`useDashboard.ts:155` (`console.log('[dash_invoices]', ...)`) e `strava-sync/index.ts` (linhas 101, 178, 181-188, 237) logam **dados do usuário** (atividades, amostras de treino) no console/Edge logs. **Fix:** remover ou gate por `if (Deno.env.get('DEBUG'))`.

### M3. Strava: só importa as últimas 600 atividades e ignora rate limits
`strava-sync/index.ts:90` — `MAX_PAGES=3 × PER_PAGE=200`. Atletas com histórico maior perdem atividades antigas. E não há tratamento do rate limit da Strava (100 req/15min, 1000/dia). A lógica de **refresh de token está correta** (linhas 150-174). **Fix:** paginar até esvaziar (com teto de segurança) e tratar HTTP 429 com backoff.

### M4. Edge Functions sem rate limiting nem validação de tamanho de payload
Nenhuma função limita chamadas. `mos-chat/index.ts:28` recebe `messages` do cliente e repassa **direto** para a Anthropic sem limitar quantidade/tamanho → um cliente malicioso pode inflar custo de API (cada chamada usa service role + Claude). **Fix:** validar `messages.length`, truncar histórico, e aplicar rate limit por usuário (tabela de contadores ou KV).

### M5. Identificação de admin inconsistente e hardcoded
`admin-stats/index.ts:9` usa `JEAN_ID` (UUID); `invite-user/index.ts:3` e `SettingsPage.tsx:14` usam `ADMIN_EMAIL`. Dois mecanismos para o mesmo conceito, ambos hardcoded. **Fix:** padronizar (idealmente uma coluna `is_admin`/claim no JWT) — no mínimo, uma constante única compartilhada.

### M6. `send-support` fora do `config.toml`
A função criada em `supabase/functions/send-support/` não aparece em `supabase/config.toml` (que lista só 4 funções com `verify_jwt=false`). O deploy fica não-versionado e o `verify_jwt` não é rastreado. **Fix:** adicionar a entrada correspondente (a função valida o JWT internamente, então documentar a decisão).

### M7. PBKDF2 com 100k iterações no cofre (abaixo do recomendado)
`src/lib/crypto.ts:18` — `PBKDF2_ITERATIONS = 100_000`. OWASP (2023) recomenda **600k** para PBKDF2-SHA256. O design geral do cofre é bom (AES-GCM, chave só em RAM, não-extraível), mas a derivação está fraca. **Fix:** subir para 600k (avaliar impacto de UX no desbloqueio; ~alguns 100ms é aceitável).

### M8. Componentes gigantes misturando dados + UI
`MesTab.tsx` (1568 linhas), `InvestimentosTab.tsx` (1199), `LibraryPage.tsx` (1072), `InvoicesPage.tsx` (973), `DashboardPage.tsx` (950), `ConfigTab.tsx` (930), `SportsPage.tsx` (921), `SettingsPage.tsx` (911). Fetch, mutações, estado e render num só arquivo. **Fix incremental:** extrair a camada de dados para hooks (`useMesData`, etc.) e quebrar sub-seções em componentes. Priorizar `MesTab` e `InvestimentosTab`.

### M9. Sem code-splitting — bundle único grande
`App.tsx` importa as ~25 páginas de forma **estática** (nenhum `React.lazy`/`Suspense` — confirmado por grep). `recharts` (biblioteca pesada de gráficos) entra no bundle inicial mesmo para quem abre só as Notas. **Fix:** `const DashboardPage = lazy(() => import('./pages/DashboardPage'))` etc., com um `<Suspense fallback>` no shell. Ganho grande de First Load.

### M10. `staleTime` inconsistente / refetch agressivo
Global é 60s (`queryClient.ts:7`), mas vários hooks forçam `staleTime: 0` + `refetchInterval` (`useDashboard.ts:326-328`, `385,424`; `useUserSettings.ts:29`). O dashboard refaz queries a cada 60s e no foco de janela. **Fix:** revisar caso a caso; dados financeiros do mês não precisam de refetch a cada minuto.

### M11. Viewport bloqueia zoom (acessibilidade)
`index.html:6` — `maximum-scale=1.0, user-scalable=no`. Impede pinch-zoom, violando WCAG 1.4.4. O `index.css:127-135` já força `font-size:16px` em inputs para evitar o auto-zoom do iOS, então o `user-scalable=no` é redundante e prejudica acessibilidade. **Fix:** remover `maximum-scale` e `user-scalable=no`.

### M12. Onboarding/settings sem `user_id` na cache key
`useUserSettings.ts:13` usa key fixa `['user_settings']` sem `user.id`. Em troca de conta (logout→login), dados podem vazar do cache anterior até invalidar. **Fix:** `['user_settings', user?.id]`.

### M13-M24 (resumidos)
- **M13.** `AuthContext.tsx:19` — `getSession()` sem `.catch`; falha de rede deixa `loading` preso? (é resolvido, mas erro silencioso).
- **M14.** Registro duplo de service worker: `VitePWA` (vite.config) **e** registro manual em `main.tsx:11`. Risco de SW concorrentes/cache travado. Consolidar num só.
- **M15.** `useDashHabits` busca **todos** os `habit_logs` sem filtro de data (`useDashboard.ts:89`) — cresce indefinidamente. Filtrar por janela (ex.: últimos 90 dias).
- **M16.** `strava-sync` sobrecarrega o campo `notes` com `strava:<id>` para dedupe — deveria ser uma coluna `external_id` indexada (já existe padrão em `events.external_id`).
- **M17.** Mapeamento de esporte questionável: `Yoga`/`Pilates`/`Elliptical` → `musculacao/full_body` (`strava-sync:54-60`). Distorce estatísticas de musculação.
- **M18.** 38 marcadores `TODO/FIXME/HACK` no `src` — triar e converter em issues.
- **M19.** `useUserSettings.toggleModule` faz `upsert` sem `user_id` explícito (`useUserSettings.ts:41`), dependendo do default `auth.uid()`. Frágil se o default do banco mudar.
- **M20.** Sem nenhum teste automatizado no projeto (nenhum arquivo `*.test.*`/`*.spec.*`). Regressões só aparecem em produção.
- **M21.** `RotinaTab`/recorrência da Agenda (`Agenda/index.tsx`, 17 `as any`) — lógica de expandir recorrência sem tipos; alto risco.
- **M22.** Mensagens de erro cruas para o usuário: vários `setError(e.message)` (ex.: `SuporteTab`, `TwoFactorSection`, `IntegrationsPage`) expõem texto técnico do Supabase.
- **M23.** `fin_lancamentos.valor` é `number | null` e somado com `Number(r.valor)` em vários lugares — nulls silenciosos podem virar `0` ou `NaN` conforme o caminho.
- **M24.** Storage bucket `systems` é **público** (`20260610_round2.sql:71`) com leitura liberada a qualquer um (`systems_public_read` sem checar dono). Thumbnails de sistemas são acessíveis publicamente por URL — ok se intencional, revisar se não.

---

## 🔵 Melhorias — Quando Possível

- **B1.** Extrair um helper único de datas (resolve C6 e centraliza formatação pt-BR).
- **B2.** Índices compostos adicionais conforme telas quentes (Extrato, Investimentos).
- **B3.** Padronizar tokens de cor: ainda há `#0EA5E9`, `#555`, `#aaa` hardcoded em vários lugares apesar do design system em `tailwind.config.ts`/`index.css` (ex.: `ConfigTab`, `MesTab`, `Tarefas/index`). Migrar para `text-ink-*`/`bg-bg-*`/`brand`.
- **B4.** Empty states e error states consistentes — vários módulos têm loading, mas empty/error variam de estilo.
- **B5.** `date-fns` é usado praticamente só no `Topbar` — avaliar se o custo compensa (com B1, dá pra remover).
- **B6.** Consolidar as duas convenções de toggle switch (uma em `SettingsPage.Toggle`, outra inline em `NotificacoesTab`).
- **B7.** Adicionar `<meta name="description">` e Open Graph tags no `index.html` (SEO/compartilhamento).
- **B8.** `console.error` de SW em `main.tsx` engolido silenciosamente — logar em telemetria.
- **B9.** Acessibilidade: revisar contraste de `--text3: #6b7280` sobre `--bg: #0a0a0a` (fica abaixo de 4.5:1 para texto pequeno).
- **B10.** `aria-label` ausente em vários botões só-ícone (ex.: fechar modais com `×`).
- **B11.** Skeleton loaders só em alguns lugares — padronizar.
- **B12.** Migrations: adotar numeração sequencial e uma migration de "baseline" que capture o schema atual (hoje as 3 migrations são incrementais e **não** representam o schema completo — a maioria das tabelas foi criada fora de migration).
- **B13-B22.** Testes unitários dos helpers financeiros; `Suspense` boundaries por rota; virtualização de listas longas (Extrato, Biblioteca); debounce centralizado; retirar `@types/node ^25` se não usado no client; documentar variáveis de ambiente; PWA offline real (hoje `runtimeCaching: []`); lazy nas libs de gráfico; tratar `refetchOnWindowFocus` global; monitorar bundle com `rollup-plugin-visualizer`.

---

## Código Morto para Remover

| Item | Tamanho/Linhas | Ação | Confirmação |
|---|---|---|---|
| `Dashboard.jsx` (raiz) | 188 KB | `git rm` | Não importado |
| `src/pages/AgendaPage.tsx` | 1104 linhas | `git rm` | Não importado; usa tabela legada `events` |
| `src/pages/TasksPage.tsx` | 366 linhas | `git rm` | Não importado (rota usa `Tarefas/`) |
| `financeiro-ref/` | 188 KB | Remover do repo | Material de referência |
| `design_handoff_jl_os/` | 224 KB | Remover/`.gitignore` | Material de referência |
| Tabela `events` (banco) | — | Avaliar drop após confirmar migração p/ `calendar_events` | Só usada por código morto |
| `console.log` de debug | ~10 ocorrências | Remover | `useDashboard`, `strava-sync` |

> **Verificação antes de apagar:** `grep -rn "AgendaPage\|TasksPage" src` só deve retornar as próprias definições. Rodar `npx tsc --noEmit` após remoção.

---

## Banco de Dados — Problemas e Otimizações

**RLS:** as tabelas criadas nas 3 migrations têm RLS correto (políticas `own_*` com `auth.uid() = user_id`). **Não foi possível confirmar RLS das tabelas criadas fora de migration** (tasks, habits, notes, transactions, vault_items, integrations, fin_*, calendar_events, user_settings) porque não estão versionadas — **auditar no dashboard do Supabase** se todas têm RLS habilitado. Esse é o maior ponto cego de segurança do projeto.

**Índices:** nenhum declarado (ver C3). Prioridade máxima em `user_id` + colunas de data.

**Schema drift:** o `db.ts` diverge do banco real (ver C1). O banco é a fonte da verdade; regenerar tipos.

**`storage.objects` bucket `systems`:** leitura pública sem checagem de dono (ver M24).

**Retenção/backup:** não há política de retenção documentada. Supabase faz backup automático no plano pago; confirmar o plano e ativar PITR se dados financeiros forem críticos.

**N+1:** não foram encontrados fetches dentro de loops no client (bom). Os dashboards já usam `Promise.all` em `mos-chat`. O ponto fraco é o waterfall de `useNotifications` (M1).

---

## Comparativo com Concorrentes

### Notion (segundo cérebro)
- **MOS faz melhor:** dashboard unificado de vida real (finanças + treino + hábitos num só "Life Score"); zero setup — já vem estruturado.
- **Falta:** editor rico nas Notas (hoje é textarea puro), relações entre itens, busca full-text global (o CommandPalette é limitado).
- **Faria sentido:** markdown/rich-text nas notas; backlinks simples entre notas e tarefas/projetos.
- **NÃO faz sentido:** databases genéricas configuráveis pelo usuário — mataria a proposta "opinativa" do MOS.

### Todoist (tarefas)
- **MOS faz melhor:** integração das tarefas com o resto da vida (score, notificações unificadas).
- **Falta:** linguagem natural ("amanhã 15h #trabalho"), recorrência de tarefas, sub-níveis além de 1, labels/filtros salvos.
- **Faria sentido:** recorrência de tarefas (já existe em eventos, dá pra reaproveitar); quick-add com parsing de data.
- **NÃO faz sentido:** karma/gamificação pesada do Todoist.

### YNAB (finanças)
- **MOS faz melhor:** visão anual + horizonte de saldos + diário automático; simplicidade.
- **Falta:** orçamento por envelope (zero-based budgeting), que é o coração do YNAB; conciliação bancária real (Pluggy existe mas está em sandbox).
- **Faria sentido:** metas de orçamento por categoria/mês com alerta de estouro.
- **NÃO faz sentido:** metodologia rígida de "dar função a cada real" imposta ao usuário.

### Strava (esportes)
- **MOS faz melhor:** unifica esporte com o resto da vida; importa da Strava (não compete, complementa).
- **Falta:** segmentos, kudos/social, mapas de rota, análise de zonas de FC/potência.
- **Faria sentido:** gráficos de evolução de pace/volume; PRs automáticos.
- **NÃO faz sentido:** rede social — fora do escopo pessoal do MOS.

### Habitica (hábitos)
- **MOS faz melhor:** hábitos integrados ao dashboard sem overhead de RPG.
- **Falta:** streaks visíveis e recompensas leves; lembretes por horário.
- **Faria sentido:** visualização de streak/heatmap (estilo GitHub) por hábito.
- **NÃO faz sentido:** avatar/party/RPG.

### Daylio (mood/score de vida)
- **MOS faz melhor:** o "Life Score" já agrega áreas objetivas (finanças, treino, tarefas).
- **Falta:** registro de humor/mood diário e correlação com métricas.
- **Faria sentido:** um check-in diário de humor + correlação ("seu humor cai nos dias sem treino").
- **NÃO faz sentido:** só mood tracking isolado — o MOS é mais amplo.

**Síntese:** o diferencial do MOS é ser o **agregador opinativo** que nenhum concorrente é. O maior risco competitivo é fazer cada módulo pela metade. Vale aprofundar **finanças** (envelope budget) e **hábitos** (streaks/heatmap), que são os módulos com maior gap vs. líderes.

---

## Roadmap Recomendado

### Próximas 2 semanas (fundação/estabilidade)
1. **Regenerar `db.ts`** e eliminar `as any` dos hooks e `MesTab`/`ConfigTab` (C1).
2. **ErrorBoundary** global + por rota (C2).
3. **Índices** de banco (C3).
4. **Remover código morto** (C4) e logs de debug (M2).
5. **Corrigir timezone** com helper único (C6).
6. **Corrigir onboarding** de novos usuários (C5).

### Próximo mês (robustez/escala)
1. Auditar **RLS de todas as tabelas** no dashboard Supabase; criar migration baseline (B12).
2. Trocar `.single()` por `.maybeSingle()` onde 0 linhas é válido (C8); corrigir colisão `['books']` (C7).
3. **Code-splitting** com `lazy` + `Suspense` (M9) e medir bundle.
4. **Rate limiting** nas Edge Functions e validação de payload no `mos-chat` (M4).
5. Paralelizar notificações (M1); paginação/rate-limit da Strava (M3).

### Próximos 3 meses (produto)
1. Quebrar componentes gigantes em hooks + subcomponentes (M8), começando por Financeiro.
2. **Envelope budget** no Financeiro; **streaks/heatmap** nos Hábitos.
3. Editor rich-text nas Notas; recorrência de tarefas.
4. Sair do **sandbox do Pluggy** (Open Finance real) — é o recurso de maior valor percebido.
5. Introduzir testes nos helpers financeiros e de datas.

### Visão de longo prazo
- **Mood check-in** diário + correlações (estilo Daylio) alimentando o Life Score.
- **App mobile nativo** (ou capacitor) se o PWA não bastar.
- **Multi-tenant maduro:** billing, limites por plano, telemetria.
- **IA proativa:** o `mos-chat` evoluir de reativo para insights automáticos ("você gastou 30% a mais em julho").

---

## Sugestões de Reformulação

1. **Camada de dados (transversal):** o padrão atual — componente gigante faz fetch com `as any` — é a raiz da fragilidade. Reformular para: `db.ts` gerado → hooks tipados por módulo (`useMesData`, `useInvestimentos`) → componentes só de apresentação. Não é reescrita; é extração incremental. **Maior ROI do projeto.**

2. **Agenda:** existem duas implementações (`AgendaPage.tsx` legado com tabela `events`, e `Agenda/` roteado com `calendar_events`). Consolidar definitivamente em `Agenda/`, apagar a legada e (após conferência) dropar a tabela `events`. Hoje é uma armadilha de manutenção.

3. **Financeiro:** é o módulo mais complexo e mais valioso, mas `MesTab` (1568 linhas) concentra risco demais. Vale um refactor dedicado com testes — é onde um bug custa dinheiro real ao usuário.

4. **Identidade de admin:** substituir os hardcodes (UUID em um lugar, email em outro) por um mecanismo único (claim/coluna `is_admin`). Antes de ter um segundo admin, isso vira dívida de segurança.

---

## Dependências para Atualizar/Remover

**Stack (saudável, moderna):** React 19, react-router 7, TanStack Query 5, Vite 6, Tailwind 3.4, Zustand 5, Supabase JS 2.49. Nenhuma vulnerabilidade óbvia e nenhum secret hardcoded.

| Pacote | Observação | Ação |
|---|---|---|
| `recharts ^3.8` | Biblioteca pesada; entra no bundle inicial sem lazy | Carregar via `lazy`/split (M9) |
| `date-fns ^4.1` | Uso quase exclusivo no `Topbar` | Avaliar remoção após helper de datas (B1/B5) |
| `@types/node ^25` | Versão muito nova; verificar se é usada no client | Confirmar necessidade; senão remover |
| `react-pluggy-connect ^2.12` | Integração em sandbox | Manter, mas priorizar produção |
| — testes — | Nenhum framework de teste instalado | Adicionar Vitest + Testing Library |

**Recomendações operacionais:** rodar `pnpm audit` e `pnpm outdated` periodicamente; adicionar `rollup-plugin-visualizer` como devDependency para monitorar o bundle; confirmar o plano do Supabase (backup/PITR) dado que há dados financeiros e um cofre de senhas.

---

*Relatório gerado por auditoria estática de código, schema e configuração. Itens que dependem do estado do banco em produção (RLS efetivo de tabelas não versionadas, existência de índices aplicados manualmente, plano de backup) estão marcados como "auditar no dashboard Supabase" e não puderam ser confirmados apenas pelo código.*
