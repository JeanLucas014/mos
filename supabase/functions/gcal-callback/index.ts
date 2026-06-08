/**
 * gcal-callback — OAuth 2.0 redirect handler for Google Calendar.
 *
 * Google redirects here (browser GET) AFTER the user authorises —
 * there is NO Authorization header in this request. JWT verification is
 * disabled via supabase/config.toml ([functions.gcal-callback] verify_jwt = false)
 * and the --no-verify-jwt flag at deploy time.
 *
 * The user is identified via the `state` param, which was set by
 * gcal-auth-url as: btoa(JSON.stringify({ userId, returnUrl }))
 *
 * Required Supabase secrets:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   TOKEN_ENCRYPTION_KEY
 *
 * On success: redirects to https://app.jlmos.com.br/agenda?connected=true
 * On error:   redirects to https://app.jlmos.com.br/agenda?error=<reason>
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const APP_BASE       = 'https://app.jlmos.com.br/agenda'
const REDIRECT_URI   = 'https://fuykgxogvqvfwzqfigxz.supabase.co/functions/v1/gcal-callback'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'

/* ── AES-GCM helpers (key = SHA-256 of secret) ────────────────── */

async function aesKey(secret: string, usage: 'encrypt' | 'decrypt'): Promise<CryptoKey> {
  const raw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, [usage])
}

async function encrypt(plaintext: string, secret: string): Promise<string> {
  const key = await aesKey(secret, 'encrypt')
  const iv  = crypto.getRandomValues(new Uint8Array(12))
  const ct  = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext),
  )
  const out = new Uint8Array(12 + ct.byteLength)
  out.set(iv)
  out.set(new Uint8Array(ct), 12)
  return btoa(String.fromCharCode(...out))
}

/* ── State decoder ────────────────────────────────────────────── */

function decodeState(state: string): { userId: string; returnUrl: string } | null {
  try {
    const parsed = JSON.parse(atob(state))
    if (!parsed?.userId) return null
    return { userId: parsed.userId, returnUrl: parsed.returnUrl ?? '/agenda' }
  } catch {
    return null
  }
}

/* ── Handler ──────────────────────────────────────────────────── */

Deno.serve(async (req: Request) => {
  const url      = new URL(req.url)
  const code     = url.searchParams.get('code')
  const stateRaw = url.searchParams.get('state')
  const errParam = url.searchParams.get('error')

  /* Google returned an error (user denied, etc.) */
  if (errParam) {
    return Response.redirect(`${APP_BASE}?error=${encodeURIComponent(errParam)}`, 302)
  }
  if (!code || !stateRaw) {
    return Response.redirect(`${APP_BASE}?error=missing_params`, 302)
  }

  try {
    /* ── Decode state → userId ── */
    const stateData = decodeState(stateRaw)
    if (!stateData) {
      return Response.redirect(`${APP_BASE}?error=invalid_state`, 302)
    }
    const { userId } = stateData

    /* ── Load secrets ── */
    const clientId     = Deno.env.get('GOOGLE_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
    const encKey       = Deno.env.get('TOKEN_ENCRYPTION_KEY')

    if (!clientId || !clientSecret || !encKey) {
      console.error('[gcal-callback] missing secrets')
      return Response.redirect(`${APP_BASE}?error=server_misconfigured`, 302)
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
      access_token:  string
      refresh_token?: string
      expires_in:    number
      scope:         string
      token_type:    string
    }

    /* ── Encrypt tokens ── */
    const accessCipher  = await encrypt(tokens.access_token, encKey)
    const refreshCipher = tokens.refresh_token
      ? await encrypt(tokens.refresh_token, encKey)
      : null
    const expiresAt = Date.now() + tokens.expires_in * 1000

    /* ── Upsert via service role (no RLS bypass needed) ── */
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
      console.error('[gcal-callback] db upsert failed:', dbErr.message)
      return Response.redirect(`${APP_BASE}?error=db_error`, 302)
    }

    return Response.redirect(`${APP_BASE}?connected=true`, 302)
  } catch (err) {
    console.error('[gcal-callback] unexpected error:', err)
    return Response.redirect(`${APP_BASE}?error=server_error`, 302)
  }
})
