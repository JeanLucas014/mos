import { describe, it, expect } from 'vitest'
import { fmt, fmtDate, isPaid } from './utils'
import type { Invoice } from './types'

describe('fmt', () => {
  it('formats cents as BRL currency', () => {
    expect(fmt(240000)).toBe((2400).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
  })

  it('formats zero cents', () => {
    expect(fmt(0)).toBe((0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
  })

  it('formats negative cents', () => {
    expect(fmt(-15000)).toBe((-150).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
  })
})

describe('fmtDate', () => {
  it('returns null for null input', () => {
    expect(fmtDate(null)).toBeNull()
  })

  it('reformats an ISO date to dd/mm/yyyy', () => {
    expect(fmtDate('2026-03-05')).toBe('05/03/2026')
  })
})

describe('isPaid', () => {
  function makeInvoice(status: string): Invoice {
    return {
      id: '1', user_id: 'u1', service: 'Teste', client: '', amount_cents: 1000,
      status: status as Invoice['status'], due_date: null, created_at: '2026-01-01T00:00:00Z',
    }
  }

  it('returns true when status is pago', () => {
    expect(isPaid(makeInvoice('pago'))).toBe(true)
  })

  it('returns false for other statuses', () => {
    expect(isPaid(makeInvoice('enviado'))).toBe(false)
  })
})
