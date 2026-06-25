import { useState } from 'react'
import { Trash2, Plus, ChevronRight, ChevronDown } from 'lucide-react'
import type { Task, TaskProject } from '../types'
import { PRIORITY_CFG } from '../types'

function fmtDue(dateStr: string): string {
  const t = new Date().toISOString().slice(0, 10)
  if (dateStr === t) return 'Hoje'
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
  if (dateStr === tomorrow.toISOString().slice(0, 10)) return 'Amanhã'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

interface Props {
  task: Task
  subtasks: Task[]
  project?: TaskProject
  showProject: boolean
  onComplete: (t: Task) => void
  onDelete: (id: string) => void
  onClick: (t: Task) => void
  onAddSubtask: (parent: Task) => void
}

export function TaskItem({ task, subtasks, project, showProject, onComplete, onDelete, onClick, onAddSubtask }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [hovering, setHovering] = useState(false)
  const cfg    = PRIORITY_CFG[task.priority]
  const isDone = !!task.completed_at
  const isOverdue = !isDone && task.due_date && task.due_date < new Date().toISOString().slice(0, 10)

  return (
    <div
      className="group"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className={[
        'flex items-start gap-3 py-2.5 px-3 rounded-lg transition-colors',
        hovering && !isDone ? 'bg-[#111111]' : '',
      ].join(' ')}>
        {/* Subtask toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          className={['w-4 shrink-0 mt-0.5 transition-colors', subtasks.length > 0 ? 'text-[#555] hover:text-white' : 'invisible'].join(' ')}
        >
          {subtasks.length > 0
            ? (expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />)
            : null}
        </button>

        {/* Checkbox */}
        <button
          onClick={() => onComplete(task)}
          className={[
            'w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all',
            isDone ? 'border-[#555] bg-[#555]' : 'hover:border-[#0EA5E9]',
          ].join(' ')}
          style={{ borderColor: isDone ? '#555' : cfg.color }}
        >
          {isDone && (
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1.5 4L3.5 6L6.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => !isDone && onClick(task)}>
          <div className={['text-sm leading-snug', isDone ? 'line-through text-[#555]' : 'text-[#ddd]'].join(' ')}>
            {task.title}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {task.due_date && (
              <span
                className="text-[11px] font-medium"
                style={{ color: isOverdue ? '#ef4444' : task.due_date === new Date().toISOString().slice(0, 10) ? '#22c55e' : '#888' }}
              >
                {isOverdue ? '⚠ ' : ''}{fmtDue(task.due_date)}
              </span>
            )}
            {showProject && project && (
              <span className="flex items-center gap-1 text-[11px] text-[#555]">
                <span className="w-2 h-2 rounded-full" style={{ background: project.color }} />
                {project.name}
              </span>
            )}
            {subtasks.length > 0 && (
              <span className="text-[11px] text-[#555]">{subtasks.length} subtarefa{subtasks.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        {/* Actions (hover) */}
        <div className={['flex items-center gap-1 shrink-0', hovering ? 'opacity-100' : 'opacity-0'].join(' ')}>
          {!isDone && (
            <span
              className="text-[11px] font-bold px-1.5 py-0.5 rounded"
              style={{ color: cfg.color, background: cfg.bg }}
            >
              P{task.priority}
            </span>
          )}
          {!isDone && (
            <button
              onClick={() => onAddSubtask(task)}
              className="text-[#555] hover:text-[#0EA5E9] transition-colors p-1"
              title="Adicionar subtarefa"
            >
              <Plus size={13} />
            </button>
          )}
          <button
            onClick={() => onDelete(task.id)}
            className="text-[#555] hover:text-[#ef4444] transition-colors p-1"
            title="Excluir"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Subtasks */}
      {expanded && subtasks.length > 0 && (
        <div className="ml-8 border-l border-[#1f1f1f] pl-3 space-y-px">
          {subtasks.map(sub => (
            <TaskItem
              key={sub.id}
              task={sub}
              subtasks={[]}
              project={undefined}
              showProject={false}
              onComplete={onComplete}
              onDelete={onDelete}
              onClick={onClick}
              onAddSubtask={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  )
}
