import { useState } from 'react'
import { Plus, Settings, TriangleAlert } from 'lucide-react'
import { useOrcamento } from './hooks/useOrcamento'
import { GrupoRow } from './components/GrupoRow'
import { GrupoModal } from './components/GrupoModal'
import { ConfigPanel } from './components/ConfigPanel'
import { BRL } from './utils'
import type { OrcamentoGrupo, OrcamentoGrupoTipo, OrcamentoGrupoModo } from './types'

type GrupoModalState = { mode: 'create'; tipo: OrcamentoGrupoTipo } | { mode: 'edit'; grupo: OrcamentoGrupo } | null

export function OrcamentoTab() {
  const orc = useOrcamento()

  const [grupoModal, setGrupoModal] = useState<GrupoModalState>(null)
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
  const categoriasSemGrupo = orc.categoriasGasto.filter(c => !categoriasVinculadasIds.has(c.id))

  function handleSaveGrupo(fields: { nome: string; tipo: OrcamentoGrupoTipo; modo: OrcamentoGrupoModo; valorPrevistoPadrao: number; categoriasVinculadas: string[] }) {
    if (grupoModal?.mode === 'edit') {
      orc.updateGrupo.mutate({ id: grupoModal.grupo.id, ...fields })
    } else {
      orc.addGrupo.mutate(fields)
    }
    setGrupoModal(null)
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
      {/* Orçamento é um plano único (sem seletor de mês) — só o
          "realizado" dos grupos vinculados a categoria olha pro mês
          corrente automaticamente. */}
      <div className="flex items-center justify-end gap-3 mb-5">
        <button
          onClick={() => setShowConfig(true)}
          className="text-ink-3 hover:text-white transition-colors flex items-center gap-1.5 text-xs border border-line rounded-lg px-3 py-1.5"
        >
          <Settings size={13} /> <span className="hidden sm:inline">Configurar</span>
        </button>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-bg-2 border border-line rounded-xl p-3.5">
          <div className="text-[10px] text-ink-3 uppercase tracking-wider font-[Sora] mb-1.5">Entradas previstas</div>
          <div className="text-base sm:text-lg font-bold tabular-nums text-[#22c55e]">{BRL(orc.entradasPrevistas)}</div>
        </div>
        <div className="bg-bg-2 border border-line rounded-xl p-3.5">
          <button onClick={() => setShowConfig(true)} className="w-full text-left">
            <div className="text-[10px] text-ink-3 uppercase tracking-wider font-[Sora] mb-1.5">
              Investimento
            </div>
            <div className="text-base sm:text-lg font-bold tabular-nums" style={{ color: 'var(--blue)' }}>
              {BRL(orc.guardarMes)}
              {orc.config.meta_guardar_tipo === 'percentual' && (
                <span className="text-ink-3 text-xs font-normal"> ({orc.metaGuardarValor}%)</span>
              )}
            </div>
          </button>
        </div>
        <div className="bg-bg-2 border border-line rounded-xl p-3.5 col-span-2 sm:col-span-1">
          <div className="text-[10px] text-ink-3 uppercase tracking-wider font-[Sora] mb-1.5">Resultado</div>
          <div
            className="text-base sm:text-lg font-bold tabular-nums"
            style={{ color: orc.resultadoMes >= 0 ? '#22c55e' : '#ef4444' }}
          >
            {orc.resultadoMes < 0 ? '−' : ''}R$ {Math.abs(orc.resultadoMes).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
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
          categorias={orc.categoriasGasto}
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
