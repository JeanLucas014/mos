import { useState, type FormEvent } from 'react'
import { useTasks } from '../hooks/useTasks'

const PROJECTS = ['todos', 'corrida', 'nata', 'pessoal', 'jl os'] as const

export function TasksPage() {
  const { data: tasks, isLoading, isError, error, addTask, toggleTask, deleteTask } = useTasks()
  const [title, setTitle] = useState('')
  const [project, setProject] = useState('')
  const [filter, setFilter] = useState<string>('todos')

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    addTask.mutate({ title: trimmed, project: project || null })
    setTitle('')
    setProject('')
  }

  const filtered = (tasks ?? []).filter(
    (t) => filter === 'todos' || t.project === filter,
  )
  const pendingCount = (tasks ?? []).filter((t) => !t.done).length

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
          : `Você tem ${pendingCount} tarefa${pendingCount !== 1 ? 's' : ''} pendente${pendingCount !== 1 ? 's' : ''}.`}
      </p>

      {/* Filter chips */}
      <div className="flex gap-1.5 mt-5 mb-4 flex-wrap">
        {PROJECTS.map((p) => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={[
              'min-h-[36px] px-3 py-1.5 rounded-input text-xs font-medium transition-colors capitalize',
              filter === p
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

      {/* Card */}
      <div className="bg-bg-2 border border-line rounded-card p-4 lg:p-5">
        <h2
          className="mb-4"
          style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15 }}
        >
          Minhas tarefas
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-11 bg-bg-3 rounded-input animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-ink-3 text-sm py-8 text-center">
            Nenhuma tarefa{filter !== 'todos' ? ` em "${filter}"` : ''} — adicione a primeira.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((task) => (
              <li
                key={task.id}
                className="group flex items-center gap-3 px-2 rounded-input hover:bg-bg-3 transition-colors"
                style={{ minHeight: 44 }}
              >
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

                <span
                  className={[
                    'flex-1 text-sm py-2',
                    task.done ? 'line-through text-ink-3' : 'text-ink',
                  ].join(' ')}
                >
                  {task.title}
                </span>

                {task.project && (
                  <span
                    className="text-ink-3 capitalize hidden sm:inline"
                    style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}
                  >
                    {task.project}
                  </span>
                )}

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
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-line">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nova tarefa..."
            className="flex-1 bg-bg border border-line rounded-input px-3 text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-brand transition-colors"
            style={{ minHeight: 44 }}
          />
          <div className="flex gap-2">
            <select
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="flex-1 sm:flex-none bg-bg border border-line rounded-input px-2 text-ink-2 text-xs focus:outline-none focus:border-brand transition-colors"
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, minHeight: 44 }}
            >
              <option value="">projeto</option>
              <option value="corrida">corrida</option>
              <option value="nata">nata</option>
              <option value="pessoal">pessoal</option>
              <option value="jl os">jl os</option>
            </select>
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
