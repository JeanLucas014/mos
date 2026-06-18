import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Play } from 'lucide-react'
import type { FinAno, FinCategoria, FinCartao, FinRecorrente } from '../types'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

interface Props { anos: FinAno[]; onReload: () => void }

export function ConfigTab({ anos, onReload }: Props) {
  const [tab, setTab] = useState<'recorrentes' | 'categorias' | 'cartoes' | 'anos'>('recorrentes')
  const [recorrentes, setRecorrentes] = useState<FinRecorrente[]>([])
  const [categorias, setCategorias] = useState<FinCategoria[]>([])
  const [cartoes, setCartoes] = useState<FinCartao[]>([])
  const [loading, setLoading] = useState(true)

  // Forms
  const [recForm, setRecForm] = useState({ nome: '', valor: '', dia_previsto: '10', saida_tipo: 'fixa' })
  const [catForm, setCatForm] = useState({ nome: '', natureza: 'diario', cor: '', rapida: false })
  const [cardForm, setCardForm] = useState({ nome: '', cor: '' })
  const [anoForm, setAnoForm] = useState({ ano: String(new Date().getFullYear() + 1), saldo_inicial: '0' })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: r }, { data: c }, { data: cr }] = await Promise.all([
      supabase.from('fin_recorrentes').select('*').order('dia_previsto'),
      supabase.from('fin_categorias').select('*').order('ordem'),
      supabase.from('fin_cartoes').select('*').order('nome'),
    ])
    setRecorrentes((r ?? []) as FinRecorrente[])
    setCategorias((c ?? []) as FinCategoria[])
    setCartoes((cr ?? []) as FinCartao[])
    setLoading(false)
  }

  // Lançar fixos do mês
  async function launchRecorrentes(mes: number) {
    const ano = anos[anos.length - 1]
    if (!ano) return alert('Nenhum ano configurado.')
    const ativas = recorrentes.filter(r => r.ativo)
    if (!ativas.length) return alert('Nenhum recorrente ativo.')

    for (const rec of ativas) {
      const dia = Math.min(rec.dia_previsto, new Date(ano.ano, mes, 0).getDate())
      const data = `${ano.ano}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
      const { data: exists } = await (supabase.from('fin_lancamentos') as any)
        .select('id').eq('ano_id', ano.id).eq('nome', rec.nome).eq('data', data).limit(1)
      if (!(exists as {id:string}[] | null)?.length) {
        await (supabase.from('fin_lancamentos') as any).insert({
          ano_id: ano.id, data, natureza: 'saida', nome: rec.nome,
          valor: rec.valor, is_grupo: false,
          saida_tipo: rec.saida_tipo as 'fixa' | 'cartao',
        })
      }
    }
    alert(`${ativas.length} lançamentos inseridos para ${MESES[mes - 1]}.`)
  }

  async function addRecorrente() {
    const v = parseFloat(recForm.valor.replace(',', '.')) || 0
    if (!recForm.nome.trim()) return
    await (supabase.from('fin_recorrentes') as any).insert({
      nome: recForm.nome.trim(), valor: v,
      dia_previsto: parseInt(recForm.dia_previsto) || 10,
      saida_tipo: recForm.saida_tipo,
    })
    setRecForm({ nome: '', valor: '', dia_previsto: '10', saida_tipo: 'fixa' })
    loadAll()
  }

  async function toggleRecorrente(id: string, ativo: boolean) {
    await (supabase.from('fin_recorrentes') as any).update({ ativo }).eq('id', id)
    loadAll()
  }

  async function delRec(id: string) {
    await (supabase.from('fin_recorrentes') as any).delete().eq('id', id)
    loadAll()
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

  const subtabs = [
    { id: 'recorrentes', label: 'Recorrentes' },
    { id: 'categorias',  label: 'Categorias' },
    { id: 'cartoes',     label: 'Cartões' },
    { id: 'anos',        label: 'Anos' },
  ] as const

  if (loading) return <div className="flex justify-center py-16"><div className="w-5 h-5 rounded-full border-2 border-[#0EA5E9] border-t-transparent animate-spin" /></div>

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-1 mb-6 border-b border-[#1f1f1f]">
        {subtabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={['px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'text-[#0EA5E9] border-[#0EA5E9]' : 'text-[#555] border-transparent hover:text-[#999]'].join(' ')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Recorrentes */}
      {tab === 'recorrentes' && (
        <div className="space-y-4">
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4">
            <div className="text-xs text-[#555] font-[Sora] uppercase tracking-wider mb-3">Lançar fixos do mês</div>
            <div className="flex gap-2 flex-wrap">
              {MESES.map((m, i) => (
                <button key={i} onClick={() => launchRecorrentes(i + 1)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border border-[#1f1f1f] rounded-lg text-[#666] hover:text-[#0EA5E9] hover:border-[#0EA5E9]/40 transition-colors">
                  <Play size={10} /> {m}
                </button>
              ))}
            </div>
          </div>

          {/* Add form */}
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 space-y-3">
            <div className="text-xs text-[#555] font-[Sora] uppercase tracking-wider">Novo recorrente</div>
            <div className="flex gap-2 flex-wrap">
              <input placeholder="Nome" value={recForm.nome} onChange={e => setRecForm({ ...recForm, nome: e.target.value })}
                className="flex-1 min-w-32 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60" />
              <input placeholder="Valor" value={recForm.valor} onChange={e => setRecForm({ ...recForm, valor: e.target.value })}
                className="w-24 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60 tabular-nums" />
              <input placeholder="Dia" type="number" min={1} max={31} value={recForm.dia_previsto}
                onChange={e => setRecForm({ ...recForm, dia_previsto: e.target.value })}
                className="w-16 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60 tabular-nums" />
              <select value={recForm.saida_tipo} onChange={e => setRecForm({ ...recForm, saida_tipo: e.target.value })}
                className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white outline-none">
                <option value="fixa">Fixa</option>
                <option value="cartao">Cartão</option>
              </select>
              <button onClick={addRecorrente}
                className="px-4 py-1.5 text-sm font-medium bg-[#0EA5E9] text-black rounded-lg hover:bg-[#38bdf8]">
                <Plus size={14} />
              </button>
            </div>
          </div>

          {recorrentes.map(r => (
            <div key={r.id} className="group flex items-center gap-3 py-2.5 border-b border-[#1f1f1f]">
              <button onClick={() => toggleRecorrente(r.id, !r.ativo)}
                className={['w-3 h-3 rounded-full border shrink-0', r.ativo ? 'bg-[#22c55e] border-[#22c55e]' : 'border-[#555]'].join(' ')} />
              <span className={['flex-1 text-sm', r.ativo ? 'text-white' : 'text-[#555]'].join(' ')}>{r.nome}</span>
              <span className="text-xs text-[#555]">Dia {r.dia_previsto}</span>
              <span className="text-xs text-[#555]">{r.saida_tipo}</span>
              <button onClick={() => delRec(r.id)} className="opacity-0 group-hover:opacity-100 text-[#555] hover:text-[#ef4444] transition-all">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Categorias */}
      {tab === 'categorias' && (
        <div className="space-y-4">
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 space-y-3">
            <div className="text-xs text-[#555] font-[Sora] uppercase tracking-wider">Nova categoria</div>
            <div className="flex gap-2 flex-wrap">
              <input placeholder="Nome" value={catForm.nome} onChange={e => setCatForm({ ...catForm, nome: e.target.value })}
                className="flex-1 min-w-32 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60" />
              <select value={catForm.natureza} onChange={e => setCatForm({ ...catForm, natureza: e.target.value })}
                className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white outline-none">
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
                <option value="diario">Diário</option>
              </select>
              <input type="color" value={catForm.cor || '#555555'} onChange={e => setCatForm({ ...catForm, cor: e.target.value })}
                className="w-10 h-9 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg cursor-pointer" />
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
                  <div key={c.id} className="group flex items-center gap-2 py-2 border-b border-[#1f1f1f]">
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
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 space-y-3">
            <div className="text-xs text-[#555] font-[Sora] uppercase tracking-wider">Novo cartão</div>
            <div className="flex gap-2">
              <input placeholder="Nome" value={cardForm.nome} onChange={e => setCardForm({ ...cardForm, nome: e.target.value })}
                className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60" />
              <input type="color" value={cardForm.cor || '#555555'} onChange={e => setCardForm({ ...cardForm, cor: e.target.value })}
                className="w-10 h-9 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg cursor-pointer" />
              <button onClick={addCartao} className="px-4 py-1.5 text-sm font-medium bg-[#0EA5E9] text-black rounded-lg hover:bg-[#38bdf8]">
                <Plus size={14} />
              </button>
            </div>
          </div>
          {cartoes.map(c => (
            <div key={c.id} className="group flex items-center gap-3 py-2.5 border-b border-[#1f1f1f]">
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
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 space-y-3">
            <div className="text-xs text-[#555] font-[Sora] uppercase tracking-wider">Criar novo ano</div>
            <div className="flex gap-2">
              <input placeholder="2027" value={anoForm.ano} onChange={e => setAnoForm({ ...anoForm, ano: e.target.value })}
                className="w-24 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60 tabular-nums" />
              <input placeholder="Saldo inicial" value={anoForm.saldo_inicial} onChange={e => setAnoForm({ ...anoForm, saldo_inicial: e.target.value })}
                className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60 tabular-nums" />
              <button onClick={addAno} className="px-4 py-1.5 text-sm font-medium bg-[#0EA5E9] text-black rounded-lg hover:bg-[#38bdf8]">
                Criar
              </button>
            </div>
          </div>
          {anos.map(a => (
            <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-[#1f1f1f]">
              <span className="text-sm font-semibold text-white w-12">{a.ano}</span>
              <span className="text-xs text-[#555]">Saldo inicial:</span>
              <input
                type="number"
                defaultValue={a.saldo_inicial}
                onBlur={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) updateSaldoInicial(a.id, v) }}
                className="w-32 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-[#0EA5E9]/60 tabular-nums"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
