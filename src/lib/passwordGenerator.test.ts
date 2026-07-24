import { describe, it, expect } from 'vitest'
import { generatePassword, MIN_LENGTH, MAX_LENGTH, DEFAULT_LENGTH } from './passwordGenerator'

const ALL_ON = { length: DEFAULT_LENGTH, uppercase: true, lowercase: true, numbers: true, symbols: true }

describe('generatePassword', () => {
  it('respects the requested length', () => {
    for (const length of [8, 16, 32, 64]) {
      const pw = generatePassword({ ...ALL_ON, length })
      expect(pw).toHaveLength(length)
    }
  })

  it('clamps length below the minimum', () => {
    const pw = generatePassword({ ...ALL_ON, length: 1 })
    expect(pw).toHaveLength(MIN_LENGTH)
  })

  it('clamps length above the maximum', () => {
    const pw = generatePassword({ ...ALL_ON, length: 1000 })
    expect(pw).toHaveLength(MAX_LENGTH)
  })

  it('only uses lowercase letters when only lowercase is enabled', () => {
    const pw = generatePassword({ length: 32, uppercase: false, lowercase: true, numbers: false, symbols: false })
    expect(pw).toMatch(/^[a-z]+$/)
  })

  it('only uses uppercase letters when only uppercase is enabled', () => {
    const pw = generatePassword({ length: 32, uppercase: true, lowercase: false, numbers: false, symbols: false })
    expect(pw).toMatch(/^[A-Z]+$/)
  })

  it('only uses digits when only numbers is enabled', () => {
    const pw = generatePassword({ length: 32, uppercase: false, lowercase: false, numbers: true, symbols: false })
    expect(pw).toMatch(/^[0-9]+$/)
  })

  it('only uses symbols when only symbols is enabled', () => {
    const pw = generatePassword({ length: 32, uppercase: false, lowercase: false, numbers: false, symbols: true })
    expect(pw).toMatch(/^[!@#$%^&*()_+\-=[\]{}|;:,.<>?]+$/)
  })

  it('returns an empty string when no character set is enabled', () => {
    const pw = generatePassword({ length: 16, uppercase: false, lowercase: false, numbers: false, symbols: false })
    expect(pw).toBe('')
  })

  it('includes at least one char from every enabled set (statistically, checked across many runs)', () => {
    for (let i = 0; i < 50; i++) {
      const pw = generatePassword(ALL_ON)
      expect(/[A-Z]/.test(pw)).toBe(true)
      expect(/[a-z]/.test(pw)).toBe(true)
      expect(/[0-9]/.test(pw)).toBe(true)
      expect(/[^A-Za-z0-9]/.test(pw)).toBe(true)
    }
  })

  it('never uses a disabled character set, even across many runs', () => {
    for (let i = 0; i < 50; i++) {
      const pw = generatePassword({ length: 24, uppercase: true, lowercase: true, numbers: false, symbols: false })
      expect(pw).toMatch(/^[A-Za-z]+$/)
    }
  })

  it('produces different passwords on successive calls (real randomness, not a fixed sequence)', () => {
    const passwords = new Set(Array.from({ length: 20 }, () => generatePassword(ALL_ON)))
    expect(passwords.size).toBeGreaterThan(1)
  })
})
