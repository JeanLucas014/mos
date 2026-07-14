import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CLIENT_ID     = Deno.env.get('PLUGGY_CLIENT_ID')!
const CLIENT_SECRET = Deno.env.get('PLUGGY_CLIENT_SECRET')!
const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

async function getApiKey(): Promise<string> {
  const r = await fetch('https://api.pluggy.ai/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET }),
  })
  const d = await r.json()
  return d.apiKey
}

// Bradesco: fecha dia 25, vence dia 5
// Compra até dia 25 → vence dia 5 do mês seguinte
// Compra após dia 25 → vence dia 5 dois meses à frente
function getVencimento(date: Date): string {
  let m = date.getMonth()    // 0-indexed
  let y = date.getFullYear()
  m += date.getDate() <= 25 ? 1 : 2
  if (m > 11) { m -= 12; y++ }
  return `${y}-${String(m + 1).padStart(2,'0')}-05`
}

async function processTransaction(
  supabase: any,
  tx: any,
  conn: any,
  apiKey: string
) {
  const amount = Math.abs(Number(tx.amount))
  if (amount <= 0) return

  // Deduplicação
  const { data: existing } = await supabase
    .from('fin_lancamentos')
    .select('id')
    .eq('pluggy_tx_id', tx.id)
    .maybeSingle()
  if (existing) { console.log('Duplicate, skipping:', tx.id); return }

  const txDate  = new Date(tx.date)
  const txYear  = txDate.getFullYear()
  const txMonth = txDate.getMonth() + 1
  const txDay   = txDate.getDate()

  // Busca fin_anos
  const { data: anoData } = await supabase
    .from('fin_anos')
    .select('id')
    .eq('user_id', conn.user_id)
    .eq('ano', txYear)
    .single()

  if (!anoData) {
    console.error('No fin_anos for year', txYear)
    return
  }

  const dateStr = `${txYear}-${String(txMonth).padStart(2,'0')}-${String(txDay).padStart(2,'0')}`
  const descr   = (tx.description || tx.descriptionRaw || 'Sem descrição').trim()

  if (conn.account_type === 'credit') {
    // CRÉDITO: agrupa por fatura
    const vencimento = getVencimento(txDate)
    const [vy, vm]   = vencimento.split('-').map(Number)
    const grupoNome  = `${conn.bank_name} · ${MONTHS[vm - 1]}/${String(vy).slice(2)}`

    // Busca ou cria grupo da fatura
    let { data: grupo } = await supabase
      .from('fin_lancamentos')
      .select('id')
      .eq('ano_id', anoData.id)
      .eq('user_id', conn.user_id)
      .eq('nome', grupoNome)
      .eq('is_grupo', true)
      .maybeSingle()

    if (!grupo) {
      const { data: newG } = await supabase
        .from('fin_lancamentos')
        .insert({
          ano_id: anoData.id, user_id: conn.user_id,
          data: vencimento, natureza: 'saida',
          nome: grupoNome, valor: null,
          is_grupo: true, saida_tipo: 'cartao',
        })
        .select('id')
        .single()
      grupo = newG
    }

    await supabase.from('fin_lancamentos').insert({
      ano_id:        anoData.id,
      user_id:       conn.user_id,
      parent_id:     grupo!.id,
      data:          vencimento,
      natureza:      'saida',
      nome:          descr,
      valor:         amount,
      is_grupo:      false,
      saida_tipo:    'cartao',
      pluggy_tx_id:  tx.id,
    })
    console.log('✓ Crédito registrado → fatura', vencimento)

  } else {
    // DÉBITO: entra no diário no dia da compra
    // Pluggy: amount negativo = saída, positivo = entrada
    const natureza = Number(tx.amount) < 0 ? 'diario' : 'entrada'

    await supabase.from('fin_lancamentos').insert({
      ano_id:       anoData.id,
      user_id:      conn.user_id,
      parent_id:    null,
      data:         dateStr,
      natureza,
      nome:         descr,
      valor:        amount,
      is_grupo:     false,
      saida_tipo:   null,
      pluggy_tx_id: tx.id,
    })
    console.log('✓ Débito registrado em', dateStr)
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const body = await req.json()
  const event   = body.event as string
  const itemId  = body.itemId as string

  console.log('Webhook recebido:', event, itemId)

  // Responde imediatamente (Pluggy exige < 5s)
  const response = new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

  // Processa apenas eventos relevantes
  if (!event.startsWith('transaction/') && event !== 'item/updated') return response

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  const { data: conn } = await supabase
    .from('pluggy_connections')
    .select('*')
    .eq('item_id', itemId)
    .single()

  if (!conn) { console.error('Connection not found:', itemId); return response }

  const apiKey = await getApiKey()

  if (event === 'transaction/created' && body.data?.id) {
    // Transação específica
    const r = await fetch(`https://api.pluggy.ai/transactions/${body.data.id}`, {
      headers: { 'X-API-KEY': apiKey },
    })
    const tx = await r.json()
    await processTransaction(supabase, tx, conn, apiKey)

  } else if (event === 'item/updated') {
    // Item sincronizado: busca transações recentes da conta
    const accountId = conn.account_id
    if (!accountId) return response

    const from = new Date()
    from.setDate(from.getDate() - 3) // Últimos 3 dias
    const fromStr = from.toISOString().slice(0, 10)

    const r = await fetch(
      `https://api.pluggy.ai/transactions?accountId=${accountId}&from=${fromStr}&pageSize=50`,
      { headers: { 'X-API-KEY': apiKey } }
    )
    const d = await r.json()
    for (const tx of d.results ?? []) {
      await processTransaction(supabase, tx, conn, apiKey)
    }
  }

  return response
})
