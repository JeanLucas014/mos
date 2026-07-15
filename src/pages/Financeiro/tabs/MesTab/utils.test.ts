import { describe, it, expect } from 'vitest'
import { daysInMonth, buildTree, sumLeaves } from './utils'
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
