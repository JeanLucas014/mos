import { useState, type FormEvent } from 'react'
import { useProjects } from '../hooks/useProjects'
import type { Database } from '../types/db'

type Project = Database['public']['Tables']['projects']['Row']

/* ── Status config ─────────────────────────────────────────────── */
const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  'em dev':  { label: 'Em dev',  color: '#0EA5E9', bg: 'rgba(14,165,233,.14)' },
  'início':  { label: 'Início',  color: '#fbbf24', bg: 'rgba(251,191,36,.12)' },
  'ativo':   { label: 'Ativo',   color: '#34d399', bg: 'rgba(52,211,153,.12)' },
  'live':    { label: 'Live',    color: '#059669', bg: 'rgba(5,150,105,.12)'  },
  'pausado': { label: 'Pausado', color: '#888',    bg: 'rgba(255,255,255,.06)' },
}
const STATUS_KEYS = Object.keys(STATUS_CFG)

function statusCfg(s: string) {
  return STATUS_CFG[s] ?? STATUS_CFG['ativo']
}

/* ── Pill ──────────────────────────────────────────────────────── */
function Pill({ status }: { status: string }) {
  const c = statusCfg(status)
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 9px',
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 700,
        color: c.color,
        background: c.bg,
        fontFamily: 'Manrope, sans-serif',
        whiteSpace: 'nowrap',
      }}
    >
      {c.label}
    </span>
  )
}

/* ── Skeleton ──────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-bg-2 border border-line rounded-card p-5 space-y-3 animate-pulse">
          <div className="flex justify-between">
            <div className="h-5 bg-bg-3 rounded w-2/3" />
            <div className="h-5 bg-bg-3 rounded w-16" />
          </div>
          <div className="h-3 bg-bg-3 rounded w-1/2" />
          <div className="h-2 bg-bg-3 rounded" />
        </div>
      ))}
    </div>
  )
}

/* ── ProjectCard ───────────────────────────────────────────────── */
function ProjectCard({
  project,
  onUpdate,
  onDelete,
}: {
  project: Project
  onUpdate: (id: string, fields: Partial<Project>) => void
  onDelete: (id: string) => void
}) {
  const [editStatus, setEditStatus] = useState(false)

  return (
    <div className="group bg-bg-2 border border-line rounded-card p-5 hover:border-white/10 transition-colors flex flex-col gap-3">
      {/* Top row: name + pill + delete */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div
            className="text-ink font-bold truncate"
            style={{ fontFamily: 'Sora, sans-serif', fontSize: 15 }}
          >
            {project.name}
          </div>
          {project.meta && (
            <div
              className="text-ink-2 truncate mt-0.5"
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}
            >
              {project.meta}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Status — click pill to open select */}
          {editStatus ? (
            <select
              autoFocus
              value={project.status}
              onChange={(e) => {
                onUpdate(project.id, { status: e.target.value })
                setEditStatus(false)
              }}
              onBlur={() => setEditStatus(false)}
              className="bg-bg border border-brand rounded-input text-ink text-xs focus:outline-none"
              style={{ padding: '3px 6px', fontFamily: 'Manrope, sans-serif', minHeight: 28 }}
            >
              {STATUS_KEYS.map((k) => (
                <option key={k} value={k}>{STATUS_CFG[k].label}</option>
              ))}
            </select>
          ) : (
            <button onClick={() => setEditStatus(true)} title="Editar status">
              <Pill status={project.status} />
            </button>
          )}

          <button
            onClick={() => {
              if (window.confirm(`Remover "${project.name}"?`)) onDelete(project.id)
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-3 hover:text-red-400 w-8 h-8 flex items-center justify-center text-base"
            title="Remover"
          >
            ×
          </button>
        </div>
      </div>

      {/* Progress (only for active/non-delivered) */}
      {!project.delivered && (
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-ink-3" style={{ fontSize: 10 }}>Progresso</span>
            <span
              className="text-ink-2"
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}
            >
              {project.progress}%
            </span>
          </div>
          {/* Visual bar + draggable range overlay */}
          <div style={{ position: 'relative', height: 6, background: 'rgba(255,255,255,.07)', borderRadius: 4 }}>
            <div
              style={{
                height: '100%',
                width: `${project.progress}%`,
                background: statusCfg(project.status).color,
                borderRadius: 4,
                transition: 'width .2s',
              }}
            />
            <input
              type="range"
              min={0}
              max={100}
              value={project.progress}
              onChange={(e) => onUpdate(project.id, { progress: parseInt(e.target.value) })}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                opacity: 0, cursor: 'pointer', margin: 0,
              }}
            />
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center gap-4 mt-auto pt-1">
        {!project.delivered ? (
          <button
            onClick={() => onUpdate(project.id, { delivered: true, status: 'live' })}
            className="text-ink-3 hover:text-ok transition-colors text-xs flex items-center gap-1"
            style={{ fontSize: 11 }}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
              <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Marcar entregue
          </button>
        ) : (
          <button
            onClick={() => onUpdate(project.id, { delivered: false, status: 'ativo' })}
            className="text-ink-3 hover:text-ink transition-colors"
            style={{ fontSize: 11 }}
          >
            ↩ Reabrir
          </button>
        )}
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
  onAdd: (name: string, meta: string, status: string) => void
  onClose: () => void
  isPending: boolean
}) {
  const [name, setName] = useState('')
  const [meta, setMeta] = useState('')
  const [status, setStatus] = useState('em dev')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name.trim(), meta.trim(), status)
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
            Novo projeto
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
              placeholder="Ex: Super Kart — Reservas v2"
              autoFocus
              className="w-full bg-bg border border-line rounded-input px-3 text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
              style={{ minHeight: 44 }}
            />
          </div>

          <div>
            <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>
              Meta
            </label>
            <input
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              placeholder="Ex: cliente · entrega 04 jun"
              className="w-full bg-bg border border-line rounded-input px-3 text-ink-2 placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
              style={{
                minHeight: 44,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
              }}
            />
          </div>

          <div>
            <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-bg border border-line rounded-input px-3 text-ink text-sm focus:outline-none focus:border-brand transition-colors"
              style={{ minHeight: 44 }}
            >
              {STATUS_KEYS.map((k) => (
                <option key={k} value={k}>{STATUS_CFG[k].label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={!name.trim() || isPending}
              className="flex-1 bg-brand text-white rounded-input font-semibold text-sm hover:brightness-110 active:scale-[.97] transition-all disabled:opacity-40"
              style={{ minHeight: 44 }}
            >
              Criar projeto
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
export function ProjectsPage() {
  const { data: projects, isLoading, isError, error, addProject, updateProject, deleteProject } =
    useProjects()
  const [showModal, setShowModal] = useState(false)

  const active    = (projects ?? []).filter((p) => !p.delivered)
  const delivered = (projects ?? []).filter((p) => p.delivered)

  function handleAdd(name: string, meta: string, status: string) {
    addProject.mutate({ name, meta, status }, { onSuccess: () => setShowModal(false) })
  }

  function handleUpdate(id: string, fields: Partial<Project>) {
    updateProject.mutate({ id, ...fields })
  }

  function handleDelete(id: string) {
    deleteProject.mutate(id)
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
            Projetos
          </h1>
          <p className="text-ink-2 mt-1 text-sm">
            {isLoading
              ? 'Carregando...'
              : `${active.length} em andamento · ${delivered.length} entregue${delivered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-brand text-white rounded-input px-4 font-semibold text-sm hover:brightness-110 active:scale-[.97] transition-all flex-shrink-0"
          style={{ minHeight: 44 }}
        >
          + Projeto
        </button>
      </div>

      {isError && (
        <p className="text-red-400 text-sm mt-3">Erro: {(error as Error).message}</p>
      )}

      {isLoading && <Skeleton />}

      {/* Empty state */}
      {!isLoading && (projects ?? []).length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-3 text-ink-3 py-10">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity={0.35}>
            <path d="M6 10C6 8.3 7.3 7 9 7H16L19 10H31C32.7 10 34 11.3 34 13V30C34 31.7 32.7 33 31 33H9C7.3 33 6 31.7 6 30V10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          <p className="text-sm text-center">Nenhum projeto ainda.</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-brand text-sm font-medium hover:brightness-110 transition-all"
          >
            + Criar projeto
          </button>
        </div>
      )}

      {/* Em andamento */}
      {!isLoading && active.length > 0 && (
        <div className="mt-6">
          <h2
            className="flex items-center gap-2 mb-3"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14 }}
          >
            Em andamento
            <span className="text-ink-3" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 400 }}>
              {active.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {active.map((p) => (
              <ProjectCard key={p.id} project={p} onUpdate={handleUpdate} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {/* Entregues */}
      {!isLoading && delivered.length > 0 && (
        <div className="mt-8">
          <h2
            className="flex items-center gap-2 mb-3"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14 }}
          >
            Entregues
            <span className="text-ink-3" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 400 }}>
              {delivered.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {delivered.map((p) => (
              <ProjectCard key={p.id} project={p} onUpdate={handleUpdate} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <AddModal
          onAdd={handleAdd}
          onClose={() => setShowModal(false)}
          isPending={addProject.isPending}
        />
      )}
    </div>
  )
}
