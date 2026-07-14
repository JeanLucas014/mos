import type { FinLancamento, FinLancamentoTree } from '../../types'

export const MS_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
export const MS_OPT  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
export const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

export function buildTree(items: FinLancamento[]): FinLancamentoTree[] {
  const map = new Map<string, FinLancamentoTree>()
  for (const item of items) map.set(item.id, { ...item, children: [], valorTotal: 0 })
  const roots: FinLancamentoTree[] = []
  for (const node of map.values()) {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  function calc(node: FinLancamentoTree): number {
    if (!node.is_grupo) { node.valorTotal = node.valor ?? 0; return node.valorTotal }
    node.valorTotal = node.children.reduce((s, c) => s + calc(c), 0)
    return node.valorTotal
  }
  roots.forEach(calc)
  return roots
}

export function sumLeaves(node: FinLancamentoTree): number {
  if (!node.is_grupo) return node.valor ?? 0
  return node.children.reduce((s, c) => s + sumLeaves(c), 0)
}
