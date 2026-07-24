import type { FinLancamento, FinLancamentoTree, RecorrenciaFreq } from '../../types'

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

/** Avança uma data pro próximo ciclo de uma frequência de recorrência —
 * mesma regra já usada no formulário de "repetir" (mensal = mesmo dia do
 * mês seguinte, não só +30 dias, pra não derivar em datas erradas). */
export function advanceByFreq(date: Date, freq: RecorrenciaFreq): Date {
  if (freq === 'mensal') return new Date(date.getFullYear(), date.getMonth() + 1, date.getDate())
  if (freq === 'quinzenal') return new Date(date.getTime() + 14 * 24 * 60 * 60 * 1000)
  return new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000) // semanal
}

/**
 * Dado o último dia já existente de uma série recorrente, calcula quais
 * novas ocorrências (se houver) caem dentro do mês [monthStart, monthEnd]
 * sendo visualizado agora — gera sob demanda, nunca anos de registros de
 * uma vez. Respeita um teto opcional de "repetir até" (`ate`).
 */
export function computeMissingOccurrences(
  lastDate: Date,
  freq: RecorrenciaFreq,
  monthStart: Date,
  monthEnd: Date,
  ate: Date | null,
): Date[] {
  const dates: Date[] = []
  let current = advanceByFreq(lastDate, freq)
  let guard = 0
  while (current < monthStart && guard < 1000) {
    current = advanceByFreq(current, freq)
    guard++
  }
  guard = 0
  while (current <= monthEnd && guard < 1000) {
    if (ate && current > ate) break
    dates.push(new Date(current))
    current = advanceByFreq(current, freq)
    guard++
  }
  return dates
}
