# MOS — Status da Auditoria (MOS_AUDIT.md)

**Auditoria original:** 2026-07-13 (commit `648afbf`) — 54 problemas (8 🔴 · 24 🟡 · 22 🔵)
**Este status:** 2026-07-16, ao final da última etapa (🔵 melhorias, B1–B22)

Este arquivo resume o que foi feito desde a auditoria original, item por
item, com base em verificação real do código/banco nesta data — não é
só uma lista de commits, é uma reconferência do estado atual.

---

## 🔴 Crítico

| # | Item | Status |
|---|---|---|
| C1 | `db.ts` desatualizado / 223 `as any` | 🟡 **Parcial** — `db.ts` já foi regenerado (tabelas como `calendar_events`, `user_settings`, `task_projects` já existem nele). `as any` caiu de 223 para **201** (M21 removeu os 17 da Agenda). Ainda concentrado em vários hooks/tabs — maior dívida técnica que resta. |
| C2 | Sem `ErrorBoundary` | ✅ **Resolvido** — `src/components/ErrorBoundary.tsx` existe e está em uso no `App.tsx`/`AppShell.tsx`. |
| C3 | Banco sem índices | ✅ **Resolvido** — todos os índices sugeridos (`idx_tasks_user_pending`, `idx_lancamentos_user_data`, `idx_sports_user_date`, `idx_habit_logs_user_date`, `idx_calendar_events_user_start`, `idx_fin_recorrentes_user_ativo`) já existem em produção. B2 desta sessão adicionou os 2 compostos que ainda faltavam (`idx_lancamentos_user_categoria`, `idx_lancamentos_user_cartao`). Ver nota sobre índices duplicados abaixo. |
| C4 | Código morto versionado (`Dashboard.jsx`, `AgendaPage.tsx`, `TasksPage.tsx`, `financeiro-ref/`, `design_handoff_jl_os/`) | ✅ **Resolvido** — nenhum desses arquivos/pastas existe mais no repo. |
| C5 | Onboarding pode nunca disparar | ✅ **Resolvido** — `useUserSettings.ts` já usa `onboarding_completed: false` como default para usuário sem linha. |
| C6 | Timezone UTC quebra "hoje" | ✅ **Resolvido** — `src/lib/dates.ts` centraliza `todayLocal()`/`addDaysLocal()`/`daysAgoLocal()` com a lógica de fuso local correta; B1 desta sessão adicionou os formatadores pt-BR (`formatDateBR`/`formatDateTimeBR`/`formatMonthYearBR`) no mesmo helper. |
| C7 | Colisão de cache `['books']` | ✅ **Resolvido** — `useDashBooks` usa `['books']`, `useDashEstudos` usa `['books', 'dash-estudos']` — chaves distintas. |
| C8 | `.single()` sem tratamento de 0 linhas | 🔴 **Não resolvido** — ainda **29 ocorrências** de `.single()` no código. Não verificado nesta sessão quais são realmente seguras (cenário "linha sempre existe" garantido por lógica) vs. arriscadas. |

## 🟡 Médio

Todos os itens **M16–M22** foram corrigidos numa etapa anterior desta sessão (7 commits, já no `main`): dedupe do Strava via `external_id`, mapeamento de esporte Yoga/Pilates/Elliptical, upsert com `user_id` explícito, Vitest + 41 testes, remoção de 17 `as any` na Agenda, mensagens de erro amigáveis (escopo ampliado para 12 arquivos), e triagem de TODO/FIXME/HACK (nenhum encontrado).

Verificação rápida dos demais itens médios (M1–M15, M23, M24) nesta sessão:

| # | Item | Status |
|---|---|---|
| M1 | Notificações em série | ✅ Já usa `Promise.all` em `useNotifications.ts`. |
| M2 | Logs de debug com dados de usuário | 🟡 Parcial — `strava-sync` ainda loga contagens (`page X: Y activities`, `total fetched`), não dados de treino em si. Baixo risco, não removido. |
| M3 | Strava só 600 atividades / sem rate limit | ✅ Já pagina até 20 páginas (4000 atividades) e trata `429`. |
| M4 | Edge Functions sem rate limit/validação | ✅ `mos-chat` já valida `messages.length` (máx 20) e tem `chat_rate_limits`. |
| M5 | Admin hardcoded (`JEAN_ID`/`ADMIN_EMAIL`) | 🔴 **Não resolvido** — ainda existe `JEAN_ID` hardcoded em `useMesData.ts:66`, além dos já citados no audit original. Continua sem mecanismo único. |
| M6 | `send-support` fora do `config.toml` | ✅ Já está registrada em `supabase/config.toml`. |
| M7 | PBKDF2 100k iterações | ✅ Já em 600k (`PBKDF2_ITERATIONS`), com `LEGACY_ITERATIONS` mantido para migração transparente de cofres antigos. |
| M8 | Componentes gigantes | ✅ Batch de 6 arquivos (SportsPage, LibraryPage, InvoicesPage, DashboardPage, ConfigTab, SettingsPage) extraídos em módulos menores numa etapa anterior desta sessão. |
| M9 | Sem code-splitting | ✅ Todas as ~25 páginas já são `lazy()` no `App.tsx`. Nesta sessão (B14), duas seções pesadas dentro de página (`LifeScoreSection`, `AlocacaoChart`) ganharam `Suspense` próprio, além do Suspense por rota. |
| M10 | `staleTime` inconsistente | ⚪ Não reverificado nesta sessão. |
| M11 | Viewport bloqueia zoom | ✅ `index.html` já não tem `maximum-scale`/`user-scalable=no`. |
| M12 | Cache key sem `user.id` | ✅ `useUserSettings.ts` já usa `['user_settings', user?.id]`. |
| M13 | `getSession()` sem `.catch` | ✅ Já trata erro com `console.error` e segue (não deixa `loading` preso). |
| M14 | SW registrado duas vezes | ✅ Não é duplicado — `injectRegister: null` no VitePWA desativa o snippet automático, deixando só o registro manual em `main.tsx` (decisão documentada no próprio `vite.config.ts`). B8 desta sessão tornou o erro de registro visível (`console.error`). |
| M15 | `useDashHabits` sem filtro de data | ⚪ Não reverificado nesta sessão. |
| M23 | `fin_lancamentos.valor` null tratado inconsistente | ⚪ Não reverificado nesta sessão. |
| M24 | Bucket `systems` público | ✅ Migrado para `authenticated`-only em `20260715_systems_bucket_private.sql` (ainda não é "só o dono", mas não é mais público). |

## 🔵 Melhorias (B1–B22) — todas endereçadas nesta sessão

| # | Item | Resultado |
|---|---|---|
| B1 | Helper de datas pt-BR | `formatDateBR`/`formatDateTimeBR`/`formatMonthYearBR` em `dates.ts`, aplicados nos pontos com formato idêntico. |
| B2 | Índices compostos adicionais | `idx_lancamentos_user_categoria`, `idx_lancamentos_user_cartao` (o terceiro pedido já existia). |
| B3 | Tokens de cor | Aplicado em ConfigTab/MesTab/Tarefas (os 3 citados no audit). Resto (~300 ocorrências) documentado como pendente em `TODOS_PENDENTES.md` por decisão do usuário. |
| B4 | EmptyState/ErrorState | Componentes em `src/components/ui/`, aplicados em Tarefas/Notas/Metas/Projetos/Biblioteca/Esportes. |
| B5 | Remoção do `date-fns` | Removido — único uso era no Topbar, substituído por `toLocaleDateString` nativo. |
| B6 | Toggle switch único | `src/components/ui/Toggle.tsx`, substitui as 2 versões duplicadas. |
| B7 | Meta tags SEO/OG | Adicionadas em `index.html`. |
| B8 | Log de erro do SW | `console.error` explícito no catch do registro. |
| B9 | Contraste `--text3` | Dark 4.10:1→5.31:1, light 4.40:1→4.81:1 (fórmula WCAG 2.1). |
| B10 | `aria-label` em botões-ícone | 17 botões corrigidos (fechar, excluir, editar, adicionar, limpar busca). |
| B11 | Skeleton reutilizável | `src/components/ui/Skeleton.tsx`, usado em 4 páginas. |
| B12 | Migration baseline | `supabase/migrations/00000000000000_baseline_reference.sql` — schema completo das 47 tabelas (colunas, PKs, FKs, índices, RLS policies), só para referência. **Achado: RLS habilitado em 100% das tabelas** — resolve o maior ponto cego de segurança do audit original. |
| B13 | Testes financeiros adicionais | `InvoicesPage/utils.test.ts` (fmt/fmtDate/isPaid). |
| B14 | Suspense granular | `LifeScoreSection` e `AlocacaoChart` (recharts) com `lazy()` + `Suspense` próprios. |
| B15 | Virtualização de listas | **Não implementado** — Extrato tem blocos de altura variável, Biblioteca tem grid responsivo agrupado; complexidade/risco alto vs. ganho real (uso pessoal, 1 usuário). Motivo detalhado em `TODOS_PENDENTES.md`. |
| B16 | `useDebounce` centralizado | `src/hooks/useDebounce.ts`, aplicado no `CommandPalette` (única busca com query real ao Supabase por keystroke). |
| B17 | `@types/node` no client? | Verificado: só usado em `vite.config.ts` (build), não no client. Nada a remover. |
| B18 | `.env.example` | Criado, documenta vars do client e das Edge Functions. |
| B19 | `runtimeCaching` no PWA | CacheFirst para Google Fonts (CSS + woff2). |
| B20 | Lazy nas libs de gráfico | Já resolvido pelo M9 (rotas lazy) + chunks próprios do recharts gerados pelo bundler. Confirmado, sem mudança necessária. |
| B21 | `refetchOnWindowFocus` | Explicitado como `true` com comentário da decisão (combinado com `staleTime: 60s`). |
| B22 | `rollup-plugin-visualizer` | Instalado, plugin condicional (`ANALYZE=true npm run build`). |

---

## Bundle final (após B1–B22)

```
npm run build
```

- **Maior chunk:** `index-*.js` (vendor/shared) — 554.68 kB / gzip 159.94 kB
- **Segundo maior:** `CategoricalChart` (recharts) — 257.25 kB / gzip 82.86 kB — carregado só sob demanda
- **Total `dist/`:** ~1.9 MB (63 entradas no precache do PWA, ~1.78 MB)
- Aviso de chunk >500kB persiste no chunk vendor principal — não abordado nesta rodada (exigiria `manualChunks` no Rollup, fora do escopo B1–B22).

## O que ainda falta (para referência futura)

1. **C1** — reduzir os 201 `as any` restantes (Financeiro/MesTab e ConfigTab concentram a maioria).
2. **C8** — revisar as 29 ocorrências de `.single()`, trocar por `.maybeSingle()` onde 0 linhas é estado válido.
3. **M5** — unificar identificação de admin (ainda há `JEAN_ID` hardcoded em `useMesData.ts`, além dos citados no audit original).
4. **M10, M15, M23** — não reverificados nesta sessão, status do audit original ainda vale até confirmar.
5. **B3** — as ~300 ocorrências restantes de cor hardcoded fora dos 3 arquivos já tratados.
6. **B15** — virtualização de Extrato/Biblioteca, se o volume de dados algum dia justificar.

---

*Gerado ao final da sessão que implementou B1–B22. Baseado em grep/leitura direta do código e introspecção do banco em produção nesta data — não é uma reauditoria completa, é uma reconferência pontual dos itens citados.*
