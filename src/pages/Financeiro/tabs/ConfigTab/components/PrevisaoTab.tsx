import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { FinPrevisaoConfig } from '../types'

interface PrevisaoTabProps {
  previsaoItems: FinPrevisaoConfig[]
  onAdd: (nome: string, valor: string) => Promise<void>
  onDelete: (id: string) => void
  onUpdateValor: (id: string, valor: number) => void
}

export function PrevisaoTab({ previsaoItems, onAdd, onDelete, onUpdateValor }: PrevisaoTabProps) {
  const [prevForm, setPrevForm] = useState({ nome: '', valor: '' })

  async function handleAdd() {
    await onAdd(prevForm.nome, prevForm.valor)
    setPrevForm({ nome: '', valor: '' })
  }

  return (
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
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="w-28 bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#0EA5E9]/60 tabular-nums"
          />
          <button onClick={handleAdd}
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
            onBlur={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onUpdateValor(item.id, v) }}
            className="w-28 bg-bg border border-line rounded-lg px-3 py-1 text-xs text-white outline-none tabular-nums text-right focus:border-[#0EA5E9]/60"
          />
          <button onClick={() => onDelete(item.id)}
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
  )
}
