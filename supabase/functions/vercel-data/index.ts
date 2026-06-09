/**
 * vercel-data — fetch recent deployments from the Vercel API.
 *
 * Required secrets: VERCEL_TOKEN
 * Called by frontend (authenticated). Returns: { deployments: Deploy[] }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    /* Check Vercel integration record exists */
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { data: integration } = await admin
      .from('integrations').select('connected')
      .eq('user_id', user.id).eq('provider', 'vercel').eq('connected', true)
      .maybeSingle()

    if (!integration) return json({ error: 'Vercel not connected' }, 400)

    const vercelToken = Deno.env.get('VERCEL_TOKEN')
    if (!vercelToken) return json({ error: 'VERCEL_TOKEN not set' }, 500)

    const resp = await fetch('https://api.vercel.com/v6/deployments?limit=10', {
      headers: { Authorization: `Bearer ${vercelToken}` },
    })

    if (!resp.ok) {
      const body = await resp.text()
      console.error('[vercel-data] API error:', body)
      return json({ error: 'Vercel API error' }, 502)
    }

    const data = await resp.json() as {
      deployments: Array<{
        uid:         string
        name:        string
        url:         string
        state:       string   // READY | ERROR | BUILDING | CANCELED | QUEUED
        createdAt:   number   // unix ms
        meta?:       Record<string, string>
      }>
    }

    return json({
      deployments: (data.deployments ?? []).slice(0, 10).map(d => ({
        id:        d.uid,
        name:      d.name,
        url:       `https://${d.url}`,
        state:     d.state,
        createdAt: d.createdAt,
      })),
    })
  } catch (err) {
    console.error('[vercel-data]', err)
    return json({ error: String(err) }, 500)
  }
})
