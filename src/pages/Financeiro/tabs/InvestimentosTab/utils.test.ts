import { describe, it, expect } from 'vitest'
import { calcRentabilidadeRF, valorEstimadoRF, rentabilidadeVariavel, valorPosicao } from './utils'
import type { Investimento, Taxa } from './types'

function makeInv(overrides: Partial<Investimento> = {}): Investimento {
  return {
    id: '1',
    user_id: 'u1',
    nome: 'Teste',
    tipo: 'renda_fixa',
    cor: '#22c55e',
    ativo: true,
    criado_em: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const TAXAS: Taxa[] = [
  { indicador: 'CDI',   valor_anual: 13.65, valor_mensal: 1.1, data_referencia: '2026-01-01', atualizado_em: '2026-01-01' },
  { indicador: 'SELIC', valor_anual: 13.75, valor_mensal: 1.1, data_referencia: '2026-01-01', atualizado_em: '2026-01-01' },
  { indicador: 'IPCA',  valor_anual: 4.83,  valor_mensal: 0.4, data_referencia: '2026-01-01', atualizado_em: '2026-01-01' },
]

describe('calcRentabilidadeRF', () => {
  it('returns null without data_compra', () => {
    const inv = makeInv({ data_compra: undefined, valor_aplicado: 1000 })
    expect(calcRentabilidadeRF(inv, TAXAS)).toBeNull()
  })

  it('returns null without valor_aplicado', () => {
    const inv = makeInv({ data_compra: '2026-01-01', valor_aplicado: undefined })
    expect(calcRentabilidadeRF(inv, TAXAS)).toBeNull()
  })

  it('returns null when valor_aplicado is 0', () => {
    const inv = makeInv({ data_compra: '2026-01-01', valor_aplicado: 0 })
    expect(calcRentabilidadeRF(inv, TAXAS)).toBeNull()
  })

  it('returns close to 0 for a purchase made today (no elapsed time)', () => {
    const inv = makeInv({ data_compra: new Date().toISOString().slice(0, 10), valor_aplicado: 1000, indexador: 'PREFIXADO', taxa_adicional: 10 })
    expect(Math.abs(calcRentabilidadeRF(inv, TAXAS)!)).toBeLessThan(1)
  })

  it('falls back to default CDI rate when no matching taxa is found', () => {
    const inv = makeInv({ data_compra: '2020-01-01', valor_aplicado: 1000, indexador: 'CDI', taxa_adicional: 100 })
    expect(calcRentabilidadeRF(inv, [])).toBeGreaterThan(0)
  })

  it('returns close to 0 for an unknown indexador (no rate applied)', () => {
    const inv = makeInv({ data_compra: new Date().toISOString().slice(0, 10), valor_aplicado: 1000, indexador: 'OUTRO' })
    expect(Math.abs(calcRentabilidadeRF(inv, TAXAS)!)).toBeLessThan(1)
  })
})

describe('valorEstimadoRF', () => {
  it('returns 0 when there is no valor_aplicado', () => {
    const inv = makeInv({ valor_aplicado: undefined })
    expect(valorEstimadoRF(inv, TAXAS)).toBe(0)
  })

  it('returns valor_aplicado unchanged when there is no data_compra', () => {
    const inv = makeInv({ valor_aplicado: 500, data_compra: undefined })
    expect(valorEstimadoRF(inv, TAXAS)).toBe(500)
  })

  it('grows the applied value for a past purchase with positive rate', () => {
    const inv = makeInv({ valor_aplicado: 1000, data_compra: '2020-01-01', indexador: 'CDI', taxa_adicional: 100 })
    expect(valorEstimadoRF(inv, TAXAS)).toBeGreaterThan(1000)
  })
})

describe('rentabilidadeVariavel', () => {
  it('returns null without valor_atual', () => {
    expect(rentabilidadeVariavel(makeInv({ valor_atual: undefined, valor_aplicado: 100 }))).toBeNull()
  })

  it('returns null without valor_aplicado', () => {
    expect(rentabilidadeVariavel(makeInv({ valor_atual: 100, valor_aplicado: undefined }))).toBeNull()
  })

  it('returns null when valor_aplicado is 0 (avoids division by zero)', () => {
    expect(rentabilidadeVariavel(makeInv({ valor_atual: 100, valor_aplicado: 0 }))).toBeNull()
  })

  it('computes positive percentage gain', () => {
    expect(rentabilidadeVariavel(makeInv({ valor_atual: 150, valor_aplicado: 100 }))).toBeCloseTo(50, 5)
  })

  it('computes negative percentage loss', () => {
    expect(rentabilidadeVariavel(makeInv({ valor_atual: 50, valor_aplicado: 100 }))).toBeCloseTo(-50, 5)
  })
})

describe('valorPosicao', () => {
  it('returns 0 for renda_fixa (tracked via valorEstimadoRF instead)', () => {
    expect(valorPosicao(makeInv({ tipo: 'renda_fixa', valor_atual: 999 }))).toBe(0)
  })

  it('returns 0 for previdencia', () => {
    expect(valorPosicao(makeInv({ tipo: 'previdencia', valor_atual: 999 }))).toBe(0)
  })

  it('prefers valor_atual when present', () => {
    expect(valorPosicao(makeInv({ tipo: 'acoes', valor_atual: 300, quantidade: 10, preco_medio: 20 }))).toBe(300)
  })

  it('falls back to quantidade * preco_medio', () => {
    expect(valorPosicao(makeInv({ tipo: 'acoes', valor_atual: undefined, quantidade: 10, preco_medio: 20 }))).toBe(200)
  })

  it('falls back to valor_aplicado when nothing else is set', () => {
    expect(valorPosicao(makeInv({ tipo: 'acoes', valor_atual: undefined, quantidade: undefined, preco_medio: undefined, valor_aplicado: 75 }))).toBe(75)
  })

  it('returns 0 when nothing is set', () => {
    expect(valorPosicao(makeInv({ tipo: 'acoes' }))).toBe(0)
  })
})
