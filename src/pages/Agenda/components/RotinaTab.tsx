import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Pencil } from 'lucide-react'
import type { Rotina } from '../types'
import { EVENT_COLORS, DIAS_SEMANA } from '../types'

interface Props {
  rotinas: Rotina[]
  onReload: () => void
}

const EMPTY: Partial<Rotina> = {
  titulo: '', descricao: '', hora_inicio: '', hora_fim: '',
  dias_semana: [], cor: '#0EA5E9', ativa: true,
}

const DIAS_LABELS: Record<string, string> = {
  dom: 'Dom', seg: 'Seg', ter: 'Ter', qua: 'Qua',
  qui: 'Qui', sex: 'Sex', sab: 'Sáb',
}

export function RotinaTab({ rotinas, onReload }: Props) {
  const [editing, setEditing] = useState<Partial<Rotina> | null>(null)
  const [saving,  setSaving]  = useState(false)

  async function save() {
    if (!editing?.titulo?.trim()) return
    setSaving(true)
    if (editing.id) {
      await supabase.from('calendar_rotinas').update(editing).eq('id', editing.id)
    } else {
      await supabase.from('calendar_rotinas').insert({ ...editing, titulo: editing.titulo!, ordem: rotinas.length })
    }
    setSaving(false)
    setEditing(null)
    onReload()
  }

  async function del(id: string) {
    if (!window.confirm('Excluir esta rotina?')) return
    await supabase.from('calendar_rotinas').delete().eq('id', id)
    onReload()
  }

  async function toggle(r: Rotina) {
    await supabase.from('calendar_rotinas').update({ ativa: !r.ativa }).eq('id', r.id)
    onReload()
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold font-[Sora] text-white">Rotina</h2>
          <p className="text-xs text-[#555] mt-0.5">Descreva como são seus dias típicos da semana</p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="flex items-center gap-1.5 text-sm text-[#0EA5E9] hover:text-white transition-colors"
        >
          <Plus size={14} /> Nova rotina
        </button>
      </div>

      {/* Form */}
      {editing && (
        <div className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-4 space-y-3">
          <input
            value={editing.titulo ?? ''}
            onChange={e => setEditing(v => ({ ...v!, titulo: e.target.value }))}
            placeholder="Ex: Manhã de treino, Trabalho remoto..."
            autoFocus
            className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#0EA5E9]/60"
          />
          <textarea
            value={editing.descricao ?? ''}
            onChange={e => setEditing(v => ({ ...v!, descricao: e.target.value }))}
            placeholder="Descrição detalhada da rotina desse período..."
            rows={3}
            className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-[#aaa] outline-none resize-none focus:border-[#0EA5E9]/60"
          />
          <div className="flex gap-2 items-center">
            <input
              type="time"
              value={editing.hora_inicio ?? ''}
              onChange={e => setEditing(v => ({ ...v!, hora_inicio: e.target.value }))}
              className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#0EA5E9]/60"
            />
            <span className="text-[#555] text-xs">até</span>
            <input
              type="time"
              value={editing.hora_fim ?? ''}
              onChange={e => setEditing(v => ({ ...v!, hora_fim: e.target.value }))}
              className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[#0EA5E9]/60"
            />
          </div>

          {/* Days of week */}
          <div className="flex gap-1">
            {DIAS_SEMANA.map(d => {
              const active = (editing.dias_semana ?? []).includes(d.id)
              return (
                <button key={d.id}
                  onClick={() => setEditing(v => ({
                    ...v!,
                    dias_semana: active
                      ? (v!.dias_semana ?? []).filter(x => x !== d.id)
                      : [...(v!.dias_semana ?? []), d.id],
                  }))}
                  className={['w-9 h-9 text-xs rounded-full border transition-colors font-medium',
                    active
                      ? 'border-[#0EA5E9] bg-[#0EA5E9]/20 text-[#0EA5E9]'
                      : 'border-[#1f1f1f] text-[#555] hover:text-white',
                  ].join(' ')}>
                  {d.label[0]}
                </button>
              )
            })}
          </div>

          {/* Color */}
          <div className="flex gap-1.5">
            {EVENT_COLORS.map(c => (
              <button key={c}
                onClick={() => setEditing(v => ({ ...v!, cor: c }))}
                className="w-5 h-5 rounded-full hover:scale-110 transition-transform"
                style={{
                  background:    c,
                  outline:       editing.cor === c ? `2px solid ${c}` : 'none',
                  outlineOffset: 2,
                }} />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setEditing(null)}
              className="px-3 py-1.5 text-sm text-[#555] border border-[#1f1f1f] rounded-lg hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={saving || !editing.titulo?.trim()}
              className="flex-1 py-1.5 text-sm font-semibold bg-[#0EA5E9] text-black rounded-lg disabled:opacity-40 hover:bg-[#38bdf8] transition-colors"
            >
              {saving ? 'Salvando…' : editing.id ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {rotinas.map(r => (
        <div key={r.id} className="group bg-[#111111] border border-[#1f1f1f] rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: r.cor }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={['text-sm font-semibold', r.ativa ? 'text-white' : 'text-[#555] line-through'].join(' ')}>
                  {r.titulo}
                </span>
                {r.hora_inicio && (
                  <span className="text-[10px] text-[#555]">
                    {r.hora_inicio}{r.hora_fim ? ` – ${r.hora_fim}` : ''}
                  </span>
                )}
              </div>
              {r.dias_semana.length > 0 && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {r.dias_semana.map(d => (
                    <span key={d} className="text-[9px] px-1.5 py-0.5 rounded-full border border-[#1f1f1f] text-[#555]">
                      {DIAS_LABELS[d] ?? d}
                    </span>
                  ))}
                </div>
              )}
              {r.descricao && (
                <p className="text-xs text-[#666] mt-2 leading-relaxed">{r.descricao}</p>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => toggle(r)}
                title={r.ativa ? 'Desativar' : 'Ativar'}
                className={['text-xs px-2 py-1 rounded-lg border transition-colors',
                  r.ativa
                    ? 'border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e]/10'
                    : 'border-[#1f1f1f] text-[#555] hover:text-white',
                ].join(' ')}>
                {r.ativa ? 'Ativa' : 'Inativa'}
              </button>
              <button onClick={() => setEditing(r)} className="text-[#555] hover:text-[#0EA5E9] p-1 transition-colors">
                <Pencil size={13} />
              </button>
              <button onClick={() => del(r.id)} className="text-[#555] hover:text-[#ef4444] p-1 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {rotinas.length === 0 && !editing && (
        <div className="text-center py-12 text-[#555] text-sm">
          Nenhuma rotina.{' '}
          <button onClick={() => setEditing({ ...EMPTY })} className="text-[#0EA5E9] hover:underline">
            Criar →
          </button>
        </div>
      )}
    </div>
  )
}
