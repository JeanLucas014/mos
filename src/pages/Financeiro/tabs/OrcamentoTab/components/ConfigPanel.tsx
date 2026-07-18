import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import type { OrcamentoEntrada, MetaGuardarTipo } from '../types'

interface Props {
  entradas: OrcamentoEntrada[]
  metaGuardarTipo: MetaGuardarTipo
  metaGuardarValor: number
  onAddEntrada: (nome: string, valor: number) => void
  onUpdateEntrada: (id: string, nome: string, valor: number) => void
  onDeleteEntrada: (id: string) => void
  onSaveMeta: (tipo: MetaGuardarTipo, valor: number) => void
  onClose: () => void
}

export function ConfigPanel({
  entradas, metaGuardarTipo, metaGuardarValor,
  onAddEntrada, onUpdateEntrada, onDeleteEntrada, onSaveMeta, onClose,
}: Props) {
  const [novoNome, setNovoNome] = useState('')
  const [novoValor, setNovoValor] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editValor, setEditValor] = useState('')
  const [metaTipo, setMetaTipo] = useState<MetaGuardarTipo>(metaGuardarTipo)
  const [metaValor, setMetaValor] = useState(String(metaGuardarValor))

  function startEdit(e: OrcamentoEntrada) {
    setEditingId(e.id)
    setEditNome(e.nome)
    setEditValor(String(e.valor_previsto_padrao))
  }

  function saveEdit() {
    if (!editingId || !editNome.trim()) return
    onUpdateEntrada(editingId, editNome.trim(), Number(editValor) || 0)
    setEditingId(null)
  }

  function handleAdd() {
    if (!novoNome.trim()) return
    onAddEntrada(novoNome.trim(), Number(novoValor) || 0)
    setNovoNome('')
    setNovoValor('')
  }

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-bg-2 border border-line rounded-xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-white font-[Sora]">Configurar orçamento</span>
          <button onClick={onClose} className="text-ink-3 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Entradas previstas */}
        <div className="mb-6">
          <div className="text-xs text-ink-3 font-[Sora] uppercase tracking-wider mb-2">Entradas previstas</div>
          <div className="bg-bg border border-line rounded-lg overflow-hidden mb-2">
            {entradas.length === 0 && (
              <div className="text-xs text-ink-3 text-center py-4">Nenhuma entrada cadastrada.</div>
            )}
            {entradas.map(e => (
              <div key={e.id} className="group flex items-center gap-2 px-3 py-2 border-b border-line last:border-0">
                {editingId === e.id ? (
                  <>
                    <input
                      autoFocus
                      value={editNome}
                      onChange={ev => setEditNome(ev.target.value)}
                      className="flex-1 min-w-0 bg-bg-3 border border-line rounded px-2 py-1 text-xs text-white outline-none"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={editValor}
                      onChange={ev => setEditValor(ev.target.value)}
                      className="w-24 bg-bg-3 border border-line rounded px-2 py-1 text-xs text-white outline-none"
                    />
                    <button onClick={saveEdit} className="text-brand text-xs font-semibold px-1">OK</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(e)} className="flex-1 min-w-0 text-left text-xs text-ink-2 hover:text-white truncate">
                      {e.nome}
                    </button>
                    <button onClick={() => startEdit(e)} className="text-xs tabular-nums text-ink-3 hover:text-white">
                      R$ {Number(e.valor_previsto_padrao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </button>
                    <button
                      onClick={() => onDeleteEntrada(e.id)}
                      className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              placeholder="Nome (ex: Salário)"
              value={novoNome}
              onChange={e => setNovoNome(e.target.value)}
              className="flex-1 min-w-0 bg-bg border border-line rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-brand/60"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Valor"
              value={novoValor}
              onChange={e => setNovoValor(e.target.value)}
              className="w-24 bg-bg border border-line rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-brand/60"
            />
            <button onClick={handleAdd} className="px-3 bg-brand text-black rounded-lg hover:brightness-110 transition-all flex-shrink-0">
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Meta de guardar/investir */}
        <div>
          <div className="text-xs text-ink-3 font-[Sora] uppercase tracking-wider mb-2">Meta de guardar/investir</div>
          <div className="flex gap-2 mb-2">
            {(['percentual', 'valor_fixo'] as const).map(t => (
              <button
                key={t}
                onClick={() => setMetaTipo(t)}
                className={[
                  'flex-1 py-1.5 text-xs rounded-lg border transition-colors',
                  metaTipo === t ? 'border-brand/50 text-brand' : 'border-line text-ink-3 hover:text-white',
                ].join(' ')}
              >
                {t === 'percentual' ? '% das entradas' : 'Valor fixo (R$)'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              value={metaValor}
              onChange={e => setMetaValor(e.target.value)}
              className="flex-1 bg-bg border border-line rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-brand/60"
            />
            <button
              onClick={() => onSaveMeta(metaTipo, Number(metaValor) || 0)}
              className="bg-brand text-black rounded-lg px-4 py-1.5 text-sm font-semibold hover:brightness-110 transition-all flex-shrink-0"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
