# Handoff: JL OS — Sistema Pessoal do Jean Lucas

> **Para o Claude Code:** leia este README inteiro primeiro. Ele aponta para os outros
> documentos na ordem certa. O objetivo é construir um sistema **100% funcional** —
> com autenticação, banco de dados na nuvem e integrações reais — a partir dos
> protótipos de design em HTML que estão na pasta `design_reference/`.

---

## 1. O que é o JL OS

O **JL OS** é o "sistema operacional pessoal" do Jean Lucas — webdesigner, desenvolvedor
e maratonista, dono da **Nata Business** (Belo Horizonte). É um app web privado (single-user
no MVP, multi-user no futuro) que reúne, num só painel, **14 módulos** para gerir vida
e trabalho:

| # | Módulo | Grupo | O que faz |
|---|--------|-------|-----------|
| 1 | Dashboard | — | Visão geral do dia (resumos de todos os módulos) |
| 2 | Agenda | Produtividade | Calendário + compromissos |
| 3 | Tarefas & To-do | Produtividade | Lista de tarefas com projeto/prazo |
| 4 | Projetos | Produtividade | Clientes/produtos com status e progresso |
| 5 | Metas | Produtividade | Objetivos do ano com % de progresso |
| 6 | Hábitos | Produtividade | Tracker diário com streak |
| 7 | Lista de compras | Produtividade | Checklist do mercado |
| 8 | Financeiro | Finanças | Saldo, entradas, saídas, movimentações |
| 9 | Faturamento | Finanças | Serviços prestados e valores a receber |
| 10 | Notas | Conhecimento | Anotações com autosave |
| 11 | Biblioteca | Conhecimento | Catálogo de livros (lido/lendo/quero ler) |
| 12 | Estudos | Conhecimento | Cursos, progresso e arquivos |
| 13 | Senhas | Conhecimento | Cofre de credenciais |
| 14 | Corridas | Vida | Treinos, volume, pace, meta sub-3h |
| + | Integrações | Conexões | Drive, Notion, Google Agenda, Vercel, GitHub, Supabase |

A **landing page pública** (`design_reference/index.html`) **NÃO faz parte deste handoff** —
o Jean vai recriá-la sozinho. Aqui o foco é **o app interno** (`design_reference/Dashboard.html`).

---

## 2. Sobre os arquivos de design (LEIA ISTO)

Os arquivos em `design_reference/` são **referências de design feitas em HTML/CSS/JS puro** —
protótipos que mostram a aparência e o comportamento pretendidos. **Eles não são código
de produção para copiar e colar.**

- O protótipo guarda estado em `localStorage` (só pra demonstrar interações). **O sistema
  real deve usar Supabase** (Postgres + Auth + Storage) como fonte da verdade.
- Os dados visíveis no protótipo (km, saldos, tarefas, livros) são **exemplos fixos** —
  veja `DATABASE.md` para o modelo de dados real.
- As "integrações" no protótipo são apenas visuais (botões liga/desliga). O sistema real
  deve conectar às **APIs verdadeiras** — veja `INTEGRATIONS.md`.

**Sua tarefa:** recriar esses designs num app React moderno (Vite + React + TypeScript),
com a fidelidade visual exata dos protótipos, mas com dados reais e funcionalidade completa.

### Fidelidade: **ALTA (hi-fi)**
Os protótipos são pixel-perfect: cores finais, tipografia, espaçamentos e interações
definidos. Recrie a UI fielmente. Todos os tokens estão em `DESIGN_SYSTEM.md`.

---

## 3. Ordem de leitura dos documentos

Leia nesta ordem antes de escrever qualquer código:

1. **`README.md`** ← você está aqui (visão geral + escopo)
2. **`ARCHITECTURE.md`** — stack, estrutura de pastas, padrões de código, roteamento
3. **`DESIGN_SYSTEM.md`** — tokens de cor, tipografia, espaçamento e componentes base
4. **`DATABASE.md`** — schema completo do Supabase (tabelas, colunas, RLS, seeds)
5. **`MODULES.md`** — especificação tela a tela (layout, componentes, comportamento)
6. **`INTEGRATIONS.md`** — como conectar Drive, Notion, Google Agenda, Vercel, GitHub
7. **`SETUP.md`** — passo a passo de instalação, variáveis de ambiente e deploy na Vercel

---

## 4. Stack alvo (resumo)

- **Frontend:** Vite + React 18 + TypeScript
- **Roteamento:** React Router v6
- **Estilo:** CSS Modules ou Tailwind (tokens em `DESIGN_SYSTEM.md`) — recomendado Tailwind com config dos tokens
- **Estado servidor:** TanStack Query (React Query) sobre o cliente Supabase
- **Estado local/UI:** Zustand (o Jean já usa em outros apps) ou Context
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions)
- **Deploy:** Vercel (frontend) + Supabase (backend gerenciado)
- **Fontes:** Sora (display), Manrope (corpo), JetBrains Mono (mono) via Google Fonts

> O Jean já trabalha com **React + Supabase + Vercel** em outros projetos (App Finanças,
> Nata System, DesignCopy Pro), então este stack é proposital — segue os padrões dele.

---

## 5. Definição de "100% funcional" (critérios de aceite)

O sistema está pronto quando:

- [ ] Login/logout funcionando (Supabase Auth — e-mail/senha + Google OAuth)
- [ ] Cada um dos 14 módulos lê e grava dados reais no Supabase
- [ ] RLS (Row Level Security) ativa: cada usuário só vê os próprios dados
- [ ] Dashboard agrega dados reais dos outros módulos (não números fixos)
- [ ] Tarefas, hábitos, compras, notas, metas: CRUD completo + persistência na nuvem
- [ ] Cofre de senhas: criptografia no cliente antes de salvar (ver `INTEGRATIONS.md` §6)
- [ ] Pelo menos Google Agenda + GitHub + Vercel integrados de verdade (resto pode ser fase 2)
- [ ] Responsivo (sidebar colapsa em mobile, como no protótipo)
- [ ] Deploy na Vercel com variáveis de ambiente configuradas
- [ ] Visual idêntico ao protótipo (validar contra `design_reference/Dashboard.html`)

---

## 6. Como rodar o protótipo de referência

Abra `design_reference/Dashboard.html` direto no navegador (ou `index.html` para a landing).
Tudo funciona offline. Clique pelos itens da sidebar para ver cada módulo e suas interações
(marcar tarefas, revelar senhas, calendário, etc). Use isso como o "gabarito visual".
