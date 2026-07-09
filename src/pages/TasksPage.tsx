import { useState, type FormEvent } from 'react'
import { Flag } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import type { Database } from '../types/db'

type Task = Database['public']['Tables']['tasks']['Row']

/* ── Priority config ────────────────────────────────────────────── */
const PRIO_CFG: Record<string, { label: string; color: string; bg: string }> = {
  alta:  { label: 'Alta',  color: '#f87171', bg: 'rgba(248,113,113,.12)' },
  media: { label: 'Média', color: '#fbbf24', bg: 'rgba(251,191,36,.12)'  },
  baixa: { label: 'Baixa', color: '#71717a', bg: 'rgba(113,113,122,.12)' },
}
const PRIORITIES = ['alta', 'media', 'baixa'] as const

function pCfg(p?: string | null) { return PRIO_CFG[p ?? 'media'] ?? PRIO_CFG.media }

/* ── Date helpers ─────────────────────────────────────────────── */
function todayStr() { return new Date().toISOString().slice(0, 10) }
function tomorrowStr() {
  const d = new Date(); d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function dueDateDisplay(due: string | null): { label: string; color: string } | null {
  if (!due) return null
  const today = todayStr()
  if (due < today) return { label: fmtDate(due), color: '#f87171' }
  if (due === today) return { label: 'Hoje', color: '#fbbf24' }
  if (due === tomorrowStr()) return { label: 'Amanhã', color: '#34d399' }
  return { label: fmtDate(due), color: '#71717a' }
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y.slice(2)}`
}

/* ── Add/Edit Modal ──────────────────────────────────────────────── */
function TaskModal({
  initial,
  onSave,
  onClose,
  isPending,
  projects,
}: {
  initial?: Task | null
  onSave: (data: { title: string; project: string | null; priority: string; due_date: string | null }) => void
  onClose: () => void
  isPending: boolean
  projects: string[]
}) {
  const [title,   setTitle]   = useState(initial?.title ?? '')
  const [project, setProject] = useState(initial?.project ?? '')
  const [priority, setPriority] = useState(initial?.priority ?? 'media')
  const [dueDate,  setDueDate]  = useState(initial?.due_date ?? '')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onSave({ title: title.trim(), project: project.trim() || null, priority, due_date: dueDate || null })
  }

  const inputCls = 'w-full bg-bg border border-line rounded-input px-3 text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors'
  const inputH = { minHeight: 44 }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.8)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl border border-line p-6 space-y-4" style={{ background: 'var(--bg2)' }}>
        <div className="flex items-center justify-between">
          <h3 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 800, fontSize: 17 }}>
            {initial ? 'Editar tarefa' : 'Nova tarefa'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-ink-3 hover:text-ink rounded-input hover:bg-bg-3 transition-colors text-lg">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Título *</label>
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Implementar login" className={inputCls} style={inputH} />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Prioridade</label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => {
                const cfg = pCfg(p)
                return (
                  <button
                    key={p} type="button"
                    onClick={() => setPriority(p)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      background: priority === p ? cfg.bg : 'transparent',
                      border: priority === p ? `1px solid ${cfg.color}50` : '1px solid rgba(255,255,255,.08)',
                      color: priority === p ? cfg.color : '#888',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    }}
                  >
                    <Flag size={12} /> {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Prazo (opcional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className={inputCls}
              style={{ ...inputH, colorScheme: 'dark' }}
            />
          </div>

          {/* Project */}
          <div>
            <label className="block text-ink-2 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>Projeto (opcional)</label>
            <input
              list="modal-project-suggestions"
              value={project}
              onChange={e => setProject(e.target.value)}
              placeholder="pessoal, trabalho…"
              className={inputCls}
              style={{ ...inputH, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
            />
            <datalist id="modal-project-suggestions">
              {projects.map(p => <option key={p} value={p} />)}
            </datalist>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={!title.trim() || isPending}
              className="flex-1 bg-brand text-white rounded-input font-semibold text-sm hover:brightness-110 disabled:opacity-40 transition-all"
              style={inputH}
            >
              {initial ? 'Salvar' : 'Adicionar'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-bg-3 text-ink-2 rounded-input text-sm hover:text-ink transition-colors" style={inputH}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────────── */
export function TasksPage() {
  const { data: tasks, isLoading, isError, error, addTask, toggleTask, updateTask, deleteTask } = useTasks()
  const [filter, setFilter] = useState<string>('todos')
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)

  const allTasks = tasks ?? []
  const projects = Array.from(new Set(allTasks.map(t => t.project).filter((p): p is string => !!p))).sort()

  const safeFilter = filter === 'todos' || projects.includes(filter) ? filter : 'todos'
  const filtered = allTasks.filter(t => safeFilter === 'todos' || t.project === safeFilter)
  const pendingCount = allTasks.filter(t => !t.done).length

  function handleAdd(data: { title: string; project: string | null; priority: string; due_date: string | null }) {
    addTask.mutate(data, { onSuccess: () => setShowModal(false) })
  }

  function handleEdit(data: { title: string; project: string | null; priority: string; due_date: string | null }) {
    if (!editTask) return
    updateTask.mutate({ id: editTask.id, ...data }, { onSuccess: () => setEditTask(null) })
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl lg:text-[30px]"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}
          >
            Tarefas & To-do
          </h1>
          <p className="text-ink-2 mt-1 text-sm">
            {isLoading
              ? 'Carregando...'
              : `${pendingCount} tarefa${pendingCount !== 1 ? 's' : ''} pendente${pendingCount !== 1 ? 's' : ''}.`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-brand text-white rounded-input px-4 font-semibold text-sm hover:brightness-110 active:scale-[.97] transition-all flex-shrink-0"
          style={{ minHeight: 44 }}
        >
          + Tarefa
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 mt-5 mb-4 flex-wrap">
        {['todos', ...projects].map(p => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={[
              'min-h-[36px] px-3 py-1.5 rounded-input text-xs font-medium transition-colors capitalize',
              safeFilter === p ? 'bg-brand text-white' : 'bg-bg-3 text-ink-2 hover:text-ink',
            ].join(' ')}
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
          >
            {p}
          </button>
        ))}
      </div>

      {isError && <p className="text-red-400 text-sm mb-3">Erro: {(error as Error).message}</p>}

      {/* Task list */}
      <div className="bg-bg-2 border border-line rounded-card p-4 lg:p-5">
        <h2 className="mb-4" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15 }}>
          Minhas tarefas
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-11 bg-bg-3 rounded-input animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-3 text-ink-3">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" opacity={0.4}>
              <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="1.6" />
              <path d="M10 16l4 4 8-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm text-center">
              {safeFilter !== 'todos' ? `Nenhuma tarefa em "${safeFilter}".` : 'Nenhuma tarefa ainda.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map(task => {
              const pc = pCfg(task.priority)
              const due = dueDateDisplay(task.due_date)
              return (
                <li
                  key={task.id}
                  className="group flex items-center gap-2.5 px-2 rounded-input hover:bg-bg-3 transition-colors"
                  style={{ minHeight: 46 }}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTask.mutate({ id: task.id, done: !task.done })}
                    className={[
                      'w-[20px] h-[20px] rounded-[5px] border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors',
                      task.done ? 'bg-brand border-brand' : 'border-ink-3 hover:border-ink-2',
                    ].join(' ')}
                    style={{ minWidth: 20 }}
                  >
                    {task.done && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  {/* Priority flag */}
                  <Flag size={12} style={{ color: pc.color, flexShrink: 0 }} />

                  {/* Title */}
                  <span
                    className={['flex-1 text-sm py-2 min-w-0', task.done ? 'line-through text-ink-3' : 'text-ink'].join(' ')}
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {task.title}
                  </span>

                  {/* Due date badge */}
                  {due && !task.done && (
                    <span
                      className="flex-shrink-0 hidden sm:inline"
                      style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                        color: due.color, padding: '2px 6px', borderRadius: 6,
                        background: due.color + '15',
                      }}
                    >
                      {due.label}
                    </span>
                  )}

                  {/* Project tag */}
                  {task.project && (
                    <button
                      onClick={() => setFilter(task.project!)}
                      className="text-ink-2 hover:text-brand capitalize hidden sm:inline transition-colors"
                      style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}
                    >
                      {task.project}
                    </button>
                  )}

                  {/* Edit button */}
                  <button
                    onClick={() => setEditTask(task)}
                    className="text-ink-2 hover:text-brand transition-colors w-7 flex items-center justify-center"
                    style={{ minHeight: 44, fontSize: 12 }}
                    title="Editar"
                  >
                    ✎
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteTask.mutate(task.id)}
                    className="text-ink-2 hover:text-red-400 transition-colors w-7 flex items-center justify-center text-base flex-shrink-0"
                    style={{ minHeight: 44 }}
                    title="Excluir"
                  >
                    ×
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {/* Quick-add row */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full mt-4 pt-4 border-t border-line flex items-center gap-2 text-ink-3 hover:text-ink-2 transition-colors text-sm"
          style={{ minHeight: 44 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Nova tarefa
        </button>
      </div>

      {showModal && (
        <TaskModal
          onSave={handleAdd}
          onClose={() => setShowModal(false)}
          isPending={addTask.isPending}
          projects={projects}
        />
      )}
      {editTask && (
        <TaskModal
          initial={editTask}
          onSave={handleEdit}
          onClose={() => setEditTask(null)}
          isPending={updateTask.isPending}
          projects={projects}
        />
      )}
    </div>
  )
}
