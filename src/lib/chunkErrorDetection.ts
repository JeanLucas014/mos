/**
 * Detecção do erro clássico de code-splitting + deploy contínuo: o
 * navegador tem HTML antigo referenciando chunks .js com hash específico;
 * um deploy novo apaga esses arquivos do servidor; ao navegar pra uma rota
 * lazy, o fetch do chunk falha (a Vercel responde com o HTML da 404, daí
 * o "MIME type text/html" onde se esperava JS). Não é bug de código —
 * ver ErrorBoundary.tsx pra como isso é tratado (reload automático em vez
 * da tela genérica de erro).
 */

const CHUNK_ERROR_PATTERNS: RegExp[] = [
  /failed to fetch dynamically imported module/i,
  /loading chunk [\w.-]* ?failed/i,
  /loading css chunk [\w.-]* ?failed/i,
  /importing a module script failed/i,
]

export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const message = error.message ?? ''
  if (CHUNK_ERROR_PATTERNS.some((re) => re.test(message))) return true
  if (/mime type/i.test(message) && /text\/html/i.test(message)) return true
  return false
}

const STORAGE_KEY = 'mos-chunk-reload-attempts'
const WINDOW_MS = 30_000
const MAX_ATTEMPTS = 2

function readAttempts(): number[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === 'number') : []
  } catch {
    return []
  }
}

function writeAttempts(attempts: number[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attempts))
  } catch {
    // sessionStorage indisponível (modo privado, quota etc.) — sem
    // contagem persistida, mas não deve quebrar o fluxo de reload.
  }
}

/**
 * Registra uma tentativa de auto-reload e diz se ela deve de fato
 * acontecer — protege contra loop infinito quando o problema NÃO é chunk
 * antigo (ex: servidor caído), caso em que recarregar sem parar só piora.
 * No máximo MAX_ATTEMPTS reloads dentro da janela de WINDOW_MS.
 */
export function shouldAutoReload(now: number = Date.now()): boolean {
  const recent = readAttempts().filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_ATTEMPTS) {
    writeAttempts(recent)
    return false
  }
  recent.push(now)
  writeAttempts(recent)
  return true
}
