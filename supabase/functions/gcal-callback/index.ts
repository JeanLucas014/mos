/**
 * gcal-callback — OAuth 2.0 redirect handler for Google Calendar.
 *
 * Google redirects here after user authorizes:
 *   GET /functions/v1/gcal-callback?code=...&state=...
 *
 * Required Supabase secrets:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   TOKEN_ENCRYPTION_KEY
 *
 * On success: redirects to https://app.jlmos.com.br/agenda?connected=true
 * On error:   redirects to https://app.jlmos.com.br/agenda?error=...
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const REDIRECT_URI   = 'https://fuykgxogvqvfwzqfigxz.supabase.co/functions/v1/gcal-callback'
const APP_BASE       = 'https://app.jlmos.com.br/agenda'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'

/* ── Crypto helpers ────────────────────────────────────────────── */

/** SHA-256 the secret to get a 32-byte AES key. */
async function aesKey(secret: string, usage: 'encrypt' | 'decrypt'): Promise<CryptoKey> {
  const rawKey = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  return crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, [usage])
}

async function encrypt(plaintext: string, secret: string): Promise<string> {
  const key = await aesKey(secret, 'encrypt')
  const iv  = crypto.getRandomValues(new Uint8Array(12))
  const ct  = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext))
  const combined = new Uint8Array(12 + ct.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ct), 12)
  return btoa(String.fromCharCode(...combined))
}

/** Verify HMAC-signed state and return userId, or null if invalid. */
async function verifyState(state: string, secret: string): Promise<string | null> {
  try {
    const [msgB64, sigHex] = state.split('.')
    if (!msgB64 || !sigHex) return null
    const msg    = atob(msgB64)
    const userId = msg.split(':')[0]
    const key    = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    )
    const sigBytes = new Uint8Array((sigHex.match(/.{2}/g) ?? []).map(h => parseInt(h, 16)))
    const valid    = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(msg))
    return valid ? userId : null
  } catch {
    return null
  }
}

Deno.serve(async (req: Request) => {
  const url    = new URL(req.url)
  const code   = url.searchParams.get('code')
  const state  = url.searchParams.get('state')
  const errParam = url.searchParams.get('error')

  /* User denied access */
  if (errParam) {
    return Response.redirect(`${APP_BASE}?error=${encodeURIComponent(errParam)}`, 302)
  }
  if (!code || !state) {
    return Response.redirect(`${APP_BASE}?error=missing_params`, 302)
  }

  try {
    const clientId     = Deno.env.get('GOOGLE_CLIENT_ID')!
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!
    const encKey       = Deno.env.get('TOKEN_ENCRYPTION_KEY')!

    /* ── Verify state → extract userId ── */
    const userId = await verifyState(state, encKey)
    if (!userId) {
      return Response.redirect(`${APP_BASE}?error=invalid_state`, 302)
    }

    /* ── Exchange code for tokens ── */
    const tokenResp = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  REDIRECT_URI,
        grant_type:    'authorization_code',
      }),
    })

    if (!tokenResp.ok) {
      const body = await tokenResp.text()
      console.error('[gcal-callback] token exchange failed:', body)
      return Response.redirect(`${APP_BASE}?error=token_exchange_failed`, 302)
    }

    const tokens = await tokenResp.json() as {
      access_token: string
      refresh_token?: string
      expires_in: number
      scope: string
      token_type: string
    }

    /* ── Encrypt tokens ── */
    const accessCipher  = await encrypt(tokens.access_token, encKey)
    const refreshCipher = tokens.refresh_token
      ? await encrypt(tokens.refresh_token, encKey)
      : null
    const expiresAt     = Date.now() + tokens.expires_in * 1000

    /* ── Upsert into integrations (service role — no RLS) ── */
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { error: dbErr } = await admin.from('integrations').upsert(
      {
        user_id:              userId,
        provider:             'gcal',
        connected:            true,
        access_token_cipher:  accessCipher,
        refresh_token_cipher: refreshCipher,
        meta:                 { expires_at: expiresAt, scope: tokens.scope },
        updated_at:           new Date().toISOString(),
      },
      { onConflict: 'user_id,provider' },
    )

    if (dbErr) {
      console.error('[gcal-callback] db upsert failed:', dbErr)
      return Response.redirect(`${APP_BASE}?error=db_error`, 302)
    }

    return Response.redirect(`${APP_BASE}?connected=true`, 302)
  } catch (err) {
    console.error('[gcal-callback] unexpected error:', err)
    return Response.redirect(`${APP_BASE}?error=server_error`, 302)
  }
})
