/**
 * gcal-events — fetch Google Calendar events and upsert into `events` table.
 *
 * Called by frontend (authenticated) via fetch with Authorization: Bearer <jwt>.
 * Body: { timeMin: string; timeMax: string }   (ISO 8601)
 *
 * Required Supabase secrets:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   TOKEN_ENCRYPTION_KEY
 *
 * Returns: { events: Event[] }
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
  const iv       = combined.slice(0, 12)
  const ct       = combined.slice(12)
  const pt       = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
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

/* ── Token refresh ─────────────────────────────────────────────── */

async function refreshAccessToken(
  refreshCipher: string,
  encKey: string,
  clientId: string,
  clientSecret: string,
): Promise<{ accessToken: string; expiresAt: number }> {
  const refreshToken = await decrypt(refreshCipher, encKey)
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
  })
  if (!resp.ok) throw new Error(`Token refresh failed: ${await resp.text()}`)
  const data = await resp.json() as { access_token: string; expires_in: number }
  return { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
}

/* ── Category inference from Google event ─────────────────────── */

function inferCategory(summary: string, _colorId?: string): string {
  const lower = (summary ?? '').toLowerCase()

  if (/nata/.test(lower)) return 'nata'
  if (/moto/.test(lower)) return 'moto'
  if (/treino|corrida|bike|ciclismo|triathlon|musculação|academia/.test(lower)) return 'treino'
  if (/estudo|curso|aula|aprender/.test(lower)) return 'estudos'
  if (/limpar|casa|lavar|faxina|arrumar/.test(lower)) return 'casa'
  if (/jogo|festa|lazer|cinema|bar|pizza|churrasco/.test(lower)) return 'lazer'

  return 'outros'
}

/* ── Main handler ──────────────────────────────────────────────── */

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

  try {
    /* ── Authenticate ── */
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing authorization' }, 401)

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    /* ── Parse body ── */
    const body = await req.json() as { timeMin?: string; timeMax?: string }
    const timeMin = body.timeMin
    const timeMax = body.timeMax
    if (!timeMin || !timeMax) return json({ error: 'timeMin and timeMax are required' }, 400)

    /* ── Load secrets ── */
    const encKey       = Deno.env.get('TOKEN_ENCRYPTION_KEY')!
    const clientId     = Deno.env.get('GOOGLE_CLIENT_ID')!
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!

    /* ── Get integration record ── */
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: integration, error: intErr } = await admin
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'gcal')
      .eq('connected', true)
      .maybeSingle()

    if (intErr || !integration) return json({ error: 'Google Calendar not connected' }, 400)

    /* ── Ensure valid access token ── */
    const meta       = (integration.meta as { expires_at?: number; scope?: string }) ?? {}
    const expiresAt  = meta.expires_at ?? 0
    let accessToken: string

    if (Date.now() < expiresAt - 60_000) {
      // Still valid
      accessToken = await decrypt(integration.access_token_cipher!, encKey)
    } else {
      // Refresh
      if (!integration.refresh_token_cipher) return json({ error: 'No refresh token stored' }, 400)
      const refreshed = await refreshAccessToken(
        integration.refresh_token_cipher, encKey, clientId, clientSecret,
      )
      accessToken = refreshed.accessToken
      // Persist new access token + expiry
      await admin.from('integrations').update({
        access_token_cipher: await encrypt(accessToken, encKey),
        meta:                { ...meta, expires_at: refreshed.expiresAt },
        updated_at:          new Date().toISOString(),
      }).eq('user_id', user.id).eq('provider', 'gcal')
    }

    /* ── Call Google Calendar API ── */
    const gcalUrl = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
    gcalUrl.searchParams.set('timeMin', timeMin)
    gcalUrl.searchParams.set('timeMax', timeMax)
    gcalUrl.searchParams.set('singleEvents', 'true')
    gcalUrl.searchParams.set('orderBy', 'startTime')
    gcalUrl.searchParams.set('maxResults', '250')

    const gcalResp = await fetch(gcalUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!gcalResp.ok) {
      const err = await gcalResp.text()
      console.error('[gcal-events] Google API error:', err)
      return json({ error: 'Google Calendar API error', detail: err }, 502)
    }

    const gcalData = await gcalResp.json() as {
      items: Array<{
        id: string
        summary?: string
        description?: string
        start: { dateTime?: string; date?: string }
        end: { dateTime?: string; date?: string }
        colorId?: string
        status: string
      }>
    }

    const items = (gcalData.items ?? []).filter(e => e.status !== 'cancelled')

    /* ── Delete existing gcal events in the period ── */
    await admin
      .from('events')
      .delete()
      .eq('user_id', user.id)
      .eq('source', 'gcal')
      .gte('starts_at', timeMin)
      .lte('starts_at', timeMax)

    /* ── Insert fresh events ── */
    if (items.length > 0) {
      const toInsert = items.map(e => {
        const startsAt = e.start.dateTime ?? e.start.date + 'T00:00:00Z'
        const endsAt   = e.end?.dateTime   ?? e.end?.date   ? (e.end.dateTime ?? e.end.date + 'T23:59:59Z') : null
        return {
          user_id:     user.id,
          title:       e.summary ?? '(sem título)',
          description: e.description ?? null,
          starts_at:   startsAt,
          ends_at:     endsAt,
          category:    inferCategory(e.summary ?? '', e.colorId),
          source:      'gcal',
          external_id: e.id,
        }
      })

      const { error: insertErr } = await admin.from('events').insert(toInsert)
      if (insertErr) {
        console.error('[gcal-events] insert error:', insertErr)
        return json({ error: 'DB insert failed', detail: insertErr.message }, 500)
      }
    }

    /* ── Return all events in the period (local + gcal) ── */
    const { data: allEvents } = await admin
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .gte('starts_at', timeMin)
      .lte('starts_at', timeMax)
      .order('starts_at', { ascending: true })

    return json({ events: allEvents ?? [], synced: items.length })
  } catch (err) {
    console.error('[gcal-events] error:', err)
    return json({ error: String(err) }, 500)
  }
})
