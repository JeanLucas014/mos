import { useState, useRef, type FormEvent } from 'react'
import { Pencil } from 'lucide-react'
import { useGoals } from '../hooks/useGoals'
import { useGoalItems } from '../hooks/useGoalItems'
import type { Database } from '../types/db'
import { HelpButton } from '@/components/help/HelpButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'

type Goal     = Database['public']['Tables']['goals']['Row']
type GoalItem = Database['public']['Tables']['goal_items']['Row']

/* ── Areas ─────────────────────────────────────────────────────── */
const AREAS = ['carreira', 'saúde', 'finanças', 'relações', 'aprendizado', 'esportes', 'pessoal'] as const

const AREA_COLOR: Record<string, string> = {
  carreira:    '#0EA5E9',
  saúde:       '#34d399',
  finanças:    '#fbbf24',
  relações:    '#f87171',
  aprendizado: '#a78bfa',
  esportes:    '#fb923c',
  pessoal:     'var(--text3)',
  geral:       'var(--text2)',
}

function aColor(area?: string | null) { return AREA_COLOR[area ?? 'geral'] ?? 'var(--text2)' }

/* ── Skeleton ──────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="bg-bg-2 border border-line rounded-card p-5 space-y-5 mt-5 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between">
            <div className="h-4 bg-bg-3 rounded w-1/2" />
            <div className="h-4 bg-bg-3 rounded w-12" />
          </div>
          <div className="h-2 bg-bg-3 rounded" />
        </div>
      ))}
    </div>
  )
}

/* ── GoalItemsList ──────────────────────────────────────────────── */
function GoalItemsList({ goalId, onProgressChange }: { goalId: string; onProgressChange?: (p: number) => void }) {
  const { data: items = [], isLoading, addItem, toggleItem, deleteItem, autoProgress } = useGoalItems(goalId)
  const [draft, setDraft] = useState('')
  const [addErr, setAddErr] = useState<string | null>(null)

  // Notify parent of progress changes
  const prevProg = useRef<number | null>(null)
  if (autoProgress !== null && autoProgress !== prevProg.current) {
    prevProg.current = autoProgress
    onProgressChange?.(autoProgress)
  }

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    setAddErr(null)
    addItem.mutate(draft.trim(), {
      onSuccess: () => setDraft(''),
      onError: (err) => setAddErr((err as Error).message ?? 'Erro ao adicionar submeta'),
    })
  }

  return (
    <div className="mt-3 pl-3 border-l-2" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
      <div className="text-ink-3 mb-2" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Submetas {items.length > 0 && `· ${items.filter(i => i.done).length}/${items.length}`}
      </div>
      {isLoading ? (
        <div className="h-8 bg-bg-3 rounded animate-pulse" />
      ) : (
        <div className="space-y-0.5 mb-2">
          {items.map((item: GoalItem) => (
            <div key={item.id} className="group flex items-center gap-2 py-1">
              <button
                onClick={() => toggleItem.mutate({ id: item.id, done: !item.done })}
                className={[
                  'w-4 h-4 rounded-[3px] border flex-shrink-0 flex items-center justify-center transition-colors',
                  item.done ? 'bg-brand border-brand' : 'border-ink-3 hover:border-ink-2',
                ].join(' ')}
                style={{ minWidth: 16 }}
              >
                {item.done && (
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className={['flex-1 text-xs', item.done ? 'line-through text-ink-3' : 'text-ink'].join(' ')}>
                {item.title}
              </span>
              <button
                onClick={() => deleteItem.mutate(item.id)}
                className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-red-400 transition-opacity"
                style={{ fontSize: 12, lineHeight: 1, padding: '0 4px' }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {addErr && (
        <div style={{ fontSize: 10, color: '#f87171', marginBottom: 4 }}>{addErr}</div>
      )}
      <form onSubmit={handleAdd} className="flex gap-1.5">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Nova submeta…"
          className="flex-1 bg-bg border border-line rounded-[6px] px-2 text-ink text-xs placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
          style={{ minHeight: 30 }}
        />
        <button
          type="submit"
          disabled={!draft.trim() || addItem.isPending}
          className="bg-brand text-white rounded-[6px] px-2.5 text-xs font-semibold disabled:opacity-40 flex-shrink-0"
          style={{ minHeight: 30 }}
        >{addItem.isPending ? '…' : '+'}</button>
      </form>
    </div>
  )
}

/* ── GoalRow ───────────────────────────────────────────────────── */
function GoalRow({
  goal,
  onUpdate,
  onDelete,
  onEdit,
}: {
  goal: Goal
  onUpdate: (id: string, fields: Partial<Goal>) => void
  onDelete: (id: string) => void
  onEdit: (goal: Goal) => void
}) {
  const [editLabel, setEditLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState(goal.label ?? '')
  const [expanded, setExpanded] = useState(false)
  const labelRef = useRef<HTMLInputElement>(null)

  function commitLabel() {
    setEditLabel(false)
    const val = labelDraft.trim()
    if (val !== (goal.label ?? '')) onUpdate(goal.id, { label: val || null })
  }

  function openLabel() {
    setLabelDraft(goal.label ?? '')
    setEditLabel(true)
    setTimeout(() => labelRef.current?.select(), 30)
  }

  function handleAutoProgress(p: number) {
    if (p !== (goal.progress ?? 0)) onUpdate(goal.id, { progress: p })
  }

  const pct = Math.max(0, Math.min(100, goal.progress ?? 0))
  const colorPct = pct >= 75 ? '#34d399' : pct >= 40 ? '#0EA5E9' : '#fbbf24'
  const ac = aColor(goal.area)

  return (
    <div className="group py-3.5 border-b border-line last:border-b-0">
      {/* Name row */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Area dot */}
          <span className="flex-shrink-0 w-2 h-2 rounded-full" style={{ background: ac }} />
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-ink font-semibold min-w-0 flex-1 truncate text-left"
            style={{ fontFamily: 'Sora, sans-serif', fontSize: 14 }}
            title="Expandir submetas"
          >
            {goal.name}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Editable label */}
          {editLabel ? (
            <input
              ref={labelRef}
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitLabel()
                if (e.key === 'Escape') { setEditLabel(false); setLabelDraft(goal.label ?? '') }
              }}
              className="bg-bg border border-brand rounded px-2 text-ink focus:outline-none text-right"
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, width: 90, minHeight: 28 }}
              placeholder="ex: 11/24"
            />
          ) : (
            <button
              onClick={openLabel}
              className="text-ink-2 hover:text-ink transition-colors rounded px-1"
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, minHeight: 28 }}
              title="Editar label"
            >
              {goal.label || `${pct}%`}
            </button>
          )}

          {/* Edit */}
          <button
            onClick={() => onEdit(goal)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-3 hover:text-brand w-7 h-7 flex items-center justify-center flex-shrink-0"
            title="Editar meta"
          >
            <Pencil size={13} />
          </button>

          {/* Delete */}
          <button
            onClick={() => { if (window.confirm(`Remover "${goal.name}"?`)) onDelete(goal.id) }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-3 hover:text-red-400 w-7 h-7 flex items-center justify-center text-sm flex-shrink-0"
            title="Remover"
          >
            ×
          </button>
        </div>
      </div>

      {/* Progress bar (visual + interactive range) */}
      <div style={{ position: 'relative', height: 7, background: 'rgba(255,255,255,.07)', borderRadius: 4 }}>
        <div
          style={{ height: '100%', width: `${pct}%`, background: colorPct, borderRadius: 4, transition: 'width .25s' }}
        />
        <input
          type="range" min={0} max={100} value={pct}
          onChange={(e) => onUpdate(goal.id, { progress: parseInt(e.target.value) })}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0 }}
          title={`${pct}%`}
        />
      </div>
      {/* Submetas */}
      {expanded && <GoalItemsList goalId={goal.id} onProgressChange={handleAutoProgress} />}
    </div>
  )
}

/* ── Add/Edit modal ────────────────────────────────────────────── */
function AddModal({
  onAdd,
  onClose,
  isPending,
  initial,
}: {
  onAdd: (name: string, label: string, progress: number, area: string | null) => void
  onClose: () => void
  isPending: boolean
  initial?: { name: string; label: string; progress: number; area: string | null }
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [label, setLabel] = useState(initial?.label ?? '')
  const [progress, setProgress] = useState(initial?.progress ?? 0)
  const [area, setArea] = useState<string>(initial?.area ?? '')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name.trim(), label.trim(), progress, area || null)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.75)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl border border-line p-6" style={{ background: 'var(--bg2)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 18 }}>{initial ? 'Editar meta' : 'Nova meta'}</h2>
          <button onClick={onClose} aria-label="Fechar" className="w-8 h-8 rounded-input flex items-center justify-center text-ink-3 hover:text-ink hover:bg-bg-3 transition-colors text-lg">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Nome *</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Ler 24 livros" autoFocus
              className="w-full bg-bg border border-line rounded-input px-3 text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
              style={{ minHeight: 44 }}
            />
          </div>

          {/* Area */}
          <div>
            <label className="block text-ink-2 mb-2" style={{ fontSize: 12, fontWeight: 600 }}>Área</label>
            <div className="grid grid-cols-3 gap-1.5">
              {AREAS.map(a => {
                const selected = area === a
                const c = aColor(a)
                return (
                  <button
                    key={a} type="button" onClick={() => setArea(selected ? '' : a)}
                    style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: selected ? 600 : 400,
                      background: selected ? c + '18' : 'transparent',
                      border: selected ? `1px solid ${c}50` : '1px solid rgba(255,255,255,.08)',
                      color: selected ? c : 'var(--text2)', cursor: 'pointer', textTransform: 'capitalize',
                    }}
                  >
                    {a}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Label</label>
            <input
              value={label} onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: 11 / 24  |  R$ 71k  |  74%"
              className="w-full bg-bg border border-line rounded-input px-3 text-ink-2 placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
              style={{ minHeight: 44, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-ink-2" style={{ fontSize: 12, fontWeight: 600 }}>Progresso inicial</label>
              <span className="text-ink-2" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{progress}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              className="w-full" style={{ accentColor: '#0EA5E9', cursor: 'pointer' }}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit" disabled={!name.trim() || isPending}
              className="flex-1 bg-brand text-white rounded-input font-semibold text-sm hover:brightness-110 active:scale-[.97] transition-all disabled:opacity-40"
              style={{ minHeight: 44 }}
            >
              {initial ? 'Salvar alterações' : 'Criar meta'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-bg-3 text-ink-2 rounded-input text-sm hover:text-ink transition-colors" style={{ minHeight: 44 }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Page ──────────────────────────────────────────────────────── */
export function GoalsPage() {
  const { data: goals, isLoading, isError, addGoal, updateGoal, deleteGoal } = useGoals()
  const [showModal,    setShowModal]    = useState(false)
  const [editingGoal,  setEditingGoal]  = useState<Goal | null>(null)
  const [areaFilter,   setAreaFilter]   = useState<string>('todas')

  const allGoals = goals ?? []
  const total = allGoals.length

  // All unique areas present in data (plus 'todas' chip)
  const presentAreas = Array.from(new Set(allGoals.map(g => g.area ?? 'geral'))).sort()

  const filtered = areaFilter === 'todas'
    ? allGoals
    : allGoals.filter(g => (g.area ?? 'geral') === areaFilter)

  // Group by area
  const grouped = filtered.reduce<Record<string, Goal[]>>((acc, g) => {
    const a = g.area ?? 'geral'
    ;(acc[a] ??= []).push(g)
    return acc
  }, {})

  const groupKeys = Object.keys(grouped).sort()

  function handleAdd(name: string, label: string, progress: number, area: string | null) {
    addGoal.mutate({ name, label, progress, area }, { onSuccess: () => setShowModal(false) })
  }

  function handleEditSave(name: string, label: string, progress: number, area: string | null) {
    if (!editingGoal) return
    updateGoal.mutate({ id: editingGoal.id, name, label: label || null, progress, area })
    setEditingGoal(null)
  }

  function handleUpdate(id: string, fields: Partial<Goal>) {
    updateGoal.mutate({ id, ...fields })
  }

  function handleDelete(id: string) {
    deleteGoal.mutate(id)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-[30px]" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
              Metas
            </h1>
            <HelpButton pageId="metas" />
          </div>
          <p className="text-ink-2 mt-1 text-sm">
            {isLoading ? 'Carregando...' : `${total} meta${total !== 1 ? 's' : ''} ativa${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-brand text-white rounded-input px-4 font-semibold text-sm hover:brightness-110 active:scale-[.97] transition-all flex-shrink-0"
          style={{ minHeight: 44 }}
        >
          + Meta
        </button>
      </div>

      {/* Area filter chips */}
      {!isLoading && presentAreas.length > 1 && (
        <div className="grid grid-cols-3 gap-1.5 mt-4 mb-2">
          {['todas', ...presentAreas].map(a => {
            const c = a === 'todas' ? '#0EA5E9' : aColor(a)
            const active = areaFilter === a
            return (
              <button
                key={a}
                onClick={() => setAreaFilter(a)}
                style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: 11, fontWeight: active ? 600 : 400,
                  background: active ? (a === 'todas' ? '#0EA5E9' : c + '18') : 'transparent',
                  border: active ? `1px solid ${c}50` : '1px solid rgba(255,255,255,.08)',
                  color: active ? (a === 'todas' ? '#fff' : c) : 'var(--text2)',
                  cursor: 'pointer', textTransform: 'capitalize',
                }}
              >
                {a}
              </button>
            )
          })}
        </div>
      )}

      {isError && (
        <ErrorState message="Não foi possível carregar suas metas. Tente novamente." />
      )}

      {isLoading && <Skeleton />}

      {/* Empty state */}
      {!isLoading && total === 0 && (
        <EmptyState
          icon={
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity={0.35}>
              <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="20" cy="20" r="7" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="20" cy="20" r="1.5" fill="currentColor" />
            </svg>
          }
          title="Nenhuma meta ainda."
          action={{ label: '+ Criar meta', onClick: () => setShowModal(true) }}
        />
      )}

      {/* Goals grouped by area */}
      {!isLoading && filtered.length > 0 && (
        <div className="mt-5 space-y-4">
          {groupKeys.map(areaKey => {
            const goalsInArea = grouped[areaKey]
            const ac = aColor(areaKey)
            return (
              <div key={areaKey} className="bg-bg-2 border border-line rounded-card p-5 lg:p-6">
                {/* Area header (only show if not filtering to single area or multiple areas exist) */}
                {(areaFilter === 'todas' || groupKeys.length > 1) && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ac }} />
                    <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 13, color: ac, textTransform: 'capitalize' }}>
                      {areaKey}
                    </h2>
                    <span className="text-ink-3" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                      {goalsInArea.length}
                    </span>
                  </div>
                )}

                <p className="text-ink-3 mb-3" style={{ fontSize: 11 }}>
                  Clique no nome para expandir submetas · Arraste a barra para ajustar o progresso
                </p>

                <div>
                  {goalsInArea.map((g) => (
                    <GoalRow
                      key={g.id}
                      goal={g}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      onEdit={setEditingGoal}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <AddModal
          onAdd={handleAdd}
          onClose={() => setShowModal(false)}
          isPending={addGoal.isPending}
        />
      )}

      {editingGoal && (
        <AddModal
          onAdd={handleEditSave}
          onClose={() => setEditingGoal(null)}
          isPending={false}
          initial={{
            name:     editingGoal.name,
            label:    editingGoal.label ?? '',
            progress: editingGoal.progress ?? 0,
            area:     editingGoal.area ?? null,
          }}
        />
      )}
    </div>
  )
}
