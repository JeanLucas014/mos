# MODULES.md — JL OS (especificação tela a tela)

Cada módulo abaixo descreve layout, componentes, dados (hook + tabela) e comportamento.
O **gabarito visual** de tudo é `design_reference/Dashboard.html` — abra e compare.

Legenda: 📊 = tile de stat · 🟦 = card · 🔗 = hook (ARCHITECTURE §4) · 🗃️ = tabela (DATABASE.md)

---

## 0. AppShell (envolve todos os módulos)
- **Sidebar** 220px (grupos: Sistema, Produtividade, Finanças, Conhecimento, Vida, Conexões) — item ativo com barra azul à esquerda.
- **Topbar** 52px: breadcrumb "JL OS / \<view\>", data atual (mono), "sincronizado" + dot pulsante.
- **Conteúdo:** padding 30px 28px, largura máx ~1180px.
- **Mobile (≤860px):** sidebar vira drawer com scrim; hambúrguer na topbar.
- Cada página começa com `<Greeting>` (título 30px Sora + subtítulo com dado real).

---

## 1. Dashboard (`/`) — visão geral
🔗 `v_dashboard_summary` + hooks dos módulos.

- **Saudação** dinâmica por hora + "Você tem **N** tarefas pendentes e **1** treino hoje."
- **4 tiles 📊:** Tarefas abertas (`count tasks !done`) · Hábitos hoje (`X/total`) ·
  Corrida do mês (`km`, count-up) · A receber (`R$ k`, soma invoices não pagas).
- **Grid `.g-2`:**
  - 🟦 **Tarefas de hoje** — lista interativa (mesmo componente do módulo Tarefas) + input "adicionar". Link "ver tudo" → `/tarefas`.
  - 🟦 **Volume semanal** — mini gráfico de barras (seg→dom), última barra destacada azul. Link → `/corridas`.
- 🟦 **Próximos compromissos** — 3 próximos `events` (hora mono + barra colorida por categoria + título/desc). Link → `/agenda`.
- 🟦 **Acesso rápido** — 4 atalhos externos (App Finanças, Nata System, DesignCopy Pro, Plugins) abrindo em nova aba.

**Comportamento:** tiles e mini-gráfico animam ao montar. Marcar tarefa aqui reflete em `/tarefas` (mesma query key).

---

## 2. Agenda (`/agenda`) 🔗 `useEvents` 🗃️ `events`
- **Grid `.g-2`:**
  - 🟦 **Calendário** mensal: cabeçalho com mês + setas ‹ ›; grade 7 colunas (S T Q Q S S D). Dias de outros meses esmaecidos (`muted`), hoje com borda azul, dia selecionado com fundo azul. Cada dia mostra até 3 dots coloridos = eventos (cor por categoria).
  - 🟦 **Eventos do dia** selecionado: lista (hora mono 54px + barra colorida + título + descrição).
- Clicar num dia atualiza a lista à direita e o título "Hoje · ter 29".
- **CRUD:** criar/editar/excluir evento (modal). Categoria define a cor.
- Eventos `source='gcal'` aparecem junto (read-only) — ver INTEGRATIONS §3.

---

## 3. Tarefas & To-do (`/tarefas`) 🔗 `useTasks` 🗃️ `tasks`
- 🟦 Card "Minhas tarefas": lista de `<TaskRow>` + input inferior ("Nova tarefa…" + botão Adicionar).
- **`<TaskRow>`:** `<Checkbox>` + texto + tag de projeto (mono, à direita) + botão "×" (aparece no hover) para excluir.
- Concluída: checkbox azul com ✓, texto riscado em `--text3`.
- Enter no input ou clique em Adicionar cria (insere no topo). Toggle e delete com **optimistic update**.
- Subtítulo mostra contagem de pendentes (dado real).

---

## 4. Projetos (`/projetos`) 🔗 `useProjects` 🗃️ `projects`
- **Grid `.g-2b`:**
  - 🟦 **Em andamento** (`delivered=false`): cada `<ProjectRow>` = nome (Sora 700) + meta (mono) + `<Pill>` de status à direita + `<ProgressBar>` abaixo.
  - 🟦 **Entregues · 2026** (`delivered=true`): nome + meta + pill "live"/"pago" (sem barra).
- Status → cor da pill: em dev=azul, início=âmbar, ativo/live=verde, pausado=cinza.
- **CRUD:** criar/editar projeto (nome, meta, status, progress, delivered).

---

## 5. Metas (`/metas`) 🔗 `useGoals` 🗃️ `goals`
- 🟦 Card único com lista de metas. Cada `<GoalRow>`: nome à esquerda + label/percentual (mono) à direita + `<ProgressBar>` abaixo.
- **CRUD:** criar/editar meta (nome, progress 0-100, label opcional).

---

## 6. Hábitos (`/habitos`) 🔗 `useHabits` 🗃️ `habits` + `habit_logs`
- 🟦 Card "Hábitos diários · esta semana". Cada `<HabitRow>` (grid: nome | semana | toggle):
  - **nome** + sublinha "**N** dias seguidos" (streak, azul no número).
  - **semana:** 7 quadradinhos 17px (seg→dom); preenchidos azul nos dias marcados; o de hoje com anel azul.
  - **toggle:** botão 30px que marca/desmarca **hoje** (✓ quando ativo).
- Marcar hoje insere/remove em `habit_logs` (date = hoje) e recalcula streak.
- **Streak:** maior sequência de dias consecutivos terminando hoje/ontem.

---

## 7. Lista de compras (`/compras`) 🔗 `useShopping` 🗃️ `shopping_items`
- 🟦 Card "Mercado". Igual a Tarefas, mas sem tag de projeto. Checkbox + texto + "×".
- Input inferior para adicionar item. Subtítulo: "**N** itens no carrinho" (não concluídos).

---

## 8. Financeiro (`/financeiro`) 🔗 `useFinance` 🗃️ `transactions`
- Subtítulo com link externo "abrir App Finanças ↗".
- **4 tiles 📊:** Saldo · Entradas · Saídas · A receber (todos `R$ k`, count-up). Agregações de `transactions` (+ invoices para "a receber").
- 🟦 **Movimentações recentes:** lista (descrição + valor; verde se entrada `+`, branco/cinza se saída `−`). Link "faturamento →" → `/faturamento`.
- Valores em centavos no banco; formatar `Intl.NumberFormat('pt-BR', {currency:'BRL'})`.

---

## 9. Faturamento (`/faturamento`) 🔗 `useInvoices` 🗃️ `invoices`
- 🟦 Card com **tabela**: colunas Serviço · Cliente · Status (`<Pill>`) · Valor (à direita, Sora 700).
- **Rodapé da tabela:** "Total a receber" + soma (azul, 18px) dos não pagos.
- **CRUD:** adicionar serviço (serviço, cliente, valor, status, vencimento). Marcar como pago.

---

## 10. Notas (`/notas`) 🔗 `useNotes` 🗃️ `notes`
- 🟦 Card "Bloco de notas · autosave": `<textarea>` grande (min 130px, fundo `--bg`, mono-ish).
- **Autosave:** debounce 500ms → update; mostra "✓ salvo · localmente" (no real: "✓ salvo na nuvem") por ~1.8s.
- Evoluir para múltiplas notas (lista lateral) é desejável; MVP pode ser nota única do usuário.

---

## 11. Biblioteca (`/biblioteca`) 🔗 `useBooks` 🗃️ `books`
- 🟦 Card "Estante": grid de `<BookCard>` (auto-fill, mín 150px).
- **`<BookCard>`:** capa 2:3 (com faixa azul à esquerda + título sobre a capa, ou `cover_url` do Storage) + autor + `<Pill>` de status (lido=verde, lendo=azul, quero ler=cinza). Hover sobe 4px.
- **CRUD:** adicionar livro (título, autor, status, capa via upload → bucket `covers`).

---

## 12. Estudos (`/estudos`) 🔗 `useStudies` 🗃️ `studies` + `study_files`
- **Grid `.g-2b`:**
  - 🟦 **Em curso:** cada `<StudyRow>` = ícone 38px + nome + meta ("módulo 4 de 8 · 50%") + `<Pill>` à direita.
  - 🟦 **Arquivos & anotações · google drive:** lista (ícone do tipo PDF/DOC/MD + nome + "atualizado há X"). Pode vir do Drive — INTEGRATIONS §2.

---

## 13. Senhas (`/senhas`) 🔗 `useVault` 🗃️ `vault_items` ⚠️ sensível
- 🟦 Card "Cofre · criptografado localmente". Cada `<VaultRow>` (grid: serviço/user | senha | ações):
  - serviço (bold) + username (mono, cinza).
  - senha mascarada `••••••••••`; botão 👁 revela/oculta (decifra no cliente sob demanda); botão 📋 copia (feedback azul "copiado" por ~1.2s).
- **Segurança:** senha cifrada AES-GCM no cliente antes de salvar; backend só guarda ciphertext+IV. Master password destrava a sessão do cofre. Detalhes em `INTEGRATIONS.md` §6.
- **CRUD:** adicionar credencial (serviço, usuário, senha) — cifrar antes do insert.

---

## 14. Corridas (`/corridas`) 🔗 `useRuns` 🗃️ `runs`
- **4 tiles 📊:** Volume do mês (`km`, count-up) · Pace médio (`5:08/km`) · Ritmo estimado (`3:12`) · Treinos do mês (count).
- **Grid `.g-2b`:**
  - 🟦 **Progresso da meta mensal:** barra "187/200 km" (93%) + barra branca "Maratona sub-3h" (74%).
  - 🟦 **Últimos treinos:** lista (tipo + distância | dia · pace).
- Agregações de `runs` no mês corrente. Tipos: long/interval/easy/tempo.

---

## 15. Integrações (`/integracoes`) 🔗 `useIntegrations` 🗃️ `integrations`
- 🟦 Card "Conexões · 6 disponíveis". Cada linha: marca (quadrado com inicial) + nome + descrição + `<Pill>` (conectado=verde / desconectado=cinza) + botão **Conectar/Desconectar**.
- Providers: Google Drive, Notion, Google Agenda, Vercel, GitHub, Supabase.
- Botão dispara o fluxo OAuth real do provider — ver `INTEGRATIONS.md`. Ao conectar, `integrations.connected=true` e some o card de "conectar".

---

## Estados transversais (todos os módulos)
- **Loading:** skeleton com a cor `--bg3` (ou spinner discreto). Nunca tela em branco.
- **Vazio:** mensagem curta + CTA (ex. "Nenhuma tarefa ainda — adicione a primeira").
- **Erro:** toast/inline discreto; permitir retry (TanStack Query `refetch`).
- **Otimista:** toggles (tarefa/hábito/compra) atualizam a UI antes do round-trip.
- **Responsivo:** grids de 2-4 colunas colapsam para 1 em ≤860px; tiles para 2 colunas.
