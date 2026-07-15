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
