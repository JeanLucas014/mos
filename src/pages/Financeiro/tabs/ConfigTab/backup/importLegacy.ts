import { supabase } from '@/lib/supabase'
import { mkDate } from './utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function importarFormatoAntigo(json: any, anoId: string, onProgress: (p: number) => void): Promise<string[]> {
  const erros: string[] = []
  const anoNum: number = json.ano || new Date().getFullYear()
  const months = json.months ?? {}
  const diario = json.diario ?? {}
  const meses_full: Record<string, number> = {
    'Janeiro':1,'Fevereiro':2,'Março':3,'Abril':4,'Maio':5,'Junho':6,
    'Julho':7,'Agosto':8,'Setembro':9,'Outubro':10,'Novembro':11,'Dezembro':12,
  }

  const allMeses = Object.keys(months)
  const totalSteps = allMeses.length * 5 + Object.keys(diario).length + 2
  let step = 0
  const tick = () => { step++; onProgress(Math.round((step / totalSteps) * 100)) }

  // Passos 1–4: months
  for (const mesNome of allMeses) {
    const m = months[mesNome]
    const mes = meses_full[mesNome] ?? 1

    // Passo 1 — entradas
    try {
      for (const e of m.entradas ?? []) {
        await (supabase.from('fin_lancamentos') as any).insert({
          ano_id: anoId, data: mkDate(anoNum, mes, e.dataPg ?? 1),
          natureza: 'entrada', nome: String(e.nome ?? '').trim() || 'Entrada',
          valor: Number(e.valor) || 0, is_grupo: false, parent_id: null,
        })
      }
    } catch (err) { erros.push(`Entradas ${mesNome}: ${err}`) }
    tick()

    // Passo 2 — fixas
    try {
      for (const f of m.fixas ?? []) {
        const dataPg = mkDate(anoNum, mes, f.dataPg ?? 1)
        if (f.subs?.length > 0) {
          const { data: g } = await (supabase.from('fin_lancamentos') as any)
            .insert({ ano_id: anoId, data: dataPg, natureza: 'saida', saida_tipo: 'fixa',
              nome: String(f.nome ?? '').trim() || 'Grupo', is_grupo: true, valor: null, parent_id: null })
            .select('id').single()
          const grupoId = (g as { id: string } | null)?.id
          if (grupoId) {
            for (const sub of f.subs) {
              await (supabase.from('fin_lancamentos') as any).insert({
                ano_id: anoId, parent_id: grupoId, data: dataPg,
                natureza: 'saida', saida_tipo: 'fixa',
                nome: String(sub.nome ?? '').trim() || 'Item',
                valor: Number(sub.valor) || 0, is_grupo: false,
              })
            }
          }
        } else {
          await (supabase.from('fin_lancamentos') as any).insert({
            ano_id: anoId, data: dataPg, natureza: 'saida', saida_tipo: 'fixa',
            nome: String(f.nome ?? '').trim() || 'Fixa',
            valor: Number(f.valor) || 0, is_grupo: false, parent_id: null,
          })
        }
      }
    } catch (err) { erros.push(`Fixas ${mesNome}: ${err}`) }
    tick()

    // Passo 3 — variáveis (diário)
    try {
      for (const v of m.variaveis ?? []) {
        await (supabase.from('fin_lancamentos') as any).insert({
          ano_id: anoId, data: mkDate(anoNum, mes, 1),
          natureza: 'diario', nome: String(v.nome ?? '').trim() || 'Variável',
          valor: Number(v.valor) || 0, is_grupo: false, parent_id: null,
        })
      }
    } catch (err) { erros.push(`Variáveis ${mesNome}: ${err}`) }
    tick()

    // Passo 4 — cartoes_itens
    try {
      for (const c of m.cartoes_itens ?? []) {
        const dataPg = mkDate(anoNum, mes, c.dataPg ?? 1)
        if (c.subs?.length > 0) {
          const { data: g } = await (supabase.from('fin_lancamentos') as any)
            .insert({ ano_id: anoId, data: dataPg, natureza: 'saida', saida_tipo: 'cartao',
              nome: String(c.nome ?? '').trim() || 'Cartão', is_grupo: true, valor: null, parent_id: null })
            .select('id').single()
          const grupoId = (g as { id: string } | null)?.id
          if (grupoId) {
            for (const sub of c.subs) {
              await (supabase.from('fin_lancamentos') as any).insert({
                ano_id: anoId, parent_id: grupoId, data: dataPg,
                natureza: 'saida', saida_tipo: 'cartao',
                nome: String(sub.nome ?? '').trim() || 'Item',
                valor: Number(sub.valor) || 0, is_grupo: false,
              })
            }
          }
        } else {
          await (supabase.from('fin_lancamentos') as any).insert({
            ano_id: anoId, data: dataPg, natureza: 'saida', saida_tipo: 'cartao',
            nome: String(c.nome ?? '').trim() || 'Cartão',
            valor: Number(c.valor) || 0, is_grupo: false, parent_id: null,
          })
        }
      }
    } catch (err) { erros.push(`Cartões ${mesNome}: ${err}`) }
    tick()
  }

  // Passo 5 — diário por dia
  for (const mesNome of Object.keys(diario)) {
    const mes = meses_full[mesNome] ?? 1
    try {
      for (const item of diario[mesNome] ?? []) {
        await (supabase.from('fin_lancamentos') as any).insert({
          ano_id: anoId, data: mkDate(anoNum, mes, item.dia ?? 1),
          natureza: 'diario', nome: String(item.nome ?? '').trim() || 'Diário',
          valor: Number(item.valor) || 0, is_grupo: false, parent_id: null,
        })
      }
    } catch (err) { erros.push(`Diário ${mesNome}: ${err}`) }
    tick()
  }

  // Passo 6 — metas
  try {
    for (const meta of json.metas ?? []) {
      await (supabase.from('fin_metas') as any).insert({
        nome: String(meta.nome ?? '').trim() || 'Meta',
        alvo: Number(meta.target) || 0,
        atual: Number(meta.atual) || 0,
        ordem: 0,
      })
    }
  } catch (err) { erros.push(`Metas: ${err}`) }
  tick()

  // Passo 7 — investimentos mensais (economia > 0)
  try {
    const inv = json.investimentos ?? {}
    for (const mesNome of Object.keys(inv)) {
      if (mesNome === '_inicial') continue
      const economia = Number(inv[mesNome]?.economia ?? 0)
      if (economia <= 0) continue
      const mes = meses_full[mesNome] ?? 1
      await (supabase.from('fin_investimentos') as any).insert({
        data: mkDate(anoNum, mes, 1),
        valor: economia,
        descricao: `${mesNome} ${anoNum} (importado)`,
      })
    }
  } catch (err) { erros.push(`Investimentos: ${err}`) }
  tick()

  return erros
}
