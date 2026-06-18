import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2 } from 'lucide-react'
import type { FinInvestimento } from '../types'

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')

export function InvestimentosTab() {
  const [items, setItems] = useState<FinInvestimento[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ data: new Date().toISOString().slice(0, 10), valor: '', descricao: '' })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('fin_investimentos').select('*').order('data', { ascending: false })
    setItems((data ?? []) as FinInvestimento[])
    setLoading(false)
  }

  async function save() {
    const v = parseFloat(form.valor.replace(',', '.'))
    if (!v || !form.data) return
    await (supabase.from('fin_investimentos') as any).insert({ data: form.data, valor: v, descricao: form.descricao || null })
    setShowForm(false)
    setForm({ data: new Date().toISOString().slice(0, 10), valor: '', descricao: '' })
    load()
  }

  async function del(id: string) {
    if (!confirm('Excluir este aporte?')) return
    await (supabase.from('fin_investimentos') as any).delete().eq('id', id)
    load()
  }

  const acumulado = items.reduce((a, i) => a + Number(i.valor), 0)

  if (loading) return <div className="flex justify-center py-16"><div className="w-5 h-5 rounded-full border-2 border-[#0EA5E9] border-t-transparent animate-spin" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-[#555] uppercase tracking-wider font-[Sora]">Total acumulado</div>
          <div className="text-2xl font-bold tabular-nums text-[#0EA5E9] mt-0.5">{BRL(acumulado)}</div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm text-[#0EA5E9] hover:text-white transition-colors"
        >
          <Plus size={14} /> Novo aporte
        </button>
      </div>

      {showForm && (
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 space-y-3">
          <div className="text-sm font-medium text-white">Novo aporte</div>
          <div className="flex gap-2">
            <input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })}
              className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60" />
            <input placeholder="Valor" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })}
              className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60 tabular-nums" />
          </div>
          <input placeholder="Descrição (opcional)" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })}
            className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60" />
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 text-sm text-[#555] border border-[#1f1f1f] rounded-lg hover:text-white">Cancelar</button>
            <button onClick={save} className="flex-1 py-1.5 text-sm font-medium bg-[#0EA5E9] text-black rounded-lg hover:bg-[#38bdf8]">Adicionar</button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {items.map((item, idx) => {
          const acumAtePonto = items.slice(idx).reduce((a, i) => a + Number(i.valor), 0)
          return (
            <div key={item.id} className="group flex items-center gap-3 py-2.5 border-b border-[#1f1f1f]">
              <span className="text-xs text-[#555] w-20 shrink-0 tabular-nums">{fmtDate(item.data)}</span>
              <span className="flex-1 text-sm text-[#aaa]">{item.descricao || '—'}</span>
              <span className="tabular-nums text-sm text-[#0EA5E9] font-medium">+{BRL(Number(item.valor))}</span>
              <span className="tabular-nums text-xs text-[#555]">{BRL(acumAtePonto)}</span>
              <button onClick={() => del(item.id)} className="opacity-0 group-hover:opacity-100 text-[#555] hover:text-[#ef4444] transition-all">
                <Trash2 size={12} />
              </button>
            </div>
          )
        })}
      </div>

      {items.length === 0 && !showForm && (
        <div className="text-center py-12 text-[#555] text-sm">
          Nenhum aporte. <button onClick={() => setShowForm(true)} className="text-[#0EA5E9] hover:underline">Adicionar →</button>
        </div>
      )}
    </div>
  )
}
