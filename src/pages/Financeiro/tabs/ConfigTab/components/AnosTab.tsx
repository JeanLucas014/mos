import { useState } from 'react'
import type { FinAno } from '../../../types'

interface AnosTabProps {
  anos: FinAno[]
  onAdd: (ano: string, saldoInicial: string) => Promise<void>
  onUpdateSaldoInicial: (id: string, v: number) => void
}

export function AnosTab({ anos, onAdd, onUpdateSaldoInicial }: AnosTabProps) {
  const [anoForm, setAnoForm] = useState({ ano: String(new Date().getFullYear() + 1), saldo_inicial: '0' })

  async function handleAdd() {
    await onAdd(anoForm.ano, anoForm.saldo_inicial)
    setAnoForm({ ano: String(parseInt(anoForm.ano) + 1), saldo_inicial: '0' })
  }

  return (
    <div className="space-y-4">
      <div className="bg-bg-2 border border-line rounded-xl p-4 space-y-3">
        <div className="text-xs text-ink-3 font-[Sora] uppercase tracking-wider">Criar novo ano</div>
        <div className="flex gap-2">
          <input placeholder="2027" value={anoForm.ano} onChange={e => setAnoForm({ ...anoForm, ano: e.target.value })}
            className="w-24 bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-brand/60 tabular-nums" />
          <input placeholder="Saldo inicial" value={anoForm.saldo_inicial} onChange={e => setAnoForm({ ...anoForm, saldo_inicial: e.target.value })}
            className="flex-1 bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-brand/60 tabular-nums" />
          <button onClick={handleAdd} className="px-4 py-1.5 text-sm font-medium bg-brand text-black rounded-lg hover:bg-[#38bdf8]">
            Criar
          </button>
        </div>
      </div>
      {anos.map(a => (
        <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-line">
          <span className="text-sm font-semibold text-white w-12">{a.ano}</span>
          <span className="text-xs text-ink-3">Saldo inicial:</span>
          <input
            type="number"
            defaultValue={a.saldo_inicial}
            onBlur={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onUpdateSaldoInicial(a.id, v) }}
            className="w-32 bg-bg border border-line rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-brand/60 tabular-nums"
          />
        </div>
      ))}
    </div>
  )
}
