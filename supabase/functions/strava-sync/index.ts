/**
 * strava-sync — import activities from Strava into the workouts table.
 *
 * Required secrets: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, TOKEN_ENCRYPTION_KEY
 * Called by frontend (authenticated). Returns: { imported: number }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

/* ── Mapping ───────────────────────────────────────────────────── */
function mapActivityType(type: string): { sport: string; kind: string } {
  const t = type.toLowerCase()
  // Running variants
  if (['run', 'virtualrun', 'trailrun'].includes(t)) return { sport: 'corrida', kind: 'easy' }
  // Swimming
  if (t === 'swim') return { sport: 'triathlon', kind: 'natação' }
  // Cycling
  if (['ride', 'virtualride', 'mountainbikeride', 'ebikeride', 'handcycle'].includes(t)) return { sport: 'triathlon', kind: 'bike' }
  // Triathlon
  if (t === 'triathlon') return { sport: 'triathlon', kind: 'tijolo' }
  // Strength / cross-training → log as corrida/easy so they appear in the list
  if (['weighttraining', 'workout', 'crossfit', 'yoga', 'pilates', 'elliptical', 'stairstepper'].includes(t)) return { sport: 'corrida', kind: 'easy' }
  // Catch-all: import everything so nothing is silently dropped
  return { sport: 'corrida', kind: 'easy' }
}

function calcPace(distance_m: number, duration_s: number): string {
  if (!distance_m || !duration_s) return '—'
  const secPerKm = duration_s / (distance_m / 1000)
  return `${Math.floor(secPerKm / 60)}:${String(Math.round(secPerKm % 60)).padStart(2, '0')}/km`
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
      /* Refresh token */
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

    /* Fetch activities */
    const activitiesResp = await fetch(
      'https://www.strava.com/api/v3/athlete/activities?per_page=30',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )
    if (!activitiesResp.ok) return json({ error: 'Strava API error' }, 502)

    const activities = await activitiesResp.json() as Array<{
      id: number
      name: string
      type: string
      distance: number       // metres
      moving_time: number    // seconds
      start_date_local: string // ISO 8601 local time
    }>

    // DEBUG: log first 3 activities to verify mapping + dates
    console.log('[strava-sync] first 3 activities:',
      activities.slice(0, 3).map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        date: a.start_date_local?.slice(0, 10),
        dist: a.distance,
        mapped: mapActivityType(a.type),
      }))
    )

    /* Get existing strava notes to avoid duplicates */
    const { data: existing } = await admin
      .from('workouts').select('notes')
      .eq('user_id', user.id)
      .like('notes', 'strava:%')

    const existingIds = new Set((existing ?? []).map((w: { notes: string | null }) =>
      w.notes?.replace('strava:', ''),
    ))

    /* Insert new activities */
    const toInsert = activities
      .map(a => {
        const mapped = mapActivityType(a.type)
        if (existingIds.has(String(a.id))) return null
        // workout_date: use start_date_local (local timezone, YYYY-MM-DD)
        const workout_date = (a.start_date_local ?? '').slice(0, 10) || new Date().toISOString().slice(0, 10)
        return {
          user_id:      user.id,
          sport:        mapped.sport,
          kind:         mapped.kind,
          distance_m:   Math.round(a.distance),
          duration_s:   a.moving_time,
          pace_label:   calcPace(a.distance, a.moving_time),
          workout_date,
          notes:        `strava:${a.id}`,
        }
      })
      .filter(Boolean)

    if (toInsert.length > 0) {
      const { error: insertErr } = await admin.from('workouts').insert(toInsert)
      if (insertErr) {
        console.error('[strava-sync] insert error:', insertErr)
        return json({ error: `DB insert failed: ${insertErr.message}` }, 500)
      }
    }

    // DEBUG: verify what's now in workouts table for this user
    const { data: sample } = await admin
      .from('workouts').select('sport, kind, workout_date, distance_m, notes')
      .eq('user_id', user.id).like('notes', 'strava:%')
      .order('workout_date', { ascending: false }).limit(3)
    console.log('[strava-sync] sample workouts after insert:', sample)

    return json({ imported: toInsert.length })
  } catch (err) {
    console.error('[strava-sync]', err)
    return json({ error: String(err) }, 500)
  }
})
