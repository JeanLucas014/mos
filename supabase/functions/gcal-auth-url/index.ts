/**
 * gcal-auth-url — generate the Google OAuth 2.0 authorization URL.
 *
 * Required Supabase secrets (set with `supabase secrets set`):
 *   GOOGLE_CLIENT_ID
 *
 * Called by the frontend (authenticated).
 * Returns: { url: string }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const REDIRECT_URI = 'https://fuykgxogvqvfwzqfigxz.supabase.co/functions/v1/gcal-callback'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
].join(' ')

/** Encode userId in state so the public callback can identify the user. */
function buildState(userId: string): string {
  return btoa(JSON.stringify({ userId, returnUrl: '/agenda' }))
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    /* ── Auth: identify the caller ── */
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    /* ── Build OAuth URL ── */
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    if (!clientId) {
      return new Response(JSON.stringify({ error: 'Server not configured' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const state = buildState(user.id)

    const params = new URLSearchParams({
      client_id:     clientId,
      redirect_uri:  REDIRECT_URI,
      response_type: 'code',
      scope:         SCOPES,
      access_type:   'offline',
      prompt:        'consent',   // always return refresh_token
      state,
    })

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`

    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[gcal-auth-url]', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
