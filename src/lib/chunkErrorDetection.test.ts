import { describe, it, expect, beforeEach } from 'vitest'
import { isChunkLoadError, shouldAutoReload } from './chunkErrorDetection'

describe('isChunkLoadError', () => {
  it('detects "Failed to fetch dynamically imported module"', () => {
    const err = new TypeError('Failed to fetch dynamically imported module: https://app.jlmos.com.br/assets/index-BOiuBRWp.js')
    expect(isChunkLoadError(err)).toBe(true)
  })

  it('detects "Loading chunk ... failed"', () => {
    expect(isChunkLoadError(new Error('Loading chunk 42 failed.'))).toBe(true)
  })

  it('detects "Loading CSS chunk ... failed"', () => {
    expect(isChunkLoadError(new Error('Loading CSS chunk 7 failed.'))).toBe(true)
  })

  it('detects "Importing a module script failed"', () => {
    expect(isChunkLoadError(new Error('Importing a module script failed.'))).toBe(true)
  })

  it('detects MIME type text/html mismatch', () => {
    const err = new Error('Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html".')
    expect(isChunkLoadError(err)).toBe(true)
  })

  it('does not flag an unrelated real error', () => {
    expect(isChunkLoadError(new TypeError("Cannot read properties of undefined (reading 'map')"))).toBe(false)
  })

  it('does not flag a non-Error value', () => {
    expect(isChunkLoadError('some string')).toBe(false)
    expect(isChunkLoadError(null)).toBe(false)
    expect(isChunkLoadError(undefined)).toBe(false)
  })
})

describe('shouldAutoReload', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('allows the first two attempts within the 30s window', () => {
    const t0 = 1_000_000
    expect(shouldAutoReload(t0)).toBe(true)
    expect(shouldAutoReload(t0 + 1000)).toBe(true)
  })

  it('blocks the third attempt within the 30s window', () => {
    const t0 = 1_000_000
    shouldAutoReload(t0)
    shouldAutoReload(t0 + 1000)
    expect(shouldAutoReload(t0 + 2000)).toBe(false)
  })

  it('allows attempts again once the window has passed', () => {
    const t0 = 1_000_000
    shouldAutoReload(t0)
    shouldAutoReload(t0 + 1000)
    expect(shouldAutoReload(t0 + 2000)).toBe(false)
    // 31s depois do primeiro attempt — janela de 30s já expirou
    expect(shouldAutoReload(t0 + 31_000)).toBe(true)
  })
})
