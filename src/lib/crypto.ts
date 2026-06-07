/**
 * src/lib/crypto.ts
 *
 * Client-side AES-GCM encryption for the password vault.
 *
 * Flow:
 *   masterPassword + userSalt  →  PBKDF2 (100k rounds, SHA-256)  →  AES-GCM-256 CryptoKey
 *   CryptoKey + plaintext      →  encrypt()  →  { cipher: base64, iv: base64 }
 *   CryptoKey + cipher + iv    →  decrypt()  →  plaintext  (throws on wrong key)
 *
 * Security notes:
 *   - The master password and derived key NEVER leave the browser.
 *   - Only cipher + iv are stored in Supabase.
 *   - AES-GCM is authenticated: a wrong key throws a DOMException on decrypt.
 *   - Salt is derived from the user_id (unique per user, not secret).
 */

const PBKDF2_ITERATIONS = 100_000

/* ── Helpers ─────────────────────────────────────────────────── */

function bufferToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function base64ToUint8(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

/* ── Salt ────────────────────────────────────────────────────── */

/**
 * Derive a deterministic salt from the Supabase user_id UUID.
 * The UUID is 36 UTF-8 chars → 36 bytes — well above the 16-byte minimum.
 */
export function makeUserSalt(userId: string): Uint8Array {
  return new TextEncoder().encode(userId)
}

/* ── Key derivation ──────────────────────────────────────────── */

/**
 * Derive an AES-GCM-256 CryptoKey from a master password using PBKDF2.
 * This is intentionally slow (100k iterations) to resist brute-force.
 */
export async function deriveKey(
  masterPassword: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(masterPassword)

  const baseKey = await crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,          // non-extractable — key cannot be read back
    ['encrypt', 'decrypt'],
  )
}

/* ── Encrypt ─────────────────────────────────────────────────── */

/**
 * Encrypt a UTF-8 string with an AES-GCM key.
 * Returns base64-encoded cipher + iv strings suitable for DB storage.
 */
export async function encrypt(
  text: string,
  key: CryptoKey,
): Promise<{ cipher: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12))   // 96-bit nonce
  const encoded = new TextEncoder().encode(text)

  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded,
  )

  return {
    cipher: bufferToBase64(cipherBuf),
    iv: bufferToBase64(iv),
  }
}

/* ── Decrypt ─────────────────────────────────────────────────── */

/**
 * Decrypt an AES-GCM ciphertext.
 *
 * THROWS a DOMException (OperationError) if:
 *   - the key is wrong (wrong master password), or
 *   - the ciphertext has been tampered with.
 *
 * Callers should catch this and surface "Master password incorreto".
 */
export async function decrypt(
  cipher: string,
  iv: string,
  key: CryptoKey,
): Promise<string> {
  const cipherBuf = base64ToUint8(cipher)
  const ivBuf     = base64ToUint8(iv)

  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuf },
    key,
    cipherBuf,
  )

  return new TextDecoder().decode(plainBuf)
}
