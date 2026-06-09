/**
 * strava-callback — OAuth 2.0 redirect handler for Strava.
 *
 * JWT verification DISABLED (browser redirect from Strava has no JWT).
 * User identified via `state` param: btoa(JSON.stringify({ userId }))
 *
 * Required secrets:
 *   STRAVA_CLIENT_ID
 *   STRAVA_CLIENT_SECRET
 *   TOKEN_ENCRYPTION_KEY
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const APP_BASE = 'https://app.jlmos.com.br/integracoes'

/* ── AES-GCM helpers ──────────────────────────────────────────── */
async function aesKey(secret: string, usage: 'encrypt' | 'decrypt'): Promise<CryptoKey> {
  const raw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, [usage])
}

async function encrypt(plaintext: string, secret: string): Promise<string> {
  const key = await aesKey(secret, 'encrypt')
  const iv  = crypto.getRandomValues(new Uint8Array(12))
  const ct  = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext))
  const out = new Uint8Array(12 + ct.byteLength)
  out.set(iv); out.set(new Uint8Array(ct), 12)
  return btoa(String.fromCharCode(...out))
}

Deno.serve(async (req: Request) => {
  const url      = new URL(req.url)
  const code     = url.searchParams.get('code')
  const stateRaw = url.searchParams.get('state')
  const errParam = url.searchParams.get('error')

  if (errParam) return Response.redirect(`${APP_BASE}?error=${encodeURIComponent(errParam)}`, 302)
  if (!code || !stateRaw) return Response.redirect(`${APP_BASE}?error=missing_params`, 302)

  try {
    const parsed = JSON.parse(atob(stateRaw))
    const userId = parsed?.userId
    if (!userId) return Response.redirect(`${APP_BASE}?error=invalid_state`, 302)

    const clientId     = Deno.env.get('STRAVA_CLIENT_ID')
    const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET')
    const encKey       = Deno.env.get('TOKEN_ENCRYPTION_KEY')
    if (!clientId || !clientSecret || !encKey) {
      return Response.redirect(`${APP_BASE}?error=server_misconfigured`, 302)
    }

    /* Exchange code for tokens */
    const tokenResp = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     clientId,
        client_secret: clientSecret,
        code,
        grant_type:    'authorization_code',
      }),
    })

    if (!tokenResp.ok) {
      console.error('[strava-callback] token exchange:', await tokenResp.text())
      return Response.redirect(`${APP_BASE}?error=token_exchange_failed`, 302)
    }

    const tokens = await tokenResp.json() as {
      access_token:  string
      refresh_token: string
      expires_at:    number   // unix timestamp (Strava already gives expires_at)
      athlete?:      { id: number; firstname: string; lastname: string }
    }

    const accessCipher  = await encrypt(tokens.access_token, encKey)
    const refreshCipher = await encrypt(tokens.refresh_token, encKey)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { error: dbErr } = await admin.from('integrations').upsert(
      {
        user_id:              userId,
        provider:             'strava',
        connected:            true,
        access_token_cipher:  accessCipher,
        refresh_token_cipher: refreshCipher,
        meta: {
          expires_at: tokens.expires_at * 1000, // convert to ms
          athlete:    tokens.athlete ?? null,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,provider' },
    )

    if (dbErr) {
      console.error('[strava-callback] db upsert:', dbErr.message)
      return Response.redirect(`${APP_BASE}?error=db_error`, 302)
    }

    return Response.redirect(`${APP_BASE}?connected=strava`, 302)
  } catch (err) {
    console.error('[strava-callback]', err)
    return Response.redirect(`${APP_BASE}?error=server_error`, 302)
  }
})
