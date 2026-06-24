import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CLIENT_ID     = Deno.env.get('PLUGGY_CLIENT_ID')!
const CLIENT_SECRET = Deno.env.get('PLUGGY_CLIENT_SECRET')!

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

async function getApiKey(): Promise<string> {
  const r = await fetch('https://api.pluggy.ai/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET }),
  })
  const d = await r.json()
  if (!d.apiKey) throw new Error('Pluggy auth failed: ' + JSON.stringify(d))
  return d.apiKey
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    // Extrai user id do JWT
    const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    let clientUserId = 'mos-default'
    try {
      clientUserId = JSON.parse(atob(jwt.split('.')[1])).sub
    } catch {}

    const apiKey = await getApiKey()
    const r = await fetch('https://api.pluggy.ai/connect_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
      body: JSON.stringify({ clientUserId }),
    })
    const { accessToken } = await r.json()

    return new Response(
      JSON.stringify({ accessToken }),
      { headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    )
  }
})
