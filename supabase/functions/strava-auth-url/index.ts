/**
 * strava-auth-url — generate the Strava OAuth 2.0 authorization URL.
 *
 * Required secrets: STRAVA_CLIENT_ID
 * Called by the frontend (authenticated).
 * Returns: { url: string }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const REDIRECT_URI = 'https://fuykgxogvqvfwzqfigxz.supabase.co/functions/v1/strava-callback'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing authorization' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    const clientId = Deno.env.get('STRAVA_CLIENT_ID')
    if (!clientId) return json({ error: 'Server not configured' }, 500)

    const state = btoa(JSON.stringify({ userId: user.id }))

    const params = new URLSearchParams({
      client_id:     clientId,
      redirect_uri:  REDIRECT_URI,
      response_type: 'code',
      scope:         'activity:read_all',
      state,
    })

    const url = `https://www.strava.com/oauth/authorize?${params}`
    return json({ url })
  } catch (err) {
    console.error('[strava-auth-url]', err)
    return json({ error: String(err) }, 500)
  }
})
