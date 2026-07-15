import { describe, it, expect } from 'vitest'
import { formatLocalDate, todayLocal, addDaysLocal, daysAgoLocal } from './dates'

describe('formatLocalDate', () => {
  it('pads month and day with zero', () => {
    expect(formatLocalDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('handles December correctly', () => {
    expect(formatLocalDate(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})

describe('todayLocal', () => {
  it('matches the local date components of "now"', () => {
    const now = new Date()
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    expect(todayLocal()).toBe(expected)
  })
})

describe('addDaysLocal', () => {
  it('adds positive days within the same month', () => {
    expect(addDaysLocal('2026-01-05', 3)).toBe('2026-01-08')
  })

  it('subtracts days with a negative offset', () => {
    expect(addDaysLocal('2026-01-05', -3)).toBe('2026-01-02')
  })

  it('rolls over to the next month', () => {
    expect(addDaysLocal('2026-01-31', 1)).toBe('2026-02-01')
  })

  it('rolls over to the next year', () => {
    expect(addDaysLocal('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('rolls back across a month boundary', () => {
    expect(addDaysLocal('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('handles leap year Feb 29 rollover', () => {
    expect(addDaysLocal('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDaysLocal('2028-02-29', 1)).toBe('2028-03-01')
  })

  it('is a no-op when adding zero days', () => {
    expect(addDaysLocal('2026-06-15', 0)).toBe('2026-06-15')
  })
})

describe('daysAgoLocal', () => {
  it('returns todayLocal when days is 0', () => {
    expect(daysAgoLocal(0)).toBe(todayLocal())
  })

  it('returns a date before today for a positive offset', () => {
    const result = daysAgoLocal(10)
    expect(new Date(result + 'T00:00:00').getTime()).toBeLessThan(new Date(todayLocal() + 'T00:00:00').getTime())
  })
})
