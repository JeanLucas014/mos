# ARCHITECTURE.md — JL OS

Stack, estrutura de pastas, padrões de código e roteamento. Leia depois do `README.md`.

---

## 1. Stack detalhado e por quê

| Camada | Escolha | Motivo |
|--------|---------|--------|
| Build/dev | **Vite** | Rápido, é o que o Jean já usa (App Finanças) |
| UI | **React 18 + TypeScript** | Tipagem evita bugs nos 14 módulos; padrão do Jean |
| Roteamento | **React Router v6** | Cada módulo é uma rota (`/agenda`, `/tarefas`...) |
| Estilo | **Tailwind CSS** com tokens custom | Tokens em `DESIGN_SYSTEM.md`; rápido e consistente |
| Dados servidor | **TanStack Query** | Cache, refetch, loading/erro prontos sobre Supabase |
| Estado UI | **Zustand** | Sidebar, modais, tema — leve e familiar ao Jean |
| Backend | **Supabase** | Postgres + Auth + Storage + Edge Functions num só lugar |
| Datas | **date-fns** (locale pt-BR) | Calendário da Agenda, formatação |
| Ícones | **lucide-react** | Cobre todos os ícones usados no protótipo |
| Deploy | **Vercel** + Supabase | Padrão do Jean |

> Se preferir CSS Modules a Tailwind, tudo bem — os tokens em `DESIGN_SYSTEM.md` servem
> para os dois. Tailwind é a recomendação por velocidade.

---

## 2. Estrutura de pastas

```
jl-os/
├── .env.local                      # variáveis (ver SETUP.md) — NÃO commitar
├── index.html
├── vite.config.ts
├── tailwind.config.ts              # tokens do DESIGN_SYSTEM.md
├── tsconfig.json
├── package.json
├── public/
│   └── fonts/                       # opcional: self-host das fontes
└── src/
    ├── main.tsx                     # entry: providers (Query, Router, Auth)
    ├── App.tsx                      # rotas
    ├── index.css                    # @tailwind + variáveis CSS globais
    │
    ├── lib/
    │   ├── supabase.ts              # cliente Supabase singleton
    │   ├── queryClient.ts           # config TanStack Query
    │   └── crypto.ts                # cripto do cofre de senhas (Web Crypto)
    │
    ├── stores/
    │   └── useUIStore.ts            # Zustand: sidebar aberta, view atual...
    │
    ├── hooks/                       # um arquivo de hooks por módulo
    │   ├── useTasks.ts              # useTasks(), useAddTask(), useToggleTask()...
    │   ├── useHabits.ts
    │   ├── useProjects.ts
    │   ├── useGoals.ts
    │   ├── useShopping.ts
    │   ├── useFinance.ts
    │   ├── useInvoices.ts
    │   ├── useNotes.ts
    │   ├── useBooks.ts
    │   ├── useStudies.ts
    │   ├── useVault.ts
    │   ├── useRuns.ts
    │   ├── useEvents.ts             # Agenda
    │   └── useIntegrations.ts
    │
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.tsx         # sidebar + topbar + <Outlet/>
    │   │   ├── Sidebar.tsx
    │   │   ├── Topbar.tsx
    │   │   └── MobileScrim.tsx
    │   ├── ui/                       # primitivas reutilizáveis (ver DESIGN_SYSTEM.md)
    │   │   ├── Card.tsx
    │   │   ├── Button.tsx
    │   │   ├── Tile.tsx             # stat tile
    │   │   ├── ProgressBar.tsx
    │   │   ├── Pill.tsx             # badge de status
    │   │   ├── Checkbox.tsx
    │   │   ├── Greeting.tsx
    │   │   └── Counter.tsx          # número animado (count-up)
    │   └── auth/
    │       ├── LoginPage.tsx
    │       └── RequireAuth.tsx      # guarda de rota
    │
    ├── pages/                        # uma página por módulo (= uma rota)
    │   ├── DashboardPage.tsx
    │   ├── AgendaPage.tsx
    │   ├── TasksPage.tsx
    │   ├── ProjectsPage.tsx
    │   ├── GoalsPage.tsx
    │   ├── HabitsPage.tsx
    │   ├── ShoppingPage.tsx
    │   ├── FinancePage.tsx
    │   ├── InvoicesPage.tsx
    │   ├── NotesPage.tsx
    │   ├── LibraryPage.tsx
    │   ├── StudiesPage.tsx
    │   ├── VaultPage.tsx
    │   ├── RunsPage.tsx
    │   └── IntegrationsPage.tsx
    │
    └── types/
        └── db.ts                     # tipos gerados do Supabase (supabase gen types)
```

---

## 3. Roteamento (React Router v6)

As rotas devem espelhar o `data-view` do protótipo (os mesmos slugs usados nos links
`Dashboard.html#agenda`, etc), para que os deep-links da landing continuem funcionando.

```tsx
// App.tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route element={<RequireAuth><AppShell /></RequireAuth>}>
    <Route index element={<DashboardPage />} />
    <Route path="agenda"      element={<AgendaPage />} />
    <Route path="tarefas"     element={<TasksPage />} />
    <Route path="projetos"    element={<ProjectsPage />} />
    <Route path="metas"       element={<GoalsPage />} />
    <Route path="habitos"     element={<HabitsPage />} />
    <Route path="compras"     element={<ShoppingPage />} />
    <Route path="financeiro"  element={<FinancePage />} />
    <Route path="faturamento" element={<InvoicesPage />} />
    <Route path="notas"       element={<NotesPage />} />
    <Route path="biblioteca"  element={<LibraryPage />} />
    <Route path="estudos"     element={<StudiesPage />} />
    <Route path="senhas"      element={<VaultPage />} />
    <Route path="corridas"    element={<RunsPage />} />
    <Route path="integracoes" element={<IntegrationsPage />} />
  </Route>
</Routes>
```

> Slugs em pt-BR de propósito — combinam com o protótipo e com a landing do Jean.

---

## 4. Padrão de dados (TanStack Query + Supabase)

**Regra geral:** todo módulo expõe um hook em `src/hooks/`. As páginas **nunca** chamam
o Supabase direto — só consomem hooks. Isso isola data-fetching e facilita testes.

Exemplo (`useTasks.ts`):

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Task } from '../types/db';

export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: Pick<Task, 'id' | 'done'>) => {
      const { error } = await supabase
        .from('tasks')
        .update({ done: !task.done })
        .eq('id', task.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useAddTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; project?: string }) => {
      const { error } = await supabase.from('tasks').insert({
        title: input.title,
        project: input.project ?? null,
        done: false,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
```

Use **optimistic updates** em toggles (tarefas, hábitos, compras) para o clique parecer
instantâneo como no protótipo. TanStack Query tem suporte nativo (`onMutate`).

---

## 5. Cliente Supabase

```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/db';

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
);
```

Gere os tipos com:
```bash
npx supabase gen types typescript --project-id <id> > src/types/db.ts
```

---

## 6. AppShell (layout persistente)

O `AppShell` é o equivalente ao `.app` do protótipo: sidebar fixa à esquerda (220px),
topbar fixa no topo, conteúdo no `<Outlet/>`. A sidebar colapsa em < 860px (drawer + scrim),
exatamente como em `dashboard.css`. Veja medidas e comportamento em `DESIGN_SYSTEM.md` §6
e `MODULES.md` §0.

---

## 7. Convenções

- **TypeScript estrito** (`strict: true`).
- Nomes de componentes em PascalCase, hooks em camelCase com prefixo `use`.
- Datas sempre via `date-fns` com `import { ptBR } from 'date-fns/locale'`.
- Valores monetários: guardar em **centavos (integer)** no banco; formatar com
  `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- Nunca colocar segredos no frontend além da `anon key` do Supabase (que é pública por design).
  Tokens de integração (GitHub, Google) ficam em **Edge Functions** — ver `INTEGRATIONS.md`.
