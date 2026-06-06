# SETUP.md — JL OS (do zero ao deploy)

Passo a passo para sair do nada até o sistema rodando na Vercel. Feito para o Claude Code
executar em sequência, mas o Jean também consegue acompanhar.

---

## Pré-requisitos
- Node 18+ e pnpm (ou npm)
- Conta **Supabase** (projeto novo)
- Conta **Vercel**
- (Para integrações) projeto no **Google Cloud Console**, tokens de **GitHub** e **Vercel**

---

## 1. Criar o projeto React
```bash
pnpm create vite@latest jl-os -- --template react-ts
cd jl-os
pnpm add @supabase/supabase-js @tanstack/react-query react-router-dom zustand date-fns lucide-react
pnpm add -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
Configure os tokens do `DESIGN_SYSTEM.md` em `tailwind.config.ts` e importe as 3 fontes do
Google no `index.html`. Crie a estrutura de pastas do `ARCHITECTURE.md §2`.

---

## 2. Criar o backend Supabase
1. Crie um projeto novo no Supabase (anote a região e a senha do Postgres).
2. **SQL Editor** → rode, na ordem, os blocos do `DATABASE.md` (§0 helpers → §1..15 tabelas →
   RLS de cada uma → §17 views).
3. **Authentication → Providers:** habilite **Email** e **Google** (use o mesmo OAuth client
   do Google Cloud das integrações). Configure o redirect do Supabase Auth.
4. **Storage:** crie um bucket `covers` (capas de livros) público de leitura; bucket `files`
   privado para Estudos se for usar upload direto.
5. Crie seu usuário (Authentication → Users → Add user) e rode os **seeds** do `DATABASE.md §16`
   trocando `:uid` pelo seu id.

---

## 3. Variáveis de ambiente (frontend)
Crie `.env.local` (NÃO commitar):
```
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key pública>
```
> A `anon key` é pública por design — a segurança vem da **RLS**. Nunca coloque a
> `service_role key` no frontend.

Gere os tipos:
```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase gen types typescript --linked > src/types/db.ts
```

---

## 4. Auth + providers no app
- `src/main.tsx`: envolver o app com `QueryClientProvider`, `BrowserRouter` e um
  `AuthProvider` que escuta `supabase.auth.onAuthStateChange`.
- `RequireAuth`: se não houver sessão, redireciona para `/login`.
- `LoginPage`: e-mail/senha + botão "Entrar com Google" (`supabase.auth.signInWithOAuth`).
- Logout no rodapé da sidebar (`supabase.auth.signOut`).

---

## 5. Edge Functions (integrações)
Só quando for plugar integrações reais (ver `INTEGRATIONS.md`).
```bash
supabase functions new oauth-start
supabase functions new oauth-callback
supabase functions new gcal-sync
# ...github-proxy, vercel-proxy, drive-list
supabase secrets set GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=...
supabase secrets set GITHUB_TOKEN=...  VERCEL_TOKEN=...
supabase functions deploy oauth-callback
```
O frontend chama via `supabase.functions.invoke('nome', { body })`.

---

## 6. Ordem de implementação sugerida (para Claude Code)
Construa incremental, testando cada fatia:

1. **Shell + Auth:** AppShell (sidebar/topbar/responsivo) + login + guarda de rota. Rotas vazias.
2. **Componentes UI base** (`DESIGN_SYSTEM.md §5`): Card, Button, Tile, Pill, ProgressBar, Checkbox, Counter, Greeting.
3. **Tarefas** (CRUD completo + optimistic) — é o padrão que se repete; acerte-o bem.
4. **Hábitos, Compras, Metas, Projetos** (mesmo padrão de CRUD).
5. **Financeiro + Faturamento** (agregações, formatação BRL em centavos).
6. **Notas** (autosave), **Biblioteca** (upload de capa), **Estudos**.
7. **Corridas** (agregações do mês) e **Agenda** (calendário + eventos).
8. **Dashboard** (agrega tudo via `v_dashboard_summary` + queries) — fazer por último, pois depende dos outros.
9. **Senhas** (cripto cliente — `INTEGRATIONS.md §6`).
10. **Integrações reais:** Google Agenda → GitHub → Vercel (Edge Functions). Resto fase 2.

Valide cada tela contra `design_reference/Dashboard.html` (pixel + comportamento).

---

## 7. Deploy na Vercel
1. Suba o repo no GitHub.
2. Vercel → New Project → importe o repo. Framework detectado: **Vite**.
   - Build: `pnpm build` · Output: `dist`.
3. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Em Supabase → Authentication → URL Configuration, adicione o domínio da Vercel em
   **Site URL** e **Redirect URLs** (senão o OAuth quebra em produção).
5. Deploy. Configure domínio custom se quiser (ex. `os.jeanlucas.com`).

---

## 8. Checklist final (= "100% funcional" do README §5)
- [ ] Login/logout (email + Google) com RLS isolando os dados
- [ ] Os 14 módulos lendo/gravando no Supabase
- [ ] Dashboard agregando dados reais
- [ ] CRUD + optimistic em tarefas/hábitos/compras/metas/projetos
- [ ] Financeiro/Faturamento com BRL correto (centavos)
- [ ] Notas com autosave na nuvem
- [ ] Cofre com cripto no cliente
- [ ] Agenda + GitHub + Vercel integrados de verdade
- [ ] Responsivo (drawer no mobile)
- [ ] Deploy Vercel + redirect URLs no Supabase
- [ ] Visual conferido contra o protótipo

---

## Notas finais
- Mantenha os **slugs de rota em pt-BR** (`/agenda`, `/tarefas`…) — combinam com a landing do Jean.
- Reaproveite os textos/labels exatos do protótipo (estão em `design_reference/Dashboard.html`).
- Dúvida de medida/cor/comportamento? A fonte da verdade visual é sempre o protótipo HTML.
- Os números do protótipo são exemplos — o Jean troca pelos reais via app depois do deploy.
```
```
