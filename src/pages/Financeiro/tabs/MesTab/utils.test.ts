import { describe, it, expect } from 'vitest'
import { daysInMonth, buildTree, sumLeaves, advanceByFreq, computeMissingOccurrences } from './utils'
import type { FinLancamento } from '../../types'

function makeItem(overrides: Partial<FinLancamento>): FinLancamento {
  return {
    id: overrides.id ?? '1',
    user_id: 'u1',
    ano_id: 'a1',
    parent_id: null,
    data: '2026-01-01',
    natureza: 'saida',
    nome: 'Item',
    valor: null,
    is_grupo: false,
    categoria_id: null,
    cartao_id: null,
    saida_tipo: null,
    ordem: 0,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('daysInMonth', () => {
  it('returns 31 for January', () => {
    expect(daysInMonth(2026, 1)).toBe(31)
  })

  it('returns 28 for February in a non-leap year', () => {
    expect(daysInMonth(2026, 2)).toBe(28)
  })

  it('returns 29 for February in a leap year', () => {
    expect(daysInMonth(2028, 2)).toBe(29)
  })

  it('returns 30 for April', () => {
    expect(daysInMonth(2026, 4)).toBe(30)
  })
})

describe('buildTree + sumLeaves', () => {
  it('handles a flat list of leaf items with no groups', () => {
    const items = [
      makeItem({ id: '1', valor: 100 }),
      makeItem({ id: '2', valor: -50 }),
    ]
    const tree = buildTree(items)
    expect(tree).toHaveLength(2)
    expect(tree.reduce((s, n) => s + sumLeaves(n), 0)).toBe(50)
  })

  it('sums nested group totals recursively', () => {
    const items = [
      makeItem({ id: 'group', is_grupo: true, valor: null }),
      makeItem({ id: 'child1', parent_id: 'group', valor: 200 }),
      makeItem({ id: 'child2', parent_id: 'group', valor: 300 }),
    ]
    const tree = buildTree(items)
    expect(tree).toHaveLength(1)
    expect(tree[0].valorTotal).toBe(500)
    expect(sumLeaves(tree[0])).toBe(500)
  })

  it('treats a null valor on a leaf as 0', () => {
    const items = [makeItem({ id: '1', valor: null, is_grupo: false })]
    const tree = buildTree(items)
    expect(sumLeaves(tree[0])).toBe(0)
  })

  it('treats a group with a missing parent reference as a root', () => {
    const items = [makeItem({ id: '1', parent_id: 'missing-parent', valor: 10 })]
    const tree = buildTree(items)
    expect(tree).toHaveLength(1)
    expect(tree[0].id).toBe('1')
  })

  it('nets negative and positive values across nested groups', () => {
    const items = [
      makeItem({ id: 'group', is_grupo: true, valor: null }),
      makeItem({ id: 'child1', parent_id: 'group', valor: -400 }),
      makeItem({ id: 'child2', parent_id: 'group', valor: 100 }),
    ]
    const tree = buildTree(items)
    expect(tree[0].valorTotal).toBe(-300)
  })
})

describe('advanceByFreq', () => {
  it('mensal avança pro mesmo dia do mês seguinte', () => {
    const next = advanceByFreq(new Date(2026, 0, 10), 'mensal') // 10 jan
    expect(next.getMonth()).toBe(1) // fevereiro
    expect(next.getDate()).toBe(10)
  })

  it('mensal em dia que não existe no mês seguinte transborda pro mês depois (comportamento herdado do form de repetir já existente)', () => {
    const next = advanceByFreq(new Date(2026, 0, 31), 'mensal') // 31 jan — fev não tem 31
    expect(next.getMonth()).toBe(2) // março, não fevereiro
  })

  it('quinzenal avança 14 dias corridos', () => {
    const next = advanceByFreq(new Date(2026, 0, 1), 'quinzenal')
    expect(next.getDate()).toBe(15)
    expect(next.getMonth()).toBe(0)
  })

  it('semanal avança 7 dias corridos', () => {
    const next = advanceByFreq(new Date(2026, 0, 1), 'semanal')
    expect(next.getDate()).toBe(8)
  })
})

describe('computeMissingOccurrences', () => {
  it('gera exatamente 1 ocorrência mensal pro mês seguinte', () => {
    const last = new Date(2026, 0, 10) // 10 jan
    const monthStart = new Date(2026, 1, 1) // fev
    const monthEnd = new Date(2026, 1, 28)
    const occ = computeMissingOccurrences(last, 'mensal', monthStart, monthEnd, null)
    expect(occ).toHaveLength(1)
    expect(occ[0].getDate()).toBe(10)
    expect(occ[0].getMonth()).toBe(1)
  })

  it('pula meses sem navegação — gera a ocorrência certa mesmo se a última instância for de vários meses atrás', () => {
    const last = new Date(2026, 0, 10) // 10 jan
    const monthStart = new Date(2026, 4, 1) // maio
    const monthEnd = new Date(2026, 4, 31)
    const occ = computeMissingOccurrences(last, 'mensal', monthStart, monthEnd, null)
    expect(occ).toHaveLength(1)
    expect(occ[0].getMonth()).toBe(4)
    expect(occ[0].getDate()).toBe(10)
  })

  it('gera múltiplas ocorrências semanais dentro do mesmo mês', () => {
    const last = new Date(2026, 0, 1) // 1 jan (quinta)
    const monthStart = new Date(2026, 0, 1)
    const monthEnd = new Date(2026, 0, 31)
    const occ = computeMissingOccurrences(last, 'semanal', monthStart, monthEnd, null)
    // 8, 15, 22, 29 jan
    expect(occ.map(d => d.getDate())).toEqual([8, 15, 22, 29])
  })

  it('respeita o teto opcional "repetir até"', () => {
    const last = new Date(2026, 0, 10)
    const monthStart = new Date(2026, 1, 1)
    const monthEnd = new Date(2026, 1, 28)
    const ate = new Date(2026, 0, 20) // antes do mês seguinte
    const occ = computeMissingOccurrences(last, 'mensal', monthStart, monthEnd, ate)
    expect(occ).toHaveLength(0)
  })

  it('não gera nada se a última instância já é deste mês ou depois', () => {
    const last = new Date(2026, 1, 10) // já é fev
    const monthStart = new Date(2026, 1, 1)
    const monthEnd = new Date(2026, 1, 28)
    const occ = computeMissingOccurrences(last, 'mensal', monthStart, monthEnd, null)
    expect(occ).toHaveLength(0)
  })
})
