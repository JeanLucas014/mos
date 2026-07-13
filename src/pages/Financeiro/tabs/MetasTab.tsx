import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Pencil } from 'lucide-react'
import type { FinMeta } from '../types'

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function MetasTab() {
  const [metas, setMetas] = useState<FinMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<FinMeta | null>(null)
  const [form, setForm] = useState({ nome: '', alvo: '', atual: '' })
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('fin_metas').select('*').order('ordem')
    setMetas((data ?? []) as FinMeta[])
    setLoading(false)
  }

  async function save() {
    const payload = {
      nome: form.nome.trim(),
      alvo: parseFloat(form.alvo.replace(',', '.')) || 0,
      atual: parseFloat(form.atual.replace(',', '.')) || 0,
    }
    if (!payload.nome) return
    if (editing) {
      await (supabase.from('fin_metas') as any).update(payload).eq('id', editing.id)
    } else {
      await (supabase.from('fin_metas') as any).insert({ ...payload, ordem: metas.length })
    }
    setEditing(null)
    setShowForm(false)
    setForm({ nome: '', alvo: '', atual: '' })
    load()
  }

  async function updateAtual(meta: FinMeta, value: number) {
    await (supabase.from('fin_metas') as any).update({ atual: value }).eq('id', meta.id)
    load()
  }

  async function del(id: string) {
    if (!confirm('Excluir esta meta?')) return
    await (supabase.from('fin_metas') as any).delete().eq('id', id)
    load()
  }

  function openEdit(meta: FinMeta) {
    setEditing(meta)
    setForm({ nome: meta.nome, alvo: String(meta.alvo), atual: String(meta.atual) })
    setShowForm(true)
  }

  if (loading) return <div className="flex justify-center py-16"><div className="w-5 h-5 rounded-full border-2 border-[#0EA5E9] border-t-transparent animate-spin" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#555]">{metas.length} metas</span>
        <button
          onClick={() => { setEditing(null); setForm({ nome: '', alvo: '', atual: '' }); setShowForm(true) }}
          className="flex items-center gap-1.5 text-sm text-[#0EA5E9] hover:text-white transition-colors"
        >
          <Plus size={14} /> Nova meta
        </button>
      </div>

      {showForm && (
        <div className="bg-bg-2 border border-line rounded-xl p-4 space-y-3">
          <div className="text-sm font-medium text-white">{editing ? 'Editar meta' : 'Nova meta'}</div>
          <input placeholder="Nome da meta" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
            className="w-full bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60" />
          <div className="flex gap-2">
            <input placeholder="Valor alvo" value={form.alvo} onChange={e => setForm({ ...form, alvo: e.target.value })}
              className="flex-1 bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60 tabular-nums" />
            <input placeholder="Atual" value={form.atual} onChange={e => setForm({ ...form, atual: e.target.value })}
              className="flex-1 bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60 tabular-nums" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowForm(false); setEditing(null) }}
              className="px-4 py-1.5 text-sm text-[#555] border border-line rounded-lg hover:text-white">Cancelar</button>
            <button onClick={save}
              className="flex-1 py-1.5 text-sm font-medium bg-[#0EA5E9] text-black rounded-lg hover:bg-[#38bdf8]">Salvar</button>
          </div>
        </div>
      )}

      {metas.map(meta => {
        const pct = meta.alvo > 0 ? Math.min((meta.atual / meta.alvo) * 100, 100) : 0
        return (
          <div key={meta.id} className="bg-bg-2 border border-line rounded-xl p-4 group">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-white">{meta.nome}</div>
                <div className="text-xs text-[#555] mt-0.5 tabular-nums">
                  <span style={{ color: '#0EA5E9' }}>{BRL(meta.atual)}</span>
                  <span className="mx-1">/</span>
                  {BRL(meta.alvo)}
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(meta)} className="text-[#555] hover:text-[#0EA5E9]"><Pencil size={13} /></button>
                <button onClick={() => del(meta.id)} className="text-[#555] hover:text-[#ef4444]"><Trash2 size={13} /></button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: pct >= 100 ? '#22c55e' : '#0EA5E9' }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-[#555]">
              <span>{pct.toFixed(0)}%</span>
              <span>{pct >= 100 ? '✓ Concluída' : `Faltam ${BRL(meta.alvo - meta.atual)}`}</span>
            </div>
            {/* Atualizar valor atual */}
            <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <input
                type="number"
                defaultValue={meta.atual}
                onBlur={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) updateAtual(meta, v) }}
                className="flex-1 bg-bg border border-line rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-[#0EA5E9]/60 tabular-nums"
                placeholder="Atualizar valor atual"
              />
            </div>
          </div>
        )
      })}

      {metas.length === 0 && !showForm && (
        <div className="text-center py-12 text-[#555] text-sm">
          Nenhuma meta ainda. <button onClick={() => setShowForm(true)} className="text-[#0EA5E9] hover:underline">Criar →</button>
        </div>
      )}
    </div>
  )
}
