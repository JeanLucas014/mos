/**
 * pagespeed — proxy para a API do Google PageSpeed Insights.
 *
 * Mantém a chave de API no servidor (secret GOOGLE_PAGESPEED_API_KEY)
 * para que nunca fique exposta no bundle JS do cliente.
 *
 * Chamada pelo frontend (autenticado) via POST com JSON:
 *   { url: string; strategy: "mobile" | "desktop" }
 *
 * Retorna o JSON bruto do PageSpeed Insights ou um objeto { error: string }.
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    const { url, strategy = 'mobile' } = await req.json() as {
      url: string
      strategy?: string
    }

    if (!url) {
      return new Response(JSON.stringify({ error: 'url é obrigatório' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('GOOGLE_PAGESPEED_API_KEY')
    const params = new URLSearchParams({ url, strategy, category: 'performance' })
    if (apiKey) params.set('key', apiKey)

    const upstream = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`,
    )

    const data = await upstream.json()

    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: data?.error?.message ?? `Erro ${upstream.status}` }), {
        status: upstream.status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(data), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro interno'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
