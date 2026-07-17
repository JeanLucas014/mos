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

## B3 — Padronizar tokens de cor (concluído, com 11 exceções documentadas)

O item B3 do audit pedia para substituir `#0EA5E9`/`#555`/`#aaa` hardcoded
pelos tokens do design system. Escopo final: 433 → 11 ocorrências restantes
(309 → 11 na segunda rodada, depois de 124 já resolvidas nos 3 arquivos
originais). As 11 que ficaram são intencionais, não esquecidas:

- **Defaults de dados** (nunca devem virar token, são valores armazenados):
  `EventModal.tsx:52`, `RotinaTab.tsx:14`, `Agenda/index.tsx:267`,
  `Tarefas/index.tsx:171,244`, `ProjectModal.tsx:19` (cor padrão de
  evento/rotina/projeto/tarefa) e `ProjectModal.tsx:6` (paleta de swatches
  selecionáveis — os valores em si são os dados).
- **Concatenação de alpha** (quebraria com `var()`, precisa de CSS var
  dedicada por opacidade ou `color-mix()`): `GoalsPage.tsx:432` (`c` vira
  `${c}50` na linha 434), `ShoppingPage.tsx:130` (`+ '22'`),
  `SistemasPage.tsx` (paleta local `const C = {...}` inteira, usada com
  `+ 'NN'` em vários lugares), `GoalsPage.tsx:18` (`AREA_COLOR.carreira`
  flui por `aColor()` até o mesmo padrão de concat).

Todo o resto (~298 ocorrências) foi convertido para tokens do design
system (`text-brand`, `bg-brand`, `border-brand`, `text-ink-3`,
`text-ink-2`, `var(--blue)`, `var(--text2)`), verificado sem regressão
via `tsc` + build + grep por padrões de concat quebrados.

## B15 — Virtualização de listas longas (não implementado)

O item B15 do audit pedia virtualização do Extrato (MesTab) e da
Biblioteca com `react-window` ou `@tanstack/react-virtual`. Não
implementado nesta rodada por dois motivos:

1. **Extrato**: os blocos têm altura variável (item avulso vs. grupo
   com N filhos expandidos), o que exige o modo de tamanho variável do
   virtualizador — mais complexo de acertar sem quebrar o agrupamento
   visual, e a lista é escopada por mês (dezenas de itens, não
   milhares), então o ganho real de performance é baixo.
2. **Biblioteca**: usa um grid responsivo (colunas variam por
   viewport) com seções agrupadas por status E dois modos de
   visualização (grid/lista) — virtualizar grid responsivo é um dos
   padrões mais complexos de acertar, e este projeto tem uso pessoal
   (1 usuário), improvável de chegar a milhares de livros.

Se o volume de dados crescer a ponto de a performance de render virar
problema real (não é o caso hoje), vale revisitar com
`@tanstack/react-virtual` (suporta tamanho variável e é o mais
flexível para grid), testando visualmente em navegador antes de
mesclar — este item precisa de QA visual que não foi possível fazer
nesta sessão.
