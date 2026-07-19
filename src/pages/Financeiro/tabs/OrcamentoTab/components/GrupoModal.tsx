import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import type { FinCategoria } from '../../../types'
import type { OrcamentoGrupo, OrcamentoGrupoTipo, OrcamentoGrupoModo } from '../types'

interface Props {
  grupo: OrcamentoGrupo | null // null = criar novo
  initialTipo?: OrcamentoGrupoTipo // usado só na criação, ao clicar "+ Grupo" de uma seção específica
  categorias: FinCategoria[]
  onSave: (fields: { nome: string; tipo: OrcamentoGrupoTipo; modo: OrcamentoGrupoModo; valorPrevistoPadrao: number; categoriasVinculadas: string[] }) => void
  onDelete?: () => void
  onClose: () => void
}

export function GrupoModal({ grupo, initialTipo, categorias, onSave, onDelete, onClose }: Props) {
  const [nome, setNome] = useState(grupo?.nome ?? '')
  const [tipo, setTipo] = useState<OrcamentoGrupoTipo>(grupo?.tipo ?? initialTipo ?? 'fixo')
  const [modo, setModo] = useState<OrcamentoGrupoModo>(grupo?.modo ?? 'manual')
  const [valor, setValor] = useState(String(grupo?.valor_previsto_padrao ?? 0))
  const [cats, setCats] = useState<string[]>(grupo?.categorias_vinculadas ?? [])

  function toggleCat(id: string) {
    setCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  function handleSubmit() {
    if (!nome.trim()) return
    onSave({ nome: nome.trim(), tipo, modo, valorPrevistoPadrao: Number(valor) || 0, categoriasVinculadas: cats })
  }

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-bg-2 border border-line rounded-xl p-5 w-full max-w-sm max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-white font-[Sora]">
            {grupo ? 'Editar grupo' : 'Novo grupo de orçamento'}
          </span>
          <button onClick={onClose} className="text-ink-3 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-ink-2 mb-1.5 text-xs font-semibold">Nome</label>
            <input
              autoFocus
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Casa, Lazer, Saúde"
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand/60"
            />
          </div>

          <div>
            <label className="block text-ink-2 mb-1.5 text-xs font-semibold">Tipo</label>
            <div className="flex gap-2">
              {(['fixo', 'variavel'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={[
                    'flex-1 py-1.5 text-xs rounded-lg border transition-colors',
                    tipo === t ? 'border-brand/50 text-brand' : 'border-line text-ink-3 hover:text-white',
                  ].join(' ')}
                >
                  {t === 'fixo' ? 'Fixo' : 'Variável'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-ink-2 mb-1.5 text-xs font-semibold">Como calcular</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setModo('manual')}
                className={[
                  'flex-1 py-1.5 text-xs rounded-lg border transition-colors',
                  modo === 'manual' ? 'border-brand/50 text-brand' : 'border-line text-ink-3 hover:text-white',
                ].join(' ')}
              >
                Valor manual
              </button>
              <button
                type="button"
                onClick={() => setModo('categoria')}
                className={[
                  'flex-1 py-1.5 text-xs rounded-lg border transition-colors',
                  modo === 'categoria' ? 'border-brand/50 text-brand' : 'border-line text-ink-3 hover:text-white',
                ].join(' ')}
              >
                Vinculado a categoria
              </button>
            </div>
            <p className="text-[11px] text-ink-3 mt-1.5">
              {modo === 'manual'
                ? 'Valor fixo, sem cálculo automático — você atualiza quando quiser.'
                : 'O realizado é somado automaticamente a partir dos lançamentos do mês corrente nas categorias escolhidas.'}
            </p>
          </div>

          <div>
            <label className="block text-ink-2 mb-1.5 text-xs font-semibold">
              {modo === 'manual' ? 'Valor previsto' : 'Valor previsto (meta)'}
            </label>
            <input
              type="number"
              step="0.01"
              value={valor}
              onChange={e => setValor(e.target.value)}
              className="w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand/60"
            />
          </div>

          {modo === 'categoria' && (
            <div>
              <label className="block text-ink-2 mb-1.5 text-xs font-semibold">
                Categorias vinculadas
              </label>
              <p className="text-[11px] text-ink-3 mb-2">
                Lançamentos nessas categorias, no mês corrente, contam como "realizado" deste grupo.
              </p>
              <div className="bg-bg border border-line rounded-lg max-h-40 overflow-y-auto">
                {categorias.length === 0 ? (
                  <div className="text-xs text-ink-3 text-center py-4">Nenhuma categoria de saída cadastrada.</div>
                ) : categorias.map(c => (
                  <label key={c.id} className="flex items-center gap-2 px-3 py-2 border-b border-line last:border-0 cursor-pointer hover:bg-bg-3">
                    <input
                      type="checkbox"
                      checked={cats.includes(c.id)}
                      onChange={() => toggleCat(c.id)}
                      className="accent-brand"
                    />
                    {c.cor && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.cor }} />}
                    <span className="text-xs text-ink-2">{c.nome}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={handleSubmit}
            disabled={!nome.trim()}
            className="flex-1 bg-brand text-black rounded-lg font-semibold text-sm py-2 hover:brightness-110 disabled:opacity-40 transition-all"
          >
            {grupo ? 'Salvar' : 'Criar grupo'}
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-red-400 hover:text-red-300 border border-line rounded-lg px-3 transition-colors"
              title="Remover grupo"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
