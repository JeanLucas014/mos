/**
 * strava-sync — import activities from Strava into the workouts table.
 *
 * Required secrets: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, TOKEN_ENCRYPTION_KEY
 * Called by frontend (authenticated). Returns: { imported: number }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/* ── Crypto helpers ────────────────────────────────────────────── */
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

async function encrypt(plaintext: string, secret: string): Promise<string> {
  const key = await aesKey(secret, 'encrypt')
  const iv  = crypto.getRandomValues(new Uint8Array(12))
  const ct  = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext))
  const out = new Uint8Array(12 + ct.byteLength)
  out.set(iv); out.set(new Uint8Array(ct), 12)
  return btoa(String.fromCharCode(...out))
}

/* ── Activity type mapping ─────────────────────────────────────── */
// Tipos que usam pace (min/km) como métrica principal — ver calcPace abaixo
// e a mesma regra espelhada em src/pages/SportsPage/utils.ts.
const PACE_SPORTS = new Set(['corrida', 'caminhada'])

function mapActivityType(type: string): { sport: string; kind: string } {
  switch (type) {
    case 'Run':
      return { sport: 'corrida', kind: 'easy' }
    case 'TrailRun':
      return { sport: 'corrida', kind: 'long' }
    case 'Ride':
    case 'VirtualRide':
    case 'MountainBikeRide':
    case 'EBikeRide':
    case 'Handcycle':
      return { sport: 'ciclismo', kind: 'easy' }
    case 'Swim':
      return { sport: 'natacao', kind: 'easy' }
    case 'Triathlon':
      return { sport: 'triathlon', kind: 'tijolo' }
    case 'WeightTraining':
    case 'Workout':
    case 'Crossfit':
      return { sport: 'musculacao', kind: 'full_body' }
    case 'Yoga':
    case 'Pilates':
      return { sport: 'yoga', kind: 'geral' }
    case 'Elliptical':
      return { sport: 'musculacao', kind: 'cardio' }
    case 'Walk':
    case 'Hike':
      return { sport: 'caminhada', kind: 'easy' }
    case 'VirtualRun':
      return { sport: 'corrida', kind: 'easy' }
    default:
      return { sport: 'corrida', kind: 'easy' }
  }
}

function calcPace(distance_m: number, duration_s: number): string {
  if (!distance_m || !duration_s) return '—'
  const secPerKm = duration_s / (distance_m / 1000)
  return `${Math.floor(secPerKm / 60)}:${String(Math.round(secPerKm % 60)).padStart(2, '0')}/km`
}

/* ── Fetch all activities with pagination ─────────────────────── */
async function fetchAllActivities(accessToken: string): Promise<Array<{
  id: number
  name: string
  type: string
  distance: number
  moving_time: number
  start_date_local: string
}>> {
  const all: Array<{
    id: number; name: string; type: string
    distance: number; moving_time: number; start_date_local: string
  }> = []

  const SAFETY_MAX_PAGES = 20  // teto de segurança generoso (4000 atividades)
  const PER_PAGE         = 200

  for (let page = 1; page <= SAFETY_MAX_PAGES; page++) {
    const url = `https://www.strava.com/api/v3/athlete/activities?per_page=${PER_PAGE}&page=${page}`
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })

    if (resp.status === 429) {
      console.error('[strava-sync] rate limited na página', page)
      break  // retorna o que já foi buscado até agora
    }

    if (!resp.ok) {
      console.error('[strava-sync] activities fetch error page', page, await resp.text())
      break
    }
    const batch = await resp.json() as typeof all
    console.log(`[strava-sync] page ${page}: ${batch.length} activities`)
    if (!batch.length) break
    all.push(...batch)
    if (batch.length < PER_PAGE) break  // last page
  }

  return all
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

    const encKey       = Deno.env.get('TOKEN_ENCRYPTION_KEY')!
    const clientId     = Deno.env.get('STRAVA_CLIENT_ID')!
    const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET')!

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    /* Fetch integration record */
    const { data: integration, error: intErr } = await admin
      .from('integrations').select('*')
      .eq('user_id', user.id).eq('provider', 'strava').eq('connected', true)
      .maybeSingle()

    if (intErr || !integration) return json({ error: 'Strava not connected' }, 400)

    /* Ensure valid access token */
    const meta      = (integration.meta as { expires_at?: number; athlete?: unknown }) ?? {}
    const expiresAt = meta.expires_at ?? 0
    let accessToken: string

    if (Date.now() < expiresAt - 60_000) {
      accessToken = await decrypt(integration.access_token_cipher!, encKey)
    } else {
      if (!integration.refresh_token_cipher) return json({ error: 'No refresh token' }, 400)
      const refreshToken = await decrypt(integration.refresh_token_cipher, encKey)
      const refreshResp  = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id:     clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type:    'refresh_token',
        }),
      })
      if (!refreshResp.ok) return json({ error: 'Token refresh failed' }, 502)
      const refreshed = await refreshResp.json() as { access_token: string; refresh_token: string; expires_at: number }
      accessToken = refreshed.access_token
      await admin.from('integrations').update({
        access_token_cipher:  await encrypt(accessToken, encKey),
        refresh_token_cipher: await encrypt(refreshed.refresh_token, encKey),
        meta: { ...meta, expires_at: refreshed.expires_at * 1000 },
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id).eq('provider', 'strava')
    }

    /* Fetch all activities (paginated) */
    const activities = await fetchAllActivities(accessToken)
    console.log(`[strava-sync] total activities fetched: ${activities.length}`)

    /* Get existing external_ids to avoid duplicates */
    const { data: existing } = await admin
      .from('sports').select('external_id')
      .eq('user_id', user.id)
      .not('external_id', 'is', null)

    const existingIds = new Set((existing ?? []).map((w: { external_id: string | null }) => w.external_id))

    /* Build insert array */
    const toInsert = activities
      .filter(a => !existingIds.has(String(a.id)))
      .map(a => {
        const mapped       = mapActivityType(a.type)
        const sport_date = (a.start_date_local ?? '').slice(0, 10) || new Date().toISOString().slice(0, 10)
        const distance_m   = Math.round(a.distance ?? 0)
        const duration_s   = a.moving_time ?? 0
        // pace (min/km) só faz sentido pra corrida/caminhada — bike usa
        // velocidade média e natação usa pace/100m, calculados na UI a
        // partir de distance_m/duration_s (ver primaryMetric em utils.ts).
        const pace_label   = PACE_SPORTS.has(mapped.sport) && distance_m > 0
          ? calcPace(distance_m, duration_s)
          : null
        return {
          user_id:       user.id,
          sport:         mapped.sport,
          kind:          mapped.kind,
          distance_m:    distance_m || null,
          duration_s:    duration_s,
          pace_label,
          sport_date,
          activity_name: a.name || null,
          notes:         `strava:${a.id}`,
          external_id:   String(a.id),
        }
      })

    if (toInsert.length > 0) {
      const { error: insertErr } = await admin.from('sports').insert(toInsert)
      if (insertErr) {
        console.error('[strava-sync] insert error:', insertErr)
        return json({ error: `DB insert failed: ${insertErr.message}` }, 500)
      }
    }

    return json({ imported: toInsert.length, total_fetched: activities.length })
  } catch (err) {
    console.error('[strava-sync]', err)
    return json({ error: String(err) }, 500)
  }
})
