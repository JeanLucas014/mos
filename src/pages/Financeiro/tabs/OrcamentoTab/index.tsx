import { useState } from 'react'
import { Plus, Settings, TriangleAlert } from 'lucide-react'
import type { FinAno } from '../../types'
import { MS_OPT, MS_FULL } from '../MesTab/utils'
import { useOrcamento } from './hooks/useOrcamento'
import { GrupoRow } from './components/GrupoRow'
import { GrupoModal } from './components/GrupoModal'
import { OverrideModal } from './components/OverrideModal'
import { ConfigPanel } from './components/ConfigPanel'
import { BRL } from './utils'
import type { OrcamentoGrupo, OrcamentoGrupoTipo } from './types'

interface Props { ano: FinAno; initialMonth: number }

type OverrideTarget = { tipo: 'grupo'; grupo: OrcamentoGrupo } | { tipo: 'meta_guardar' }
type GrupoModalState = { mode: 'create'; tipo: OrcamentoGrupoTipo } | { mode: 'edit'; grupo: OrcamentoGrupo } | null

export function OrcamentoTab({ ano, initialMonth }: Props) {
  const [month, setMonth] = useState(initialMonth)
  const orc = useOrcamento(ano, month)

  const [grupoModal, setGrupoModal] = useState<GrupoModalState>(null)
  const [overrideTarget, setOverrideTarget] = useState<OverrideTarget | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  const [avisoDismissed, setAvisoDismissed] = useState(false)

  if (orc.isLoading) return (
    <div className="flex justify-center py-16">
      <div className="w-5 h-5 rounded-full border-2 border-brand border-t-transparent animate-spin" />
    </div>
  )

  const fixos = orc.grupos.filter(g => g.tipo === 'fixo')
  const variaveis = orc.grupos.filter(g => g.tipo === 'variavel')

  const categoriasVinculadasIds = new Set(orc.grupos.flatMap(g => g.categorias_vinculadas))
  const categoriasSemGrupo = orc.categoriasSaida.filter(c => !categoriasVinculadasIds.has(c.id))

  function handleSaveGrupo(fields: { nome: string; tipo: OrcamentoGrupoTipo; valorPrevistoPadrao: number; categoriasVinculadas: string[] }) {
    if (grupoModal?.mode === 'edit') {
      orc.updateGrupo.mutate({ id: grupoModal.grupo.id, ...fields })
    } else {
      orc.addGrupo.mutate(fields)
    }
    setGrupoModal(null)
  }

  function handleSaveOverride(valor: number) {
    if (!overrideTarget) return
    if (overrideTarget.tipo === 'grupo') {
      orc.setOverride.mutate({ tipo: 'grupo', referenciaId: overrideTarget.grupo.id, valor })
    } else {
      orc.setOverride.mutate({ tipo: 'meta_guardar', referenciaId: null, valor })
    }
    setOverrideTarget(null)
  }

  function handleRemoveOverride() {
    if (!overrideTarget) return
    if (overrideTarget.tipo === 'grupo') {
      orc.removeOverride.mutate({ tipo: 'grupo', referenciaId: overrideTarget.grupo.id })
    } else {
      orc.removeOverride.mutate({ tipo: 'meta_guardar', referenciaId: null })
    }
    setOverrideTarget(null)
  }

  function Section({ title, tipo, grupos }: { title: string; tipo: OrcamentoGrupoTipo; grupos: OrcamentoGrupo[] }) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold font-[Sora] text-white">{title}</h2>
          <button
            onClick={() => setGrupoModal({ mode: 'create', tipo })}
            className="flex items-center gap-1 text-xs text-brand hover:brightness-110 transition-colors"
          >
            <Plus size={12} /> Grupo
          </button>
        </div>
        {grupos.length === 0 ? (
          <p className="text-xs text-ink-3">Nenhum grupo {tipo === 'fixo' ? 'fixo' : 'variável'} ainda.</p>
        ) : (
          <div className="space-y-2">
            {grupos.map(g => (
              <GrupoRow
                key={g.id}
                grupo={g}
                previsto={orc.previstoGrupo(g)}
                realizado={orc.realizadoGrupo(g)}
                ajustado={orc.isGrupoAjustado(g.id)}
                onEditValor={() => setOverrideTarget({ tipo: 'grupo', grupo: g })}
                onEditGrupo={() => setGrupoModal({ mode: 'edit', grupo: g })}
                onDelete={() => {
                  if (window.confirm(`Remover o grupo "${g.nome}"?`)) orc.deleteGrupo.mutate(g.id)
                }}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Month selector + config */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="bg-bg-2 border border-line text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-brand/60"
          >
            {MS_OPT.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <span className="text-ink-3 text-sm hidden sm:inline">{MS_FULL[month - 1]} · {ano.ano}</span>
        </div>
        <button
          onClick={() => setShowConfig(true)}
          className="text-ink-3 hover:text-white transition-colors flex items-center gap-1.5 text-xs border border-line rounded-lg px-3 py-1.5"
        >
          <Settings size={13} /> <span className="hidden sm:inline">Configurar</span>
        </button>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-bg-2 border border-line rounded-xl p-3.5">
          <div className="text-[10px] text-ink-3 uppercase tracking-wider font-[Sora] mb-1.5">Entradas previstas</div>
          <div className="text-base sm:text-lg font-bold tabular-nums text-[#22c55e]">{BRL(orc.entradasPrevistas)}</div>
        </div>
        <div className="bg-bg-2 border border-line rounded-xl p-3.5">
          <button onClick={() => setOverrideTarget({ tipo: 'meta_guardar' })} className="w-full text-left">
            <div className="text-[10px] text-ink-3 uppercase tracking-wider font-[Sora] mb-1.5">
              Guardar este mês{orc.isMetaGuardarAjustada ? ' ·' : ''}
            </div>
            <div className="text-base sm:text-lg font-bold tabular-nums" style={{ color: 'var(--blue)' }}>
              {BRL(orc.guardarMes)}
              {orc.config.meta_guardar_tipo === 'percentual' && (
                <span className="text-ink-3 text-xs font-normal"> ({orc.metaGuardarValor}%)</span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Aviso de categorias não vinculadas */}
      {!avisoDismissed && categoriasSemGrupo.length > 0 && (
        <div className="flex items-start gap-2 bg-bg-2 border border-line rounded-lg px-3 py-2.5 mb-5">
          <TriangleAlert size={13} className="text-[#f59e0b] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-ink-3 flex-1">
            {categoriasSemGrupo.length} categoria{categoriasSemGrupo.length !== 1 ? 's' : ''} de saída sem grupo de
            orçamento vinculado ({categoriasSemGrupo.map(c => c.nome).join(', ')}) — os lançamentos nelas não entram
            em nenhum "realizado".
          </p>
          <button onClick={() => setAvisoDismissed(true)} className="text-ink-3 hover:text-white text-xs flex-shrink-0">
            Dispensar
          </button>
        </div>
      )}

      <Section title="Fixos" tipo="fixo" grupos={fixos} />
      <Section title="Variáveis" tipo="variavel" grupos={variaveis} />

      {grupoModal && (
        <GrupoModal
          grupo={grupoModal.mode === 'edit' ? grupoModal.grupo : null}
          initialTipo={grupoModal.mode === 'create' ? grupoModal.tipo : undefined}
          categorias={orc.categoriasSaida}
          onSave={handleSaveGrupo}
          onDelete={grupoModal.mode === 'edit' ? () => {
            if (window.confirm(`Remover o grupo "${grupoModal.grupo.nome}"?`)) {
              orc.deleteGrupo.mutate(grupoModal.grupo.id)
              setGrupoModal(null)
            }
          } : undefined}
          onClose={() => setGrupoModal(null)}
        />
      )}

      {overrideTarget && (
        <OverrideModal
          title={overrideTarget.tipo === 'grupo' ? `Ajustar "${overrideTarget.grupo.nome}" — ${MS_FULL[month - 1]}` : `Ajustar meta de guardar — ${MS_FULL[month - 1]}`}
          currentValue={overrideTarget.tipo === 'grupo' ? orc.previstoGrupo(overrideTarget.grupo) : orc.metaGuardarValor}
          isAjustado={overrideTarget.tipo === 'grupo' ? orc.isGrupoAjustado(overrideTarget.grupo.id) : orc.isMetaGuardarAjustada}
          onSave={handleSaveOverride}
          onRemoveOverride={handleRemoveOverride}
          onClose={() => setOverrideTarget(null)}
        />
      )}

      {showConfig && (
        <ConfigPanel
          entradas={orc.entradas}
          metaGuardarTipo={orc.config.meta_guardar_tipo}
          metaGuardarValor={Number(orc.config.meta_guardar_valor)}
          onAddEntrada={(nome, valor) => orc.addEntrada.mutate({ nome, valorPrevistoPadrao: valor })}
          onUpdateEntrada={(id, nome, valor) => orc.updateEntrada.mutate({ id, nome, valorPrevistoPadrao: valor })}
          onDeleteEntrada={id => orc.deleteEntrada.mutate(id)}
          onSaveMeta={(tipo, valor) => orc.saveConfig.mutate({ tipo, valor })}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  )
}
