import type { PreviewData } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function countLegacy(json: any): PreviewData['counts'] {
  let lancamentos = 0
  let investimentos = 0
  const months = json.months ?? {}
  for (const mes of Object.keys(months)) {
    const m = months[mes]
    lancamentos += (m.entradas ?? []).length
    for (const f of m.fixas ?? []) lancamentos += f.subs?.length > 0 ? 1 + f.subs.length : 1
    lancamentos += (m.variaveis ?? []).length
    for (const c of m.cartoes_itens ?? []) lancamentos += c.subs?.length > 0 ? 1 + c.subs.length : 1
  }
  const diario = json.diario ?? {}
  for (const mes of Object.keys(diario)) lancamentos += (diario[mes] ?? []).length
  const inv = json.investimentos ?? {}
  for (const mes of Object.keys(inv)) {
    const e = inv[mes]?.economia ?? 0
    if (mes !== '_inicial' && e > 0) investimentos++
  }
  return {
    lancamentos,
    metas: (json.metas ?? []).length,
    investimentos,
    extras: `Formato legado · Ano ${json.ano ?? '?'}`,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function countMosV1(json: any): PreviewData['counts'] {
  const d = json.data ?? {}
  return {
    lancamentos: (d.lancamentos ?? []).length,
    metas: (d.metas ?? []).length,
    investimentos: (d.investimentos ?? []).length,
    extras: `${(d.anos ?? []).length} ano(s) · ${(d.categorias ?? []).length} cat · ${(d.cartoes ?? []).length} cartões`,
  }
}

export function mkDate(anoNum: number, mes: number, dia: string | number) {
  const d = parseInt(String(dia)) || 1
  return `${anoNum}-${String(mes).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}
