import { useState, useRef, type FormEvent } from 'react'
import { useGoals } from '../hooks/useGoals'
import type { Database } from '../types/db'

type Goal = Database['public']['Tables']['goals']['Row']

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

/* ── GoalRow ───────────────────────────────────────────────────── */
function GoalRow({
  goal,
  onUpdate,
  onDelete,
}: {
  goal: Goal
  onUpdate: (id: string, fields: Partial<Goal>) => void
  onDelete: (id: string) => void
}) {
  const [editLabel, setEditLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState(goal.label ?? '')
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

  const pct = Math.max(0, Math.min(100, goal.progress ?? 0))
  const colorPct = pct >= 75 ? '#34d399' : pct >= 40 ? '#0EA5E9' : '#fbbf24'

  return (
    <div className="group py-4 border-b border-line last:border-b-0">
      {/* Name row */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <span
          className="text-ink font-semibold min-w-0 flex-1 truncate"
          style={{ fontFamily: 'Sora, sans-serif', fontSize: 14 }}
        >
          {goal.name}
        </span>

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
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                width: 90,
                minHeight: 28,
              }}
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
          style={{
            height: '100%',
            width: `${pct}%`,
            background: colorPct,
            borderRadius: 4,
            transition: 'width .25s',
          }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={pct}
          onChange={(e) => onUpdate(goal.id, { progress: parseInt(e.target.value) })}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            opacity: 0, cursor: 'pointer', margin: 0,
          }}
          title={`${pct}%`}
        />
      </div>

      {/* Percentage label */}
      <div
        className="text-right mt-1"
        style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: colorPct }}
      >
        {pct}%
      </div>
    </div>
  )
}

/* ── Add modal ─────────────────────────────────────────────────── */
function AddModal({
  onAdd,
  onClose,
  isPending,
}: {
  onAdd: (name: string, label: string, progress: number) => void
  onClose: () => void
  isPending: boolean
}) {
  const [name, setName] = useState('')
  const [label, setLabel] = useState('')
  const [progress, setProgress] = useState(0)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name.trim(), label.trim(), progress)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.75)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-line p-6"
        style={{ background: '#111111' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 18 }}>
            Nova meta
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-input flex items-center justify-center text-ink-3 hover:text-ink hover:bg-bg-3 transition-colors text-lg"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>
              Nome *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Ler 24 livros"
              autoFocus
              className="w-full bg-bg border border-line rounded-input px-3 text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
              style={{ minHeight: 44 }}
            />
          </div>

          <div>
            <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>
              Label
            </label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: 11 / 24  |  R$ 71k  |  74%"
              className="w-full bg-bg border border-line rounded-input px-3 text-ink-2 placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
              style={{
                minHeight: 44,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
              }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-ink-2" style={{ fontSize: 12, fontWeight: 600 }}>
                Progresso inicial
              </label>
              <span
                className="text-ink-2"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
              >
                {progress}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              className="w-full"
              style={{ accentColor: '#0EA5E9', cursor: 'pointer' }}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={!name.trim() || isPending}
              className="flex-1 bg-brand text-white rounded-input font-semibold text-sm hover:brightness-110 active:scale-[.97] transition-all disabled:opacity-40"
              style={{ minHeight: 44 }}
            >
              Criar meta
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-bg-3 text-ink-2 rounded-input text-sm hover:text-ink transition-colors"
              style={{ minHeight: 44 }}
            >
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
  const { data: goals, isLoading, isError, error, addGoal, updateGoal, deleteGoal } = useGoals()
  const [showModal, setShowModal] = useState(false)

  const total = (goals ?? []).length

  function handleAdd(name: string, label: string, progress: number) {
    addGoal.mutate({ name, label, progress }, { onSuccess: () => setShowModal(false) })
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
          <h1
            className="text-2xl lg:text-[30px]"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}
          >
            Metas
          </h1>
          <p className="text-ink-2 mt-1 text-sm">
            {isLoading
              ? 'Carregando...'
              : `${total} meta${total !== 1 ? 's' : ''} ativa${total !== 1 ? 's' : ''}`}
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

      {isError && (
        <p className="text-red-400 text-sm mt-3">Erro: {(error as Error).message}</p>
      )}

      {isLoading && <Skeleton />}

      {/* Empty state */}
      {!isLoading && total === 0 && (
        <div className="mt-10 flex flex-col items-center gap-3 text-ink-3 py-10">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity={0.35}>
            <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="20" cy="20" r="7" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="20" cy="20" r="1.5" fill="currentColor" />
          </svg>
          <p className="text-sm text-center">Nenhuma meta ainda.</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-brand text-sm font-medium hover:brightness-110 transition-all"
          >
            + Criar meta
          </button>
        </div>
      )}

      {/* Goals card */}
      {!isLoading && total > 0 && (
        <div className="bg-bg-2 border border-line rounded-card p-5 lg:p-6 mt-5">
          <h2
            className="mb-1"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15 }}
          >
            Minhas metas
          </h2>
          <p className="text-ink-3 mb-4" style={{ fontSize: 11 }}>
            Clique no valor à direita para editar o label · Arraste a barra para ajustar o progresso
          </p>

          <div>
            {(goals ?? []).map((g) => (
              <GoalRow
                key={g.id}
                goal={g}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <AddModal
          onAdd={handleAdd}
          onClose={() => setShowModal(false)}
          isPending={addGoal.isPending}
        />
      )}
    </div>
  )
}
