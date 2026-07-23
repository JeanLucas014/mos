import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { GraduationCap, Pencil, Check, X, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import type { Database } from '@/types/db'
import { Pill } from '@/pages/StudiesPage'
import { useEstudosMarcos } from '../hooks/useEstudosMarcos'

type Study = Database['public']['Tables']['studies']['Row']
type StudyStatus = 'ativo' | 'no prazo' | 'concluido'

interface Props {
  study: Study
  onRename: (nome: string) => void
  onStatusChange: (status: StudyStatus) => void
  onManualProgressChange: (v: number) => void
}

export function CourseCard({ study, onRename, onStatusChange, onManualProgressChange }: Props) {
  const { data: marcosData, isLoading: marcosLoading, addMarco, toggleMarco, deleteMarco } = useEstudosMarcos(study.id)
  const marcos = marcosData ?? []
  const hasMarcos = marcos.length > 0
  const concluidos = marcos.filter((m) => m.concluido).length
  // Com marcos cadastrados, o progresso é sempre automático (concluídos/total).
  // Sem marcos, mantém o comportamento manual de antes (slider arrastável).
  const progresso = hasMarcos ? Math.round((concluidos / marcos.length) * 100) : (study.progress ?? 0)

  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(study.name)
  const [expanded, setExpanded] = useState(true)
  const [addingMarco, setAddingMarco] = useState(false)
  const [marcoDraft, setMarcoDraft] = useState('')

  function saveName() {
    const v = nameDraft.trim()
    if (v && v !== study.name) onRename(v)
    setEditingName(false)
  }

  function handleNameKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') saveName()
    if (e.key === 'Escape') { setNameDraft(study.name); setEditingName(false) }
  }

  function submitMarco(e?: FormEvent) {
    e?.preventDefault()
    const v = marcoDraft.trim()
    if (!v) return
    addMarco.mutate(v)
    setMarcoDraft('')
  }

  return (
    <div className="bg-bg-2 border border-line rounded-card p-4 mb-4">
      {/* Nome + status */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className="flex-shrink-0 rounded-lg flex items-center justify-center text-brand"
            style={{ width: 34, height: 34, background: 'rgba(14,165,233,.12)' }}
          >
            <GraduationCap size={16} />
          </div>
          {editingName ? (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={handleNameKey}
                onBlur={saveName}
                className="flex-1 min-w-0 bg-bg border border-line rounded-input px-2 text-ink text-sm outline-none focus:border-brand/60"
                style={{ height: 32, fontFamily: 'Sora, sans-serif', fontWeight: 700 }}
              />
              <button onMouseDown={(e) => e.preventDefault()} onClick={saveName} className="text-brand p-1 flex-shrink-0">
                <Check size={15} />
              </button>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setNameDraft(study.name); setEditingName(false) }}
                className="text-ink-3 p-1 flex-shrink-0"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="truncate" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15 }}>
                {study.name}
              </span>
              <button
                onClick={() => { setNameDraft(study.name); setEditingName(true) }}
                className="text-ink-3 hover:text-white p-1 flex-shrink-0"
                title="Renomear curso"
              >
                <Pencil size={12} />
              </button>
            </div>
          )}
        </div>
        <Pill status={study.status ?? 'ativo'} />
      </div>

      {/* Progresso */}
      <div className="space-y-0.5 mb-1">
        <div style={{ position: 'relative', height: 5, background: 'rgba(255,255,255,.07)', borderRadius: 3, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%', width: `${progresso}%`,
              background: study.status === 'concluido' ? '#34d399' : 'var(--blue)',
              borderRadius: 3, transition: 'width .3s',
            }}
          />
          {!hasMarcos && (
            <input
              type="range"
              min={0}
              max={100}
              value={progresso}
              onChange={(e) => onManualProgressChange(parseInt(e.target.value))}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0, padding: 0 }}
            />
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-3" style={{ fontSize: 10 }}>
            {hasMarcos ? `${concluidos} de ${marcos.length} marcos concluídos` : ''}
          </span>
          <span style={{ fontSize: 9, color: 'var(--blue)', fontFamily: 'JetBrains Mono, monospace' }}>{progresso}%</span>
        </div>
      </div>

      <div className="flex justify-end mb-3">
        <select
          value={study.status ?? 'ativo'}
          onChange={(e) => onStatusChange(e.target.value as StudyStatus)}
          className="text-ink-2 text-xs rounded-input bg-bg border border-line focus:outline-none focus:border-brand"
          style={{ padding: '3px 6px', fontFamily: 'Manrope, sans-serif' }}
        >
          <option value="ativo">Ativo</option>
          <option value="no prazo">No prazo</option>
          <option value="concluido">Concluído</option>
        </select>
      </div>

      {/* Marcos */}
      <div className="border-t border-line pt-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center justify-between w-full text-ink-2 hover:text-white transition-colors"
        >
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 12 }}>Marcos do curso</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expanded && (
          <div className="mt-2 space-y-1">
            {marcosLoading ? (
              <p className="text-ink-3 text-xs py-2">Carregando…</p>
            ) : marcos.length === 0 ? (
              <p className="text-ink-3 text-xs py-1">Nenhum marco ainda.</p>
            ) : (
              marcos.map((m) => (
                <div key={m.id} className="group flex items-center gap-2 py-1">
                  <button
                    onClick={() => toggleMarco.mutate({ id: m.id, concluido: !m.concluido })}
                    className={[
                      'w-4 h-4 rounded border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors',
                      m.concluido ? 'bg-brand border-brand' : 'border-ink-3 hover:border-ink-2',
                    ].join(' ')}
                  >
                    {m.concluido && <Check size={10} color="#fff" />}
                  </button>
                  <span className={['flex-1 text-sm truncate', m.concluido ? 'line-through text-ink-3' : 'text-ink'].join(' ')}>
                    {m.nome}
                  </span>
                  <button
                    onClick={() => deleteMarco.mutate(m.id)}
                    className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-red-400 transition-opacity p-1 flex-shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}

            {addingMarco ? (
              <form onSubmit={submitMarco} className="flex items-center gap-1.5 mt-1.5">
                <input
                  autoFocus
                  value={marcoDraft}
                  onChange={(e) => setMarcoDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') { setAddingMarco(false); setMarcoDraft('') } }}
                  onBlur={() => { if (!marcoDraft.trim()) setAddingMarco(false) }}
                  placeholder="Nome do marco…"
                  className="flex-1 bg-bg border border-line rounded-input px-2 text-ink text-sm outline-none focus:border-brand/60"
                  style={{ height: 32 }}
                />
                <button
                  type="submit"
                  disabled={!marcoDraft.trim() || addMarco.isPending}
                  className="text-brand text-xs font-semibold px-2 disabled:opacity-40"
                >
                  Adicionar
                </button>
              </form>
            ) : (
              <button
                onClick={() => setAddingMarco(true)}
                className="flex items-center gap-1.5 text-xs text-brand hover:brightness-110 transition-colors mt-1.5"
              >
                <Plus size={12} /> Adicionar marco
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
