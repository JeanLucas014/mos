import { useState, type FormEvent } from 'react'
import { useTasks } from '../hooks/useTasks'

export function TasksPage() {
  const { data: tasks, isLoading, isError, error, addTask, toggleTask, deleteTask } = useTasks()
  const [title, setTitle] = useState('')
  const [project, setProject] = useState('')
  const [filter, setFilter] = useState<string>('todos')

  // derive project list dynamically from existing tasks
  const projects = Array.from(
    new Set((tasks ?? []).map(t => t.project).filter((p): p is string => !!p)),
  ).sort()

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    addTask.mutate({ title: trimmed, project: project.trim() || null })
    setTitle('')
    setProject('')
  }

  // if current filter no longer exists in data, fall back to 'todos'
  const safeFilter = filter === 'todos' || projects.includes(filter) ? filter : 'todos'

  const filtered = (tasks ?? []).filter(
    t => safeFilter === 'todos' || t.project === safeFilter,
  )
  const pendingCount = (tasks ?? []).filter(t => !t.done).length

  return (
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

      {/* Filter chips — "Todos" + dynamic projects */}
      <div className="flex gap-1.5 mt-5 mb-4 flex-wrap">
        {['todos', ...projects].map(p => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={[
              'min-h-[36px] px-3 py-1.5 rounded-input text-xs font-medium transition-colors capitalize',
              safeFilter === p
                ? 'bg-brand text-white'
                : 'bg-bg-3 text-ink-2 hover:text-ink',
            ].join(' ')}
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
          >
            {p}
          </button>
        ))}
      </div>

      {isError && (
        <p className="text-red-400 text-sm mb-3">Erro: {(error as Error).message}</p>
      )}

      {/* Task list card */}
      <div className="bg-bg-2 border border-line rounded-card p-4 lg:p-5">
        <h2
          className="mb-4"
          style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15 }}
        >
          Minhas tarefas
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-11 bg-bg-3 rounded-input animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-3 text-ink-3">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" opacity={0.4}>
              <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="1.6" />
              <path d="M10 16l4 4 8-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm text-center">
              {safeFilter !== 'todos'
                ? `Nenhuma tarefa em "${safeFilter}".`
                : 'Nenhuma tarefa ainda.'}
            </p>
            {safeFilter !== 'todos' && (
              <button
                onClick={() => setFilter('todos')}
                className="text-brand text-xs font-medium hover:brightness-110 transition-all"
              >
                Ver todas
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map(task => (
              <li
                key={task.id}
                className="group flex items-center gap-3 px-2 rounded-input hover:bg-bg-3 transition-colors"
                style={{ minHeight: 44 }}
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

                {/* Title */}
                <span
                  className={[
                    'flex-1 text-sm py-2',
                    task.done ? 'line-through text-ink-3' : 'text-ink',
                  ].join(' ')}
                >
                  {task.title}
                </span>

                {/* Project tag */}
                {task.project && (
                  <button
                    onClick={() => setFilter(task.project!)}
                    className="text-ink-3 hover:text-ink-2 capitalize hidden sm:inline transition-colors"
                    style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}
                    title={`Filtrar por "${task.project}"`}
                  >
                    {task.project}
                  </button>
                )}

                {/* Delete */}
                <button
                  onClick={() => deleteTask.mutate(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-red-400 transition-all ml-1 text-base flex-shrink-0 w-8 flex items-center justify-center"
                  style={{ minHeight: 44 }}
                  title="Excluir"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add form */}
        <form
          onSubmit={handleAdd}
          className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-line"
        >
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Nova tarefa…"
            className="flex-1 bg-bg border border-line rounded-input px-3 text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
            style={{ minHeight: 44 }}
          />
          <div className="flex gap-2">
            {/* Free-text project input (with datalist suggestions) */}
            <input
              list="project-suggestions"
              value={project}
              onChange={e => setProject(e.target.value)}
              placeholder="projeto (opcional)"
              className="flex-1 sm:w-36 sm:flex-none bg-bg border border-line rounded-input px-3 text-ink-2 text-xs placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, minHeight: 44 }}
            />
            <datalist id="project-suggestions">
              {projects.map(p => <option key={p} value={p} />)}
            </datalist>

            <button
              type="submit"
              disabled={!title.trim() || addTask.isPending}
              className="bg-brand text-white rounded-input px-4 text-sm font-semibold hover:brightness-110 active:scale-[.97] transition-all disabled:opacity-40 whitespace-nowrap"
              style={{ minHeight: 44 }}
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
