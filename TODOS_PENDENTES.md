# TODOs Pendentes

Gerado durante a correção do item M18 do `MOS_AUDIT.md`.

## Resultado da varredura (2026-07-15)

```
grep -rn "TODO\|FIXME\|HACK" src/ supabase/
```

Nenhuma ocorrência encontrada em `src/` ou `supabase/`. O audit apontava ~38
marcadores, mas o codebase atual está limpo — provavelmente já foram
resolvidos durante o refactor M8 (extração de componentes/hooks) ou o
audit reflete um estado anterior do código.

Nenhum item pendente de decisão de produto neste momento. Se novos
TODO/FIXME/HACK forem introduzidos no futuro, adicione aqui: arquivo,
linha e descrição, antes de resolver ou descartar.

## B3 — Padronizar tokens de cor (parcial)

O item B3 do audit pedia para substituir `#0EA5E9`/`#555`/`#aaa` hardcoded
pelos tokens do design system (`text-brand`, `text-ink-3`, etc.). O escopo
real é ~433 ocorrências no projeto todo — bem maior que os 3 arquivos
citados como exemplo no audit (ConfigTab, MesTab, Tarefas/index).

Por decisão do usuário, o trabalho foi limitado a esses 3 arquivos/pastas
(commit `cd581b3`). As demais ~300 ocorrências espalhadas por outras
páginas/componentes ficam pendentes — muitas são constantes de paleta
locais por arquivo (`const C = { b: '#0EA5E9', ... }`) usadas com
concatenação de alpha (`C.b + '18'`), que exigem uma abordagem diferente
(não dá pra trocar direto por `var(--brand)`, pois não é possível
concatenar sufixo hex numa referência `var()`). Se for retomar, vale
separar em duas frentes: (1) classes Tailwind arbitrary-value simples
(substituição direta, como feito aqui) e (2) paletas locais com alpha
(precisam de CSS vars dedicadas por opacidade, ou `color-mix()`).
