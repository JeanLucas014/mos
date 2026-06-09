/**
 * github-callback — OAuth 2.0 redirect handler for GitHub.
 *
 * JWT verification DISABLED (browser redirect from GitHub has no JWT).
 * User identified via `state` param: btoa(JSON.stringify({ userId }))
 *
 * Required secrets: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, TOKEN_ENCRYPTION_KEY
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const APP_BASE = 'https://app.jlmos.com.br/integracoes'

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

    const clientId     = Deno.env.get('GITHUB_CLIENT_ID')
    const clientSecret = Deno.env.get('GITHUB_CLIENT_SECRET')
    const encKey       = Deno.env.get('TOKEN_ENCRYPTION_KEY')
    if (!clientId || !clientSecret || !encKey) {
      return Response.redirect(`${APP_BASE}?error=server_misconfigured`, 302)
    }

    /* Exchange code for token */
    const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    })

    if (!tokenResp.ok) {
      console.error('[github-callback] token exchange:', await tokenResp.text())
      return Response.redirect(`${APP_BASE}?error=token_exchange_failed`, 302)
    }

    const tokens = await tokenResp.json() as { access_token: string; token_type: string; scope: string }
    if (!tokens.access_token) return Response.redirect(`${APP_BASE}?error=no_token`, 302)

    const accessCipher = await encrypt(tokens.access_token, encKey)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { error: dbErr } = await admin.from('integrations').upsert(
      {
        user_id:             userId,
        provider:            'github',
        connected:           true,
        access_token_cipher: accessCipher,
        meta:                { scope: tokens.scope },
        updated_at:          new Date().toISOString(),
      },
      { onConflict: 'user_id,provider' },
    )

    if (dbErr) {
      console.error('[github-callback] db upsert:', dbErr.message)
      return Response.redirect(`${APP_BASE}?error=db_error`, 302)
    }

    return Response.redirect(`${APP_BASE}?connected=github`, 302)
  } catch (err) {
    console.error('[github-callback]', err)
    return Response.redirect(`${APP_BASE}?error=server_error`, 302)
  }
})
