/**
 * Gerador de senhas do Cofre — sempre via crypto.getRandomValues() (fonte
 * criptograficamente segura), nunca Math.random().
 */

export interface PasswordGeneratorOptions {
  length: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
}

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const NUMBERS = '0123456789'
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'

export const MIN_LENGTH = 8
export const MAX_LENGTH = 64
export const DEFAULT_LENGTH = 16

/** Índice aleatório em [0, max) via crypto.getRandomValues — o viés do
 * módulo é desprezível pros tamanhos de conjunto de caracteres aqui
 * (no máximo ~90 símbolos, bem abaixo de 2^32). */
function randomIndex(max: number): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % max
}

/**
 * Gera uma senha aleatória respeitando comprimento e conjuntos de
 * caracteres ativos. Garante ao menos 1 caractere de cada conjunto
 * ativado (senão uma senha de 16 chars com símbolos ativos poderia sair,
 * por azar, sem nenhum símbolo) e embaralha o resultado com Fisher-Yates
 * pra esses caracteres garantidos não ficarem sempre nas primeiras
 * posições. Retorna string vazia se nenhum conjunto estiver ativo.
 */
export function generatePassword(options: PasswordGeneratorOptions): string {
  const pools: string[] = []
  if (options.uppercase) pools.push(UPPER)
  if (options.lowercase) pools.push(LOWER)
  if (options.numbers) pools.push(NUMBERS)
  if (options.symbols) pools.push(SYMBOLS)
  if (pools.length === 0) return ''

  const length = Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, Math.round(options.length)))
  const allChars = pools.join('')

  const result: string[] = pools.map((pool) => pool[randomIndex(pool.length)])
  for (let i = result.length; i < length; i++) {
    result.push(allChars[randomIndex(allChars.length)])
  }

  for (let i = result.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result.slice(0, length).join('')
}
