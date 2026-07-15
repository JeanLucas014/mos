import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function importarMosV1(json: any, onProgress: (p: number) => void): Promise<string[]> {
  const erros: string[] = []
  const d = json.data ?? {}
  const srcAnos: any[] = d.anos ?? []
  const srcCats: any[] = d.categorias ?? []
  const srcCards: any[] = d.cartoes ?? []
  const srcLancs: any[] = d.lancamentos ?? []
  const srcMetas: any[] = d.metas ?? []
  const srcInvs: any[] = d.investimentos ?? []
  const srcRecs: any[] = d.recorrentes ?? []

  const total = srcAnos.length + srcCats.length + srcCards.length + srcLancs.length + srcMetas.length + srcInvs.length + srcRecs.length || 1
  let done = 0
  const tick = () => { done++; onProgress(Math.round((done / total) * 100)) }

  // Build ID maps
  const anoMap = new Map<string, string>()
  const catMap  = new Map<string, string>()
  const cardMap = new Map<string, string>()
  const lancMap = new Map<string, string>()

  // Anos
  for (const a of srcAnos) {
    try {
      const { data: row } = await (supabase.from('fin_anos') as any)
        .insert({ ano: a.ano, saldo_inicial: a.saldo_inicial ?? 0 }).select('id').single()
      if (row?.id) anoMap.set(a.id, row.id)
    } catch (err) { erros.push(`Ano ${a.ano}: ${err}`) }
    tick()
  }

  // Categorias
  for (const c of srcCats) {
    try {
      const { data: row } = await (supabase.from('fin_categorias') as any)
        .insert({ nome: c.nome, natureza: c.natureza, cor: c.cor, rapida: c.rapida ?? false, ordem: c.ordem ?? 0 })
        .select('id').single()
      if (row?.id) catMap.set(c.id, row.id)
    } catch (err) { erros.push(`Cat ${c.nome}: ${err}`) }
    tick()
  }

  // Cartões
  for (const c of srcCards) {
    try {
      const { data: row } = await (supabase.from('fin_cartoes') as any)
        .insert({ nome: c.nome, cor: c.cor }).select('id').single()
      if (row?.id) cardMap.set(c.id, row.id)
    } catch (err) { erros.push(`Cartão ${c.nome}: ${err}`) }
    tick()
  }

  // Lançamentos — 2 passes: roots first, then children
  const roots = srcLancs.filter((l: any) => !l.parent_id)
  const children = srcLancs.filter((l: any) => !!l.parent_id)

  for (const l of roots) {
    try {
      const { data: row } = await (supabase.from('fin_lancamentos') as any).insert({
        ano_id: anoMap.get(l.ano_id) ?? l.ano_id,
        parent_id: null,
        data: l.data,
        natureza: l.natureza,
        nome: l.nome,
        valor: l.valor,
        is_grupo: l.is_grupo ?? false,
        categoria_id: l.categoria_id ? catMap.get(l.categoria_id) ?? null : null,
        cartao_id: l.cartao_id ? cardMap.get(l.cartao_id) ?? null : null,
        saida_tipo: l.saida_tipo ?? null,
        ordem: l.ordem ?? 0,
      }).select('id').single()
      if (row?.id) lancMap.set(l.id, row.id)
    } catch (err) { erros.push(`Lanç ${l.nome}: ${err}`) }
    tick()
  }

  for (const l of children) {
    try {
      await (supabase.from('fin_lancamentos') as any).insert({
        ano_id: anoMap.get(l.ano_id) ?? l.ano_id,
        parent_id: lancMap.get(l.parent_id) ?? null,
        data: l.data,
        natureza: l.natureza,
        nome: l.nome,
        valor: l.valor,
        is_grupo: false,
        categoria_id: l.categoria_id ? catMap.get(l.categoria_id) ?? null : null,
        cartao_id: l.cartao_id ? cardMap.get(l.cartao_id) ?? null : null,
        saida_tipo: l.saida_tipo ?? null,
        ordem: l.ordem ?? 0,
      })
    } catch (err) { erros.push(`Lanç filho ${l.nome}: ${err}`) }
    tick()
  }

  // Metas
  for (const m of srcMetas) {
    try {
      await (supabase.from('fin_metas') as any).insert({ nome: m.nome, alvo: m.alvo, atual: m.atual ?? 0, ordem: m.ordem ?? 0 })
    } catch (err) { erros.push(`Meta ${m.nome}: ${err}`) }
    tick()
  }

  // Investimentos
  for (const i of srcInvs) {
    try {
      await (supabase.from('fin_investimentos') as any).insert({ data: i.data, valor: i.valor, descricao: i.descricao ?? null })
    } catch (err) { erros.push(`Invest ${i.data}: ${err}`) }
    tick()
  }

  // Recorrentes
  for (const r of srcRecs) {
    try {
      await (supabase.from('fin_recorrentes') as any).insert({
        nome: r.nome, valor: r.valor, dia_previsto: r.dia_previsto,
        natureza: r.natureza ?? 'saida', saida_tipo: r.saida_tipo ?? 'fixa',
        categoria_id: r.categoria_id ? catMap.get(r.categoria_id) ?? null : null,
        ativo: r.ativo ?? true,
      })
    } catch (err) { erros.push(`Rec ${r.nome}: ${err}`) }
    tick()
  }

  return erros
}
