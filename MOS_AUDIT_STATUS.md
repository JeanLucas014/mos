# MOS — Status da Auditoria (MOS_AUDIT.md)

**Auditoria original:** 2026-07-13 (commit `648afbf`) — 54 problemas (8 🔴 · 24 🟡 · 22 🔵)
**Este status:** 2026-07-17, após a rodada final que fechou os itens pendentes do B1–B22.

Este arquivo resume o que foi feito desde a auditoria original, item por
item, com base em verificação real do código/banco nesta data.

---

## 🔴 Crítico

| # | Item | Status |
|---|---|---|
| C1 | `db.ts` desatualizado / 223 `as any` | ✅ **Resolvido** — `db.ts` regenerado via MCP (estava faltando `is_admin` em `user_settings`, causa raiz de um bug real de tipo). `as any` caiu de **223 para 3** — os 3 restantes são legítimos e documentados (1 mismatch de tipagem do recharts, 2 no import legado de backups, já quebrados antes desta sessão, comportamento preservado). |
| C2 | Sem `ErrorBoundary` | ✅ **Resolvido** — `src/components/ErrorBoundary.tsx` existe e está em uso no `App.tsx`/`AppShell.tsx`. |
| C3 | Banco sem índices | ✅ **Resolvido** — todos os índices sugeridos já existem em produção; B2 adicionou os 2 compostos que faltavam. Índices duplicados identificados (não removidos, ver baseline). |
| C4 | Código morto versionado | ✅ **Resolvido** — nenhum dos arquivos/pastas citados existe mais no repo. Bônus desta rodada: `src/hooks/useTasks.ts` (hook não importado em lugar nenhum, schema legado) também foi removido. |
| C5 | Onboarding pode nunca disparar | ✅ **Resolvido** — default `onboarding_completed: false` para usuário sem linha. |
| C6 | Timezone UTC quebra "hoje" | ✅ **Resolvido** — `src/lib/dates.ts` centraliza a lógica de fuso local + formatadores pt-BR (B1). |
| C7 | Colisão de cache `['books']` | ✅ **Resolvido** — chaves distintas (`['books']` vs `['books', 'dash-estudos']`). |
| C8 | `.single()` sem tratamento de 0 linhas | ✅ **Resolvido** — as 29 ocorrências revisadas uma a uma: todas são `.insert().select().single()` (seguro por construção, insert sempre retorna 1 linha) ou já tratam o caso de 0 linhas explicitamente (`useUserSettings.ts` com `PGRST116`). Nenhuma mudança de código necessária, só verificação. |

## 🟡 Médio

Itens **M16–M22** corrigidos numa etapa anterior (7 commits): dedupe do Strava via `external_id`, mapeamento de esporte, upsert com `user_id` explícito, Vitest + 41 testes, remoção de 17 `as any` na Agenda, mensagens de erro amigáveis, triagem de TODO/FIXME/HACK.

| # | Item | Status |
|---|---|---|
| M1 | Notificações em série | ✅ Já usa `Promise.all`. |
| M2 | Logs de debug com dados de usuário | 🟡 Parcial — `strava-sync` ainda loga contagens (não dados de treino em si). Baixo risco, mantido. |
| M3 | Strava só 600 atividades / sem rate limit | ✅ Já pagina até 20 páginas e trata `429`. |
| M4 | Edge Functions sem rate limit/validação | ✅ `mos-chat` já valida `messages.length` e tem `chat_rate_limits`. |
| M5 | Admin hardcoded | ✅ **Resolvido** — `admin-stats`/`invite-user` já usam `user_settings.is_admin` como fonte única (já estava corrigido). O `JEAN_ID` em `useMesData.ts` **não é** sobre identificação de admin — é um corte de data específico para geração automática de previsão financeira da conta real; mantido como está por decisão do usuário (não é bug de segurança, é dado de negócio). |
| M6 | `send-support` fora do `config.toml` | ✅ Já registrada. |
| M7 | PBKDF2 100k iterações | ✅ Já em 600k, com migração transparente de cofres antigos. |
| M8 | Componentes gigantes | ✅ 6 arquivos refatorados em etapa anterior. |
| M9 | Sem code-splitting | ✅ Todas as páginas já são `lazy()`; B14 adicionou Suspense granular em 2 seções pesadas. |
| M10 | `staleTime` inconsistente | ✅ **Revisado** — o problema original (dashboard forçando `staleTime:0`+`refetchInterval` agressivo) já não existe (hooks do dashboard usam `staleTime: 2min`, sem `refetchInterval`). `staleTime: 0` remanescente em `useNotes`/`useShopping` é decisão razoável (listas simples tipo todo, quer sempre dado fresco). |
| M11 | Viewport bloqueia zoom | ✅ Já corrigido. |
| M12 | Cache key sem `user.id` | ✅ Já corrigido. |
| M13 | `getSession()` sem `.catch` | ✅ Já trata erro. |
| M14 | SW registrado duas vezes | ✅ Não é duplicado (decisão documentada no próprio `vite.config.ts`); B8 tornou o erro visível. |
| M15 | `useDashHabits` sem filtro de data | ✅ **Revisado** — já filtra últimos 90 dias (`daysAgoLocal(90)`). |
| M23 | `fin_lancamentos.valor` null tratado inconsistente | ✅ **Revisado** — todos os pontos de soma já guardam contra null (`!= null` antes de somar, `|| 0`, ou guard `> 0` antes de renderizar). Nenhum caminho encontrado onde null vira `NaN` silenciosamente. |
| M24 | Bucket `systems` público | ✅ Migrado para `authenticated`-only. |

## 🔵 Melhorias (B1–B22)

| # | Item | Resultado |
|---|---|---|
| B1 | Helper de datas pt-BR | ✅ `formatDateBR`/`formatDateTimeBR`/`formatMonthYearBR` em `dates.ts`. |
| B2 | Índices compostos adicionais | ✅ Os 2 que faltavam, criados. |
| B3 | Tokens de cor | ✅ **433 → 11 ocorrências** — resto convertido para tokens do design system. As 11 restantes são defaults de dados (cor de evento/rotina/projeto/tarefa) ou casos de concatenação de alpha que quebrariam com `var()` — documentadas em `TODOS_PENDENTES.md`. |
| B4 | EmptyState/ErrorState | ✅ Aplicados em 6 módulos. |
| B5 | Remoção do `date-fns` | ✅ Removido. |
| B6 | Toggle switch único | ✅ Consolidado. |
| B7 | Meta tags SEO/OG | ✅ Adicionadas. |
| B8 | Log de erro do SW | ✅ `console.error` explícito. |
| B9 | Contraste `--text3` | ✅ Ajustado para WCAG AA. |
| B10 | `aria-label` em botões-ícone | ✅ 17 botões corrigidos. |
| B11 | Skeleton reutilizável | ✅ Criado e aplicado. |
| B12 | Migration baseline | ✅ Schema completo documentado. **RLS habilitado em 100% das tabelas.** |
| B13 | Testes financeiros adicionais | ✅ `InvoicesPage/utils.test.ts`. |
| B14 | Suspense granular | ✅ `LifeScoreSection` + `AlocacaoChart`. |
| B15 | Virtualização de listas | 🟡 **Parcial** — Biblioteca modo lista virtualizada (`@tanstack/react-virtual`, cobre agrupado e plano). Extrato não virtualizado (blocos de altura variável, baixo volume por mês). **Não foi possível confirmar visualmente no navegador** nesta sessão — pedir teste manual. |
| B16 | `useDebounce` centralizado | ✅ Criado e aplicado no CommandPalette. |
| B17 | `@types/node` no client? | ✅ Verificado — só usado no build, nada a remover. |
| B18 | `.env.example` | ✅ Criado. |
| B19 | `runtimeCaching` no PWA | ✅ CacheFirst para Google Fonts. |
| B20 | Lazy nas libs de gráfico | ✅ Já resolvido pelo M9, confirmado. |
| B21 | `refetchOnWindowFocus` | ✅ Documentado. |
| B22 | `rollup-plugin-visualizer` | ✅ Instalado. |

---

## Verificação final

- `npx tsc -b --force` — zero erros
- `npx vitest run` — 48/48 testes passando
- `npx vite build` — build limpo (aviso de chunk >500kB no vendor principal, pré-existente, não abordado)

## O que genuinamente ainda falta

1. **B15** — virtualizar o Extrato, se o volume de dados algum dia justificar (hoje não justifica).
2. **B3** — as 11 ocorrências de cor documentadas (defaults de dados / alpha-concat) exigiriam `color-mix()` ou CSS vars dedicadas por opacidade para ir além.
3. **B15 (Biblioteca)** — testar manualmente no navegador (não foi possível nesta sessão); se algo estiver visualmente errado, é o primeiro lugar a olhar.
4. Índices duplicados identificados no B12 (ex: `idx_books_user` e `idx_books_user_id` idênticos em ~15 tabelas) — candidatos a limpeza futura, não removidos por não ser o foco desta auditoria.

Fora isso, **a auditoria MOS_AUDIT.md original está 100% endereçada** — todo item 🔴/🟡/🔵 foi resolvido, revisado e confirmado como já resolvido, ou documentado com a razão explícita de não ter sido implementado.

---

*Gerado ao final da sessão que fechou os itens pendentes do B1–B22 (C1, C8, M5, M10, M15, M23, B3, B15).*
