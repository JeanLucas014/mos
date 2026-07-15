import { useState } from 'react'
import { X } from 'lucide-react'
import type { TipoInv, Investimento } from '../types'
import { TIPO_CFG, CORES, INDEXADORES, SUBTIPOS } from '../types'

export function InvestimentoModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Partial<Investimento>
  onClose: () => void
  onSave: (data: Partial<Investimento>) => void
}) {
  const isEdit = !!(initial as Investimento).id
  const [form, setForm] = useState<Partial<Investimento>>({
    tipo: 'renda_fixa',
    cor: '#22c55e',
    ativo: true,
    liquidez: 'no_vencimento',
    ...initial,
  })
  const [saving, setSaving] = useState(false)
  const isRF = form.tipo === 'renda_fixa' || form.tipo === 'previdencia'
  const isVariavel = ['acoes', 'fiis', 'etfs'].includes(form.tipo ?? '')

  const inp =
    'w-full bg-bg border border-line rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#0EA5E9]/60 transition-colors'
  const lbl = 'block text-[11px] text-[#555] uppercase tracking-wider mb-1'

  function upd<K extends keyof Investimento>(k: K, v: Investimento[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    if (!form.nome?.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 bg-black/75 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-2 border border-line rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 bg-bg-2">
          <span className="text-sm font-semibold font-[Sora] text-white">
            {isEdit ? 'Editar ativo' : 'Novo ativo'}
          </span>
          <button onClick={onClose} className="text-[#555] hover:text-white">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4 flex-1">
          {/* Tipo de ativo */}
          <div>
            <label className={lbl}>Classe de ativo</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {Object.entries(TIPO_CFG).map(([tipo, c]) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => upd('tipo', tipo as TipoInv)}
                  className="py-2 px-1 rounded-xl border text-xs transition-colors"
                  style={{
                    borderColor: form.tipo === tipo ? c.color : 'var(--border)',
                    background: form.tipo === tipo ? c.color + '15' : 'transparent',
                    color: form.tipo === tipo ? c.color : 'var(--text3)',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subtipo */}
          <div>
            <label className={lbl}>Tipo específico</label>
            <select
              value={form.subtipo ?? ''}
              onChange={e => upd('subtipo', e.target.value)}
              className={inp}
              style={{ colorScheme: 'dark' }}
            >
              <option value="">Selecionar...</option>
              {(SUBTIPOS[form.tipo ?? 'renda_fixa'] ?? []).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Nome e ticker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Nome</label>
              <input
                value={form.nome ?? ''}
                onChange={e => upd('nome', e.target.value)}
                placeholder={isRF ? 'Tesouro IPCA+ 2029' : 'PETR4 - Petrobras'}
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Ticker (opcional)</label>
              <input
                value={form.ticker ?? ''}
                onChange={e => upd('ticker', e.target.value.toUpperCase())}
                placeholder={isRF ? 'TNLP3F' : 'PETR4'}
                className={inp}
              />
            </div>
          </div>

          {/* Instituição e cor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Corretora / Banco</label>
              <input
                value={form.instituicao ?? ''}
                onChange={e => upd('instituicao', e.target.value)}
                placeholder="XP, Nu Invest, BTG..."
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Cor</label>
              <div className="flex gap-2 flex-wrap">
                {CORES.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => upd('cor', c)}
                    className="w-6 h-6 rounded-full hover:scale-110 transition-transform"
                    style={{
                      background: c,
                      outline: form.cor === c ? `2px solid ${c}` : 'none',
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Renda Fixa */}
          {isRF && (
            <>
              <div className="border-t border-line pt-3">
                <div className="text-[11px] text-[#0EA5E9] uppercase tracking-wider mb-3">
                  Dados da aplicação
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Valor aplicado (R$)</label>
                    <input
                      type="number"
                      value={form.valor_aplicado ?? ''}
                      onChange={e => upd('valor_aplicado', +e.target.value)}
                      placeholder="10000.00"
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className={lbl}>Data da aplicação</label>
                    <input
                      type="date"
                      value={form.data_compra ?? ''}
                      onChange={e => upd('data_compra', e.target.value)}
                      className={inp}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Indexador</label>
                  <select
                    value={form.indexador ?? ''}
                    onChange={e => upd('indexador', e.target.value)}
                    className={inp}
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="">Selecionar...</option>
                    {INDEXADORES.map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>
                    {form.indexador === 'PREFIXADO'
                      ? 'Taxa anual (%)'
                      : form.indexador === 'CDI'
                      ? '% do CDI (ex: 115)'
                      : form.indexador === 'SELIC'
                      ? 'SELIC + (%)'
                      : form.indexador === 'IPCA'
                      ? 'IPCA + (%)'
                      : 'Taxa adicional'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.taxa_adicional ?? ''}
                    onChange={e => upd('taxa_adicional', +e.target.value)}
                    placeholder={form.indexador === 'CDI' ? '115' : '5.50'}
                    className={inp}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Vencimento</label>
                  <input
                    type="date"
                    value={form.data_vencimento ?? ''}
                    onChange={e => upd('data_vencimento', e.target.value)}
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}>Liquidez</label>
                  <select
                    value={form.liquidez ?? 'no_vencimento'}
                    onChange={e => upd('liquidez', e.target.value)}
                    className={inp}
                    style={{ colorScheme: 'dark' }}
                  >
                    {[
                      ['D0', 'Diária (D+0)'],
                      ['D+1', 'D+1'],
                      ['D+30', 'D+30'],
                      ['no_vencimento', 'No vencimento'],
                    ].map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Renda Variável */}
          {isVariavel && (
            <div className="border-t border-line pt-3">
              <div className="text-[11px] text-[#0EA5E9] uppercase tracking-wider mb-3">
                Posição atual
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>Quantidade</label>
                  <input
                    type="number"
                    step="any"
                    value={form.quantidade ?? ''}
                    onChange={e => upd('quantidade', +e.target.value)}
                    placeholder="100"
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}>Preço médio (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.preco_medio ?? ''}
                    onChange={e => upd('preco_medio', +e.target.value)}
                    placeholder="32.50"
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}>Preço atual (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={
                      form.valor_atual && form.quantidade && form.quantidade > 0
                        ? +(form.valor_atual / form.quantidade).toFixed(2)
                        : ''
                    }
                    onChange={e => {
                      const ua = +e.target.value
                      upd('valor_atual', form.quantidade ? ua * (form.quantidade ?? 1) : ua)
                    }}
                    placeholder="35.20"
                    className={inp}
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className={lbl}>Total aplicado (R$)</label>
                <input
                  type="number"
                  value={form.valor_aplicado ?? ''}
                  onChange={e => upd('valor_aplicado', +e.target.value)}
                  placeholder={
                    form.quantidade && form.preco_medio
                      ? String((form.quantidade * form.preco_medio).toFixed(2))
                      : ''
                  }
                  className={inp}
                />
              </div>
            </div>
          )}

          {/* Cripto e Fundos */}
          {(form.tipo === 'cripto' || form.tipo === 'fundos' || form.tipo === 'outros') && (
            <div className="border-t border-line pt-3">
              <div className="text-[11px] text-[#0EA5E9] uppercase tracking-wider mb-3">
                Posição
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Total aplicado (R$)</label>
                  <input
                    type="number"
                    value={form.valor_aplicado ?? ''}
                    onChange={e => upd('valor_aplicado', +e.target.value)}
                    placeholder="5000.00"
                    className={inp}
                  />
                </div>
                <div>
                  <label className={lbl}>Valor atual (R$)</label>
                  <input
                    type="number"
                    value={form.valor_atual ?? ''}
                    onChange={e => upd('valor_atual', +e.target.value)}
                    placeholder="6200.00"
                    className={inp}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className={lbl}>Notas (opcional)</label>
            <textarea
              value={form.notas ?? ''}
              onChange={e => upd('notas', e.target.value)}
              rows={2}
              placeholder="Observações sobre este ativo..."
              className={inp + ' resize-none'}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-line sticky bottom-0 bg-bg-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#555] border border-line rounded-xl hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.nome?.trim()}
            className="flex-1 py-2 text-sm font-semibold bg-[#0EA5E9] text-black rounded-xl hover:bg-[#38bdf8] disabled:opacity-40"
          >
            {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Adicionar ativo'}
          </button>
        </div>
      </div>
    </div>
  )
}
