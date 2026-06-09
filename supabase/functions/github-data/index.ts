/**
 * github-data — fetch user repositories from the GitHub API.
 *
 * Required secrets: TOKEN_ENCRYPTION_KEY
 * Called by frontend (authenticated). Returns: { repos: Repo[] }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function aesKey(secret: string, usage: 'encrypt' | 'decrypt'): Promise<CryptoKey> {
  const raw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, [usage])
}

async function decrypt(cipher: string, secret: string): Promise<string> {
  const key      = await aesKey(secret, 'decrypt')
  const combined = Uint8Array.from(atob(cipher), c => c.charCodeAt(0))
  const pt       = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: combined.slice(0, 12) }, key, combined.slice(12))
  return new TextDecoder().decode(pt)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing authorization' }, 401)

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    const encKey = Deno.env.get('TOKEN_ENCRYPTION_KEY')!

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: integration } = await admin
      .from('integrations').select('access_token_cipher')
      .eq('user_id', user.id).eq('provider', 'github').eq('connected', true)
      .maybeSingle()

    if (!integration?.access_token_cipher) return json({ error: 'GitHub not connected' }, 400)

    const accessToken = await decrypt(integration.access_token_cipher, encKey)

    const reposResp = await fetch(
      'https://api.github.com/user/repos?sort=updated&per_page=10&type=owner',
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept:        'application/vnd.github.v3+json',
          'User-Agent':  'MOS-App',
        },
      },
    )

    if (!reposResp.ok) return json({ error: 'GitHub API error' }, 502)

    const repos = await reposResp.json() as Array<{
      id:              number
      name:            string
      full_name:       string
      html_url:        string
      language:        string | null
      pushed_at:       string
      stargazers_count: number
      private:         boolean
    }>

    return json({
      repos: repos.slice(0, 10).map(r => ({
        id:        r.id,
        name:      r.name,
        full_name: r.full_name,
        url:       r.html_url,
        language:  r.language,
        pushed_at: r.pushed_at,
        stars:     r.stargazers_count,
        private:   r.private,
      })),
    })
  } catch (err) {
    console.error('[github-data]', err)
    return json({ error: String(err) }, 500)
  }
})
