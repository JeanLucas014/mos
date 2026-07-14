import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Download, Upload, AlertTriangle } from 'lucide-react'
import { todayLocal } from '@/lib/dates'
import type { FinAno, FinCategoria, FinCartao } from '../types'


interface FinPrevisaoConfig { id: string; nome: string; valor: number; ordem: number }

interface Props { anos: FinAno[]; onReload: () => void }

export function ConfigTab({ anos, onReload }: Props) {
  const [tab, setTab] = useState<'categorias' | 'cartoes' | 'anos' | 'backup' | 'previsao'>('categorias')
  const [categorias, setCategorias] = useState<FinCategoria[]>([])
  const [cartoes, setCartoes] = useState<FinCartao[]>([])
  const [loading, setLoading] = useState(true)
  const [previsaoItems, setPrevisaoItems] = useState<FinPrevisaoConfig[]>([])
  const [prevForm, setPrevForm] = useState({ nome: '', valor: '' })

  const [catForm, setCatForm] = useState({ nome: '', natureza: 'diario', cor: '', rapida: false })
  const [cardForm, setCardForm] = useState({ nome: '', cor: '' })
  const [anoForm, setAnoForm] = useState({ ano: String(new Date().getFullYear() + 1), saldo_inicial: '0' })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: c }, { data: cr }] = await Promise.all([
      supabase.from('fin_categorias').select('*').order('ordem'),
      supabase.from('fin_cartoes').select('*').order('nome'),
    ])
    setCategorias((c ?? []) as FinCategoria[])
    setCartoes((cr ?? []) as FinCartao[])
    const { data: prev } = await supabase
      .from('fin_previsao_config').select('*').order('ordem')
    setPrevisaoItems((prev ?? []) as FinPrevisaoConfig[])
    setLoading(false)
  }

  async function addCategoria() {
    if (!catForm.nome.trim()) return
    await (supabase.from('fin_categorias') as any).insert({
      nome: catForm.nome.trim(), natureza: catForm.natureza,
      cor: catForm.cor || null, rapida: catForm.rapida,
      ordem: categorias.filter(c => c.natureza === catForm.natureza).length,
    })
    setCatForm({ nome: '', natureza: 'diario', cor: '', rapida: false })
    loadAll()
  }

  async function delCat(id: string) {
    await (supabase.from('fin_categorias') as any).delete().eq('id', id)
    loadAll()
  }

  async function addCartao() {
    if (!cardForm.nome.trim()) return
    await (supabase.from('fin_cartoes') as any).insert({ nome: cardForm.nome.trim(), cor: cardForm.cor || null })
    setCardForm({ nome: '', cor: '' })
    loadAll()
  }

  async function delCartao(id: string) {
    await (supabase.from('fin_cartoes') as any).delete().eq('id', id)
    loadAll()
  }

  async function addAno() {
    const a = parseInt(anoForm.ano)
    const s = parseFloat(anoForm.saldo_inicial.replace(',', '.')) || 0
    if (!a || a < 2020 || a > 2100) return alert('Ano inválido.')
    await (supabase.from('fin_anos') as any).insert({ ano: a, saldo_inicial: s })
    setAnoForm({ ano: String(a + 1), saldo_inicial: '0' })
    onReload()
    loadAll()
  }

  async function updateSaldoInicial(id: string, v: number) {
    await (supabase.from('fin_anos') as any).update({ saldo_inicial: v }).eq('id', id)
    onReload()
  }

  async function addPrevisaoItem() {
    const v = parseFloat(prevForm.valor.replace(',', '.')) || 0
    if (!prevForm.nome.trim() || !v) return
    await (supabase.from('fin_previsao_config') as any).insert({
      nome: prevForm.nome.trim(), valor: v,
      ordem: previsaoItems.length,
    })
    setPrevForm({ nome: '', valor: '' })
    loadAll()
    await updateFuturePrevisoes()
  }

  async function delPrevisaoItem(id: string) {
    await (supabase.from('fin_previsao_config') as any).delete().eq('id', id)
    loadAll()
    await updateFuturePrevisoes()
  }

  async function updatePrevisaoValor(id: string, valor: number) {
    await (supabase.from('fin_previsao_config') as any).update({ valor }).eq('id', id)
    loadAll()
    await updateFuturePrevisoes()
  }

  async function updateFuturePrevisoes() {
    const today = todayLocal()
    const { data: configRaw } = await supabase.from('fin_previsao_config').select('valor')
    const total = ((configRaw ?? []) as { valor: number }[]).reduce((s, c) => s + (Number(c.valor) || 0), 0)
    if (total <= 0) return

    const { data: futureRaw } = await supabase
      .from('fin_lancamentos')
      .select('id, data')
      .eq('is_previsao', true)
      .gte('data', today)
    const future = (futureRaw ?? []) as { id: string; data: string }[]

    if (!future.length) return

    const byMonth: Record<string, { ids: string[]; days: number }> = {}
    for (const entry of future) {
      const [y, m] = entry.data.split('-').map(Number)
      const key = `${y}-${m}`
      if (!byMonth[key]) {
        const days = new Date(y, m, 0).getDate()
        byMonth[key] = { ids: [], days }
      }
      byMonth[key].ids.push(entry.id)
    }

    for (const { ids, days } of Object.values(byMonth)) {
      const dailyValue = Math.round((total / days) * 100) / 100
      await (supabase.from('fin_lancamentos') as any)
        .update({ valor: dailyValue })
        .in('id', ids)
    }
  }

  const subtabs = [
    { id: 'categorias',  label: 'Categorias' },
    { id: 'cartoes',     label: 'Cartões' },
    { id: 'anos',        label: 'Anos' },
    { id: 'backup',      label: 'Backup' },
    { id: 'previsao',    label: 'Previsão do diário' },
  ] as const

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-5 h-5 rounded-full border-2 border-[#0EA5E9] border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-line overflow-x-auto">
        {subtabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={['px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              tab === t.id ? 'text-[#0EA5E9] border-[#0EA5E9]' : 'text-[#555] border-transparent hover:text-[#999]'].join(' ')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Categorias */}
      {tab === 'categorias' && (
        <div className="space-y-4">
          <div className="bg-bg-2 border border-line rounded-xl p-4 space-y-3">
            <div className="text-xs text-[#555] font-[Sora] uppercase tracking-wider">Nova categoria</div>
            <div className="flex gap-2 flex-wrap">
              <input placeholder="Nome" value={catForm.nome} onChange={e => setCatForm({ ...catForm, nome: e.target.value })}
                className="flex-1 min-w-32 bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60" />
              <select value={catForm.natureza} onChange={e => setCatForm({ ...catForm, natureza: e.target.value })}
                className="bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none">
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
                <option value="diario">Diário</option>
              </select>
              <input type="color" value={catForm.cor || 'var(--text3)'} onChange={e => setCatForm({ ...catForm, cor: e.target.value })}
                className="w-10 h-9 bg-bg border border-line rounded-lg cursor-pointer" />
              <label className="flex items-center gap-1.5 text-xs text-[#555] cursor-pointer">
                <input type="checkbox" checked={catForm.rapida} onChange={e => setCatForm({ ...catForm, rapida: e.target.checked })} className="accent-[#0EA5E9]" />
                Rápida
              </label>
              <button onClick={addCategoria} className="px-4 py-1.5 text-sm font-medium bg-[#0EA5E9] text-black rounded-lg hover:bg-[#38bdf8]">
                <Plus size={14} />
              </button>
            </div>
          </div>

          {(['entrada','saida','diario'] as const).map(nat => {
            const cats = categorias.filter(c => c.natureza === nat)
            if (!cats.length) return null
            const cor = nat === 'entrada' ? '#22c55e' : nat === 'saida' ? '#ef4444' : '#f97316'
            return (
              <div key={nat}>
                <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: cor }}>
                  {nat === 'entrada' ? 'Entrada' : nat === 'saida' ? 'Saída' : 'Diário'}
                </div>
                {cats.map(c => (
                  <div key={c.id} className="group flex items-center gap-2 py-2 border-b border-line">
                    {c.cor && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.cor }} />}
                    <span className="flex-1 text-sm text-[#aaa]">{c.nome}</span>
                    {c.rapida && <span className="text-[10px] text-[#0EA5E9] border border-[#0EA5E9]/30 rounded px-1.5">rápida</span>}
                    <button onClick={() => delCat(c.id)} className="opacity-0 group-hover:opacity-100 text-[#555] hover:text-[#ef4444] transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Cartões */}
      {tab === 'cartoes' && (
        <div className="space-y-4">
          <div className="bg-bg-2 border border-line rounded-xl p-4 space-y-3">
            <div className="text-xs text-[#555] font-[Sora] uppercase tracking-wider">Novo cartão</div>
            <div className="flex gap-2">
              <input placeholder="Nome" value={cardForm.nome} onChange={e => setCardForm({ ...cardForm, nome: e.target.value })}
                className="flex-1 bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60" />
              <input type="color" value={cardForm.cor || 'var(--text3)'} onChange={e => setCardForm({ ...cardForm, cor: e.target.value })}
                className="w-10 h-9 bg-bg border border-line rounded-lg cursor-pointer" />
              <button onClick={addCartao} className="px-4 py-1.5 text-sm font-medium bg-[#0EA5E9] text-black rounded-lg hover:bg-[#38bdf8]">
                <Plus size={14} />
              </button>
            </div>
          </div>
          {cartoes.map(c => (
            <div key={c.id} className="group flex items-center gap-3 py-2.5 border-b border-line">
              {c.cor && <span className="w-3 h-3 rounded-full shrink-0" style={{ background: c.cor }} />}
              <span className="flex-1 text-sm text-white">{c.nome}</span>
              <button onClick={() => delCartao(c.id)} className="opacity-0 group-hover:opacity-100 text-[#555] hover:text-[#ef4444] transition-all">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Anos */}
      {tab === 'anos' && (
        <div className="space-y-4">
          <div className="bg-bg-2 border border-line rounded-xl p-4 space-y-3">
            <div className="text-xs text-[#555] font-[Sora] uppercase tracking-wider">Criar novo ano</div>
            <div className="flex gap-2">
              <input placeholder="2027" value={anoForm.ano} onChange={e => setAnoForm({ ...anoForm, ano: e.target.value })}
                className="w-24 bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60 tabular-nums" />
              <input placeholder="Saldo inicial" value={anoForm.saldo_inicial} onChange={e => setAnoForm({ ...anoForm, saldo_inicial: e.target.value })}
                className="flex-1 bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60 tabular-nums" />
              <button onClick={addAno} className="px-4 py-1.5 text-sm font-medium bg-[#0EA5E9] text-black rounded-lg hover:bg-[#38bdf8]">
                Criar
              </button>
            </div>
          </div>
          {anos.map(a => (
            <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-line">
              <span className="text-sm font-semibold text-white w-12">{a.ano}</span>
              <span className="text-xs text-[#555]">Saldo inicial:</span>
              <input
                type="number"
                defaultValue={a.saldo_inicial}
                onBlur={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) updateSaldoInicial(a.id, v) }}
                className="w-32 bg-bg border border-line rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-[#0EA5E9]/60 tabular-nums"
              />
            </div>
          ))}
        </div>
      )}

      {/* Backup */}
      {tab === 'backup' && <BackupTab anos={anos} />}

      {/* Previsão do diário */}
      {tab === 'previsao' && (
        <div className="space-y-4">
          <div className="bg-bg-2 border border-line rounded-xl p-4 space-y-3">
            <div className="text-xs text-[#555] font-[Sora] uppercase tracking-wider">Nova categoria</div>
            <div className="flex gap-2">
              <input
                placeholder="Ex: Mercado"
                value={prevForm.nome}
                onChange={e => setPrevForm({ ...prevForm, nome: e.target.value })}
                className="flex-1 bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60"
              />
              <input
                placeholder="R$ 0"
                value={prevForm.valor}
                onChange={e => setPrevForm({ ...prevForm, valor: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && addPrevisaoItem()}
                className="w-28 bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60 tabular-nums"
              />
              <button onClick={addPrevisaoItem}
                className="px-4 py-1.5 text-sm font-medium bg-[#0EA5E9] text-black rounded-lg hover:bg-[#38bdf8]">
                <Plus size={14} />
              </button>
            </div>
          </div>

          {previsaoItems.map(item => (
            <div key={item.id} className="group flex items-center gap-3 py-2.5 border-b border-line">
              <span className="flex-1 text-sm text-white">{item.nome}</span>
              <input
                type="number"
                defaultValue={item.valor}
                onBlur={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) updatePrevisaoValor(item.id, v) }}
                className="w-28 bg-bg border border-line rounded-lg px-3 py-1 text-xs text-white outline-none tabular-nums text-right focus:border-[#0EA5E9]/60"
              />
              <button onClick={() => delPrevisaoItem(item.id)}
                className="opacity-0 group-hover:opacity-100 text-[#555] hover:text-[#ef4444] transition-all">
                <Trash2 size={12} />
              </button>
            </div>
          ))}

          {previsaoItems.length > 0 && (() => {
            const total = previsaoItems.reduce((s, i) => s + (Number(i.valor) || 0), 0)
            const daysThisMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
            const daily = Math.round((total / daysThisMonth) * 100) / 100
            return (
              <div className="bg-bg-2 border border-line rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#555]">Total mensal</span>
                  <span className="text-white font-medium tabular-nums">
                    {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#555]">Dividido por {daysThisMonth} dias</span>
                  <span className="text-[#0EA5E9] font-bold tabular-nums text-base">
                    {daily.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            )
          })()}

          {previsaoItems.length === 0 && (
            <div className="text-center py-10 text-[#555] text-sm">
              Nenhuma categoria. Adicione acima para ativar o diário automático.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BackupTab
// ─────────────────────────────────────────────────────────────────────────────

type ImportState = 'idle' | 'reading' | 'preview' | 'importing' | 'done' | 'error'

interface PreviewData {
  format: 'mos-v1' | 'legacy'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any
  counts: { lancamentos: number; metas: number; investimentos: number; extras?: string }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function countLegacy(json: any): PreviewData['counts'] {
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
function countMosV1(json: any): PreviewData['counts'] {
  const d = json.data ?? {}
  return {
    lancamentos: (d.lancamentos ?? []).length,
    metas: (d.metas ?? []).length,
    investimentos: (d.investimentos ?? []).length,
    extras: `${(d.anos ?? []).length} ano(s) · ${(d.categorias ?? []).length} cat · ${(d.cartoes ?? []).length} cartões`,
  }
}

function mkDate(anoNum: number, mes: number, dia: string | number) {
  const d = parseInt(String(dia)) || 1
  return `${anoNum}-${String(mes).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function importarFormatoAntigo(json: any, anoId: string, onProgress: (p: number) => void): Promise<string[]> {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function importarMosV1(json: any, onProgress: (p: number) => void): Promise<string[]> {
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

function BackupTab({ anos }: { anos: FinAno[] }) {
  const [exporting, setExporting] = useState(false)
  const [importState, setImportState] = useState<ImportState>('idle')
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [progress, setProgress] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const [selectedAnoId, setSelectedAnoId] = useState(anos[anos.length - 1]?.id ?? '')
  const fileRef = useRef<HTMLInputElement>(null)

  async function exportBackup() {
    setExporting(true)
    try {
      const [
        { data: anosD }, { data: lancsD }, { data: metasD },
        { data: invsD }, { data: catsD }, { data: cardsD }, { data: recsD },
      ] = await Promise.all([
        supabase.from('fin_anos').select('*'),
        supabase.from('fin_lancamentos').select('*'),
        supabase.from('fin_metas').select('*'),
        supabase.from('fin_investimentos').select('*'),
        supabase.from('fin_categorias').select('*'),
        supabase.from('fin_cartoes').select('*'),
        supabase.from('fin_recorrentes').select('*'),
      ])
      const payload = {
        version: 'mos-v1',
        exportedAt: new Date().toISOString(),
        data: {
          anos: anosD ?? [],
          lancamentos: lancsD ?? [],
          metas: metasD ?? [],
          investimentos: invsD ?? [],
          categorias: catsD ?? [],
          cartoes: cardsD ?? [],
          recorrentes: recsD ?? [],
        },
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `financeiro-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportState('reading')
    setPreview(null)
    setLog([])
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      if (json.version === 'mos-v1') {
        setPreview({ format: 'mos-v1', json, counts: countMosV1(json) })
      } else if (json.months) {
        setPreview({ format: 'legacy', json, counts: countLegacy(json) })
      } else {
        setLog(['Formato de arquivo não reconhecido.'])
        setImportState('error')
        return
      }
      setImportState('preview')
    } catch {
      setLog(['Erro ao ler o arquivo. Verifique se é um JSON válido.'])
      setImportState('error')
    }
  }

  async function doImport() {
    if (!preview) return
    setImportState('importing')
    setProgress(0)
    setLog([])
    try {
      let erros: string[]
      if (preview.format === 'mos-v1') {
        erros = await importarMosV1(preview.json, setProgress)
      } else {
        if (!selectedAnoId) {
          setLog(['Selecione um ano de destino.'])
          setImportState('error')
          return
        }
        erros = await importarFormatoAntigo(preview.json, selectedAnoId, setProgress)
      }
      setProgress(100)
      setLog(erros.length ? erros : ['Importação concluída com sucesso!'])
      setImportState('done')
    } catch (err) {
      setLog([String(err)])
      setImportState('error')
    }
  }

  function reset() {
    setImportState('idle')
    setPreview(null)
    setProgress(0)
    setLog([])
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-5">

      {/* ── Seção A: Exportar ── */}
      <div className="bg-bg-2 border border-line rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-[#555] font-[Sora] uppercase tracking-wider mb-1">Exportar backup</div>
            <div className="text-sm text-[#aaa]">
              Baixa todos os dados financeiros como JSON — anos, lançamentos, metas, investimentos, categorias, cartões e recorrentes.
            </div>
          </div>
          <button
            onClick={exportBackup}
            disabled={exporting}
            className="flex items-center gap-2 shrink-0 px-4 py-2 text-sm font-medium bg-[#0EA5E9] text-black rounded-lg hover:bg-[#38bdf8] disabled:opacity-40 transition-colors"
          >
            <Download size={14} />
            {exporting ? 'Exportando…' : 'Baixar backup'}
          </button>
        </div>
      </div>

      {/* ── Seção B: Importar ── */}
      <div className="bg-bg-2 border border-line rounded-xl p-5 space-y-4">
        <div className="text-xs text-[#555] font-[Sora] uppercase tracking-wider">Restaurar backup</div>

        {/* Aviso */}
        <div className="flex gap-2.5 bg-[#f59e0b]/5 border border-[#f59e0b]/20 rounded-lg px-3 py-2.5">
          <AlertTriangle size={14} className="text-[#f59e0b] shrink-0 mt-0.5" />
          <div className="text-xs text-[#f59e0b]/80">
            A importação <strong>adiciona</strong> dados ao existente sem apagar nada. Se quiser substituir tudo, exporte um backup dos dados atuais antes de importar.
          </div>
        </div>

        {/* Upload */}
        {importState === 'idle' && (
          <label className="flex flex-col items-center gap-3 py-8 border border-dashed border-[#2a2a2a] rounded-xl cursor-pointer hover:border-[#0EA5E9]/40 transition-colors">
            <Upload size={20} className="text-[#444]" />
            <span className="text-sm text-[#555]">Selecionar arquivo JSON</span>
            <input ref={fileRef} type="file" accept=".json" className="sr-only" onChange={onFileChange} />
          </label>
        )}

        {/* Reading */}
        {importState === 'reading' && (
          <div className="flex items-center gap-2 text-sm text-[#555] py-4">
            <div className="w-4 h-4 rounded-full border-2 border-[#0EA5E9] border-t-transparent animate-spin" />
            Lendo arquivo…
          </div>
        )}

        {/* Preview */}
        {importState === 'preview' && preview && (
          <div className="space-y-3">
            <div className="bg-bg border border-line rounded-lg px-4 py-3 space-y-1.5">
              <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">
                {preview.format === 'mos-v1' ? 'Formato MOS v1' : 'Formato legado'}{preview.counts.extras ? ` · ${preview.counts.extras}` : ''}
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-[#aaa]">Lançamentos: <strong className="text-white">{preview.counts.lancamentos}</strong></span>
                <span className="text-[#aaa]">Metas: <strong className="text-white">{preview.counts.metas}</strong></span>
                <span className="text-[#aaa]">Investimentos: <strong className="text-white">{preview.counts.investimentos}</strong></span>
              </div>
            </div>

            {/* Ano destino (formato legado) */}
            {preview.format === 'legacy' && (
              <div>
                <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1.5">Ano de destino</div>
                <select
                  value={selectedAnoId}
                  onChange={e => setSelectedAnoId(e.target.value)}
                  className="w-full bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                >
                  <option value="">Selecione…</option>
                  {anos.map(a => <option key={a.id} value={a.id}>{a.ano}</option>)}
                </select>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={reset} className="px-4 py-2 text-sm text-[#555] border border-line rounded-lg hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={doImport}
                disabled={preview.format === 'legacy' && !selectedAnoId}
                className="flex-1 py-2 text-sm font-medium bg-[#0EA5E9] text-black rounded-lg hover:bg-[#38bdf8] disabled:opacity-40 transition-colors"
              >
                Importar
              </button>
            </div>
          </div>
        )}

        {/* Progress */}
        {importState === 'importing' && (
          <div className="space-y-3">
            <div className="text-sm text-[#555]">Importando… {progress}%</div>
            <div className="h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0EA5E9] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Done / Error */}
        {(importState === 'done' || importState === 'error') && (
          <div className="space-y-3">
            <div className="h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
              <div className={['h-full rounded-full', importState === 'done' ? 'bg-[#22c55e]' : 'bg-[#ef4444]'].join(' ')} style={{ width: '100%' }} />
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {log.map((l, i) => (
                <div key={i} className={['text-xs', l.includes('sucesso') ? 'text-[#22c55e]' : l.startsWith('Importação') ? 'text-[#22c55e]' : 'text-[#ef4444]/80'].join(' ')}>
                  {l}
                </div>
              ))}
            </div>
            <button onClick={reset} className="px-4 py-1.5 text-sm text-[#0EA5E9] border border-[#0EA5E9]/30 rounded-lg hover:border-[#0EA5E9]/60 transition-colors">
              Importar outro arquivo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
