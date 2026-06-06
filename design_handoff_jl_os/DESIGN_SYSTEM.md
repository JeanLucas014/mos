# DESIGN_SYSTEM.md — JL OS

Tokens exatos e componentes base. **Fidelidade alta:** use estes valores literais.
Extraídos de `design_reference/assets/styles.css` e `dashboard.css`.

---

## 1. Cores

### Tema escuro (app interno — padrão)
| Token | Hex | Uso |
|-------|-----|-----|
| `--bg` | `#0a0a0a` | fundo da página |
| `--bg2` | `#111111` | fundo de cards, sidebar |
| `--bg3` | `#161616` | fundo de inputs, barras, hover |
| `--border` | `#1f1f1f` | bordas e divisórias |
| `--text` | `#ffffff` | texto principal |
| `--text2` | `#888888` | texto secundário |
| `--text3` | `#444444` | texto terciário / placeholder |
| `--blue` | `#0EA5E9` | **acento** (links, ativos, progresso, foco) |

### Tema claro (usado em algumas seções da landing — opcional no app)
| Token | Hex |
|-------|-----|
| `--light-bg` | `#f7f7f5` |
| `--light-bg2` | `#ffffff` |
| `--light-border` | `#e4e4e0` |
| `--light-text` | `#0a0a0a` |
| `--light-text2` | `#6b6b68` |
| `--light-text3` | `#a8a8a4` |

### Cores semânticas de status (pills, eventos, finanças)
| Significado | Hex |
|-------------|-----|
| Sucesso / positivo / "lido" / "live" | `#34d399` (verde) |
| Atenção / "enviado" / "início" | `#fbbf24` (âmbar) |
| Info / "em dev" / acento | `#0EA5E9` (azul) |
| Neutro / "pausado" / "quero ler" | `#444444` (cinza = text3) |

O acento azul deve ser usado **com parcimônia** — só em ativos, progresso, foco e 1-2
palavras de destaque. O sistema é predominantemente preto e branco.

### Tailwind config (sugestão)
```ts
// tailwind.config.ts → theme.extend.colors
colors: {
  bg:   { DEFAULT: '#0a0a0a', 2: '#111111', 3: '#161616' },
  line: '#1f1f1f',
  ink:  { DEFAULT: '#ffffff', 2: '#888888', 3: '#444444' },
  brand:'#0EA5E9',
  ok:   '#34d399',
  warn: '#fbbf24',
}
```

---

## 2. Tipografia

Três famílias via Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Manrope:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

| Família | Pesos | Uso |
|---------|-------|-----|
| **Sora** | 700, 800 | display: títulos, números grandes, nomes (`.display`) |
| **Manrope** | 400, 500, 600 | corpo, UI, parágrafos |
| **JetBrains Mono** | 400, 500 | metadados, datas, valores técnicos, stacks |

### Escala (app interno)
| Elemento | Família | Tamanho | Peso | Tracking | Line-height |
|----------|---------|---------|------|----------|-------------|
| Título da página (`greet h1`) | Sora | 30px | 800 | -0.03em | 1.05 |
| Número grande (tile `.v`) | Sora | 30px | 800 | -0.03em | 1 |
| Título de card (`h3`) | Sora | 15px | 700 | -0.01em | 1.2 |
| Corpo / itens | Manrope | 13.5–14px | 400–500 | 0 | 1.5 |
| Label de tile (`.k`) | Manrope | 12px | 500 | 0 | 1.4 |
| Meta / data / mono | JetBrains Mono | 11–13px | 400–500 | 0 | 1.4 |
| Label de grupo na sidebar | Manrope | 10px | 600 | 0.13em UPPER | — |

> **Regra de tamanho mínimo:** nada de texto < 12px em telas (mobile hit targets ≥ 44px).

---

## 3. Espaçamento e raios

| Token | Valor |
|-------|-------|
| Raio de card | 8px |
| Raio de input/botão | 6px |
| Raio de pill | 100px |
| Raio de avatar/mark | 6–9px |
| Padding de card | 20px 22px |
| Gap entre cards | 14px |
| Padding do conteúdo | 30px 28px (desktop) / 22px 18px (mobile) |
| Largura da sidebar | 220px |
| Altura da topbar | 52px |

Grid de tiles: `repeat(4, 1fr)` desktop → `1fr 1fr` em ≤860px.
Grids de 2 colunas: `1.4fr 1fr` (`.g-2`) ou `1fr 1fr` (`.g-2b`) → `1fr` em ≤860px.

---

## 4. Transições e movimento

- Easing padrão: `cubic-bezier(0.22, 1, 0.36, 1)` (use como `ease-out` custom).
- Hover de itens: 0.18s. Reveal/entrada: 0.4–0.7s.
- **Números (count-up):** animar de 0 ao valor com `easeOutCubic`, ~1.2–1.7s. Componente `<Counter/>`.
- **Barras de progresso:** animar `width` de 0 ao alvo em 0.6s ao montar.
- Respeitar `prefers-reduced-motion: reduce` → mostrar estado final sem animar.
- Pulso do dot "ao vivo": box-shadow expandindo, 2s infinito.

---

## 5. Componentes base (`src/components/ui/`)

Recrie estes (estão todos visíveis no protótipo):

### `<Card>`
`bg-bg2 border border-line rounded-[8px] p-[20px_22px]`. Header opcional com `<h3>` (Sora 700,
15px) à esquerda e meta/ação à direita (12px; ação em hover vira azul).

### `<Button>`
- **primary:** fundo branco, texto `#0a0a0a`, peso 600, raio 6px, padding 11px 20px. Hover `#e9e9e9`, active `scale(.97)`.
- **ghost:** transparente, borda `--border`, texto branco. Hover borda `--text2`.
- **add (input):** fundo branco, compacto, usado ao lado de inputs ("Add"/"Adicionar").

### `<Tile>` (stat tile)
`bg-bg2 border rounded-[8px] p-[18px]`. Estrutura: label `.k` (12px text2) → valor `.v`
(Sora 800, 30px, com `.unit` menor em text2) → sub `.sub` (11.5px text3). Use `<Counter>` no valor.

### `<ProgressBar value={0..100}>`
Trilho `h-[5px] bg-bg3 rounded-[3px]`; preenchimento azul (ou branco com variante `white`),
anima width. 

### `<Pill variant>`
`inline-flex items-center gap-[6px] text-[11px] font-semibold px-[10px] py-[4px] rounded-full border`.
Variantes: `blue`, `green`, `amber`, `gray`. Tem um dot `6px` da cor à esquerda.

### `<Checkbox checked>`
18px, raio 5px, borda `#2e2e2e`. Checado: fundo azul + ✓ branco. Usado em tarefas e compras.
Item concluído: texto vira `--text3` com `line-through`.

### `<Counter target dec dur>`
Número que conta de 0 ao alvo no mount (easeOutCubic). Respeita reduced-motion.

### `<Greeting>`
Saudação dinâmica por hora: `<12h` "Bom dia", `<18h` "Boa tarde", senão "Boa noite" + ", Jean."
Subtexto com contagem de pendências reais.

---

## 6. AppShell / Sidebar / Topbar (medidas exatas)

### Sidebar (220px, fixa, `bg-bg2`, borda direita `--border`)
- Topo: marca (quadrado azul 28px com "JL" Sora 800 + "JL OS" Sora 700 15px), altura 52px, borda inferior.
- Grupos com label (10px, 0.13em, uppercase, text3): **Sistema, Produtividade, Finanças, Conhecimento, Vida, Conexões**.
- Item: ícone 15px + label 13px peso 500, padding 8px 10px, raio 6px. Hover/ativo: `bg-bg3` + texto branco.
  Item **ativo** ganha barra azul de 3px à esquerda (`::before`, 17px de altura).
- Rodapé: link "Voltar ao site" (ou logout no app real).

### Topbar (altura 52px, sticky, `rgba(10,10,10,.85)` + blur 12px, borda inferior)
- Esquerda: botão hambúrguer (só < 860px) + breadcrumb "JL OS / **\<view atual\>**".
- Direita: data atual (mono, `seg 06 jun`) + indicador "sincronizado" com dot pulsante.

### Responsivo
- ≤ 860px: sidebar vira drawer (`translateX(-100%)`, abre com `.open`), aparece scrim semi-preto, hambúrguer visível, `margin-left` do main vira 0.

### Ícones (lucide-react equivalentes)
Dashboard=`LayoutGrid`, Agenda=`Calendar`, Tarefas=`ListChecks`, Projetos=`FolderOpen`,
Metas=`Target`, Hábitos=`Clock`/`CircleDot`, Compras=`ShoppingCart`, Financeiro=`CircleDollarSign`,
Faturamento=`FileText`, Notas=`StickyNote`, Biblioteca=`BookOpen`, Estudos=`GraduationCap`,
Senhas=`Lock`, Corridas=`Activity`/`TrendingUp`, Integrações=`Share2`/`Workflow`.

---

## 7. Fundo do hero (landing — referência, não obrigatório no app)
O hero usa fundo full-bleed: camada de imagem (placeholder), canvas de partículas animadas
e um véu em degradê para legibilidade. No app interno isso não se aplica — fundo é `--bg` liso.
