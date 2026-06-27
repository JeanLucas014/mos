import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Flag, Calendar, FolderOpen, RotateCcw, Plus, Trash2 } from 'lucide-react'
import type { Task, TaskProject, Priority, TaskComment } from '../types'
import { PRIORITY_CFG } from '../types'
import { DatePicker } from './DatePicker'

const RECURRENCE_OPTIONS = [
  { id: '',         label: 'Não repete' },
  { id: 'daily',    label: 'Diariamente' },
  { id: 'weekdays', label: 'Dias úteis (seg–sex)' },
  { id: 'weekly',   label: 'Semanalmente' },
  { id: 'monthly',  label: 'Mensalmente' },
  { id: 'yearly',   label: 'Todo ano' },
]

const WEEK_DAYS = [
  { id: 'sun', label: 'D' },
  { id: 'mon', label: 'S' },
  { id: 'tue', label: 'T' },
  { id: 'wed', label: 'Q' },
  { id: 'thu', label: 'Q' },
  { id: 'fri', label: 'S' },
  { id: 'sat', label: 'S' },
]

interface Props {
  task: Partial<Task>
  projects: TaskProject[]
  onSave: (task: Partial<Task>) => void
  onClose: () => void
  onDelete?: () => void
}

export function TaskModal({ task, projects, onSave, onClose, onDelete }: Props) {
  const isNew = !task.id

  const [title, setTitle]           = useState(task.title ?? '')
  const [description, setDesc]      = useState(task.description ?? '')
  const [priority, setPriority]     = useState<Priority>(task.priority ?? 4)
  const [projectId, setProjectId]   = useState<string | null>(task.project_id ?? null)
  const [dueDate, setDueDate]       = useState<string | null>(task.due_date ?? null)
  const [dueTime, setDueTime]       = useState(task.due_time ?? '')
  const [recurrence, setRecurrence] = useState('')
  const [recDays, setRecDays]       = useState<string[]>([])
  const [comments, setComments]     = useState<TaskComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [saving, setSaving]         = useState(false)
  const [activeTab, setActiveTab]   = useState<'details' | 'comments'>('details')

  useEffect(() => {
    if (task.id) { loadComments(); loadRecurrence() }
  }, [task.id])

  async function loadComments() {
    const { data } = await (supabase as any)
      .from('task_comments').select('*')
      .eq('task_id', task.id!).order('created_at')
    setComments(data ?? [])
  }

  async function loadRecurrence() {
    const { data } = await (supabase as any)
      .from('task_recurrence').select('*').eq('task_id', task.id!).maybeSingle()
    if (data) {
      setRecurrence(data.freq)
      setRecDays(data.days_of_week ?? [])
    }
  }

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)

    const payload: Partial<Task> = {
      ...task,
      title:       title.trim(),
      description: description.trim() || null,
      priority,
      project_id:  projectId,
      due_date:    dueDate || null,
      due_time:    dueTime || null,
    }

    if (task.id) {
      await (supabase as any).from('task_recurrence').delete().eq('task_id', task.id)
      if (recurrence) {
        const nextDue = dueDate || new Date().toISOString().slice(0, 10)
        await (supabase as any).from('task_recurrence').insert({
          task_id:      task.id,
          freq:         recurrence,
          interval_n:   1,
          days_of_week: recurrence === 'weekly' ? recDays : null,
          next_due:     nextDue,
        })
      }
    }

    onSave(payload)
    setSaving(false)
  }

  async function handleAddComment() {
    if (!newComment.trim() || !task.id) return
    const { data } = await (supabase as any).from('task_comments')
      .insert({ task_id: task.id, content: newComment.trim() })
      .select().single()
    if (data) setComments(prev => [...prev, data as TaskComment])
    setNewComment('')
  }

  async function handleDeleteComment(id: string) {
    await (supabase as any).from('task_comments').delete().eq('id', id)
    setComments(prev => prev.filter(c => c.id !== id))
  }

  const priorities: Priority[] = [1, 2, 3, 4]

  return (
    <div
      className="fixed inset-0 bg-black/75 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111111] border border-[#1f1f1f] rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f1f1f]">
          <span className="text-sm font-semibold font-[Sora] text-white">
            {isNew ? 'Nova tarefa' : 'Editar tarefa'}
          </span>
          <div className="flex items-center gap-2">
            {!isNew && onDelete && (
              <button onClick={onDelete} className="text-[#555] hover:text-[#ef4444] transition-colors">
                <Trash2 size={14} />
              </button>
            )}
            <button onClick={onClose} className="text-[#555] hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Tabs (only for existing tasks) */}
        {!isNew && (
          <div className="flex border-b border-[#1f1f1f]">
            {[
              { id: 'details',  label: 'Detalhes' },
              { id: 'comments', label: `Comentários${comments.length > 0 ? ` (${comments.length})` : ''}` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'details' | 'comments')}
                className={[
                  'px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors',
                  activeTab === tab.id ? 'text-[#0EA5E9] border-[#0EA5E9]' : 'text-[#555] border-transparent',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'details' && (
            <div className="p-5 space-y-4">
              {/* Title */}
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSave()}
                placeholder="Nome da tarefa"
                autoFocus
                className="w-full bg-transparent text-white text-base font-medium outline-none placeholder:text-[#333]"
              />

              {/* Description */}
              <textarea
                value={description}
                onChange={e => setDesc(e.target.value)}
                placeholder="Descrição (opcional)"
                rows={2}
                className="w-full bg-transparent text-sm text-[#aaa] outline-none resize-none placeholder:text-[#2a2a2a]"
              />

              <div className="border-t border-[#1f1f1f] pt-4 space-y-3">
                {/* Priority */}
                <div className="flex items-center gap-2">
                  <Flag size={14} className="text-[#555] shrink-0" />
                  <span className="text-xs text-[#555] w-20 shrink-0">Prioridade</span>
                  <div className="flex gap-1">
                    {priorities.map(p => {
                      const c = PRIORITY_CFG[p]
                      return (
                        <button
                          key={p}
                          onClick={() => setPriority(p)}
                          className="px-2.5 py-1 text-xs rounded-lg border transition-colors font-medium"
                          style={{
                            borderColor: priority === p ? c.color : '#1f1f1f',
                            color:       priority === p ? c.color : '#555',
                            background:  priority === p ? c.bg    : 'transparent',
                          }}
                        >
                          P{p}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Project */}
                <div className="flex items-center gap-2">
                  <FolderOpen size={14} className="text-[#555] shrink-0" />
                  <span className="text-xs text-[#555] w-20 shrink-0">Projeto</span>
                  <select
                    value={projectId ?? ''}
                    onChange={e => setProjectId(e.target.value || null)}
                    className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#0EA5E9]/60"
                  >
                    <option value="">Inbox (sem projeto)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Due date */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Calendar size={14} className="text-[#555] shrink-0" />
                  <span className="text-xs text-[#555] w-20 shrink-0">Vencimento</span>
                  <DatePicker value={dueDate} onChange={setDueDate} />
                  {dueDate && (
                    <input
                      type="time"
                      value={dueTime}
                      onChange={e => setDueTime(e.target.value)}
                      className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#0EA5E9]/60"
                    />
                  )}
                </div>

                {/* Recurrence */}
                <div className="flex items-start gap-2">
                  <RotateCcw size={14} className="text-[#555] shrink-0 mt-1.5" />
                  <span className="text-xs text-[#555] w-20 shrink-0 mt-1.5">Repetir</span>
                  <div className="flex-1 space-y-2">
                    <select
                      value={recurrence}
                      onChange={e => setRecurrence(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#0EA5E9]/60"
                    >
                      {RECURRENCE_OPTIONS.map(o => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                    {recurrence === 'weekly' && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] text-[#555]">Dias da semana:</div>
                        <div className="flex gap-1.5">
                          {WEEK_DAYS.map(d => (
                            <button
                              key={d.id}
                              onClick={() => setRecDays(prev =>
                                prev.includes(d.id) ? prev.filter(x => x !== d.id) : [...prev, d.id]
                              )}
                              className={[
                                'w-8 h-8 text-xs rounded-full border transition-colors font-medium',
                                recDays.includes(d.id)
                                  ? 'border-[#0EA5E9] bg-[#0EA5E9]/20 text-[#0EA5E9]'
                                  : 'border-[#1f1f1f] text-[#555] hover:text-white',
                              ].join(' ')}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comments tab */}
          {activeTab === 'comments' && (
            <div className="p-5 space-y-3">
              {comments.map(c => (
                <div key={c.id} className="group flex gap-2">
                  <div className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2">
                    <div className="text-sm text-[#ddd]">{c.content}</div>
                    <div className="text-[10px] text-[#555] mt-1">
                      {new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="opacity-0 group-hover:opacity-100 text-[#555] hover:text-[#ef4444] transition-all self-start mt-2"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-center py-8 text-[#555] text-sm">Nenhum comentário.</div>
              )}
              <div className="flex gap-2 pt-2">
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                  placeholder="Adicionar comentário..."
                  className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#0EA5E9]/60"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-3 bg-[#0EA5E9] text-black rounded-lg font-semibold text-sm disabled:opacity-40"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#1f1f1f]">
          <button onClick={onClose} className="text-sm text-[#555] hover:text-white transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-4 py-2 text-sm font-semibold bg-[#0EA5E9] text-black rounded-lg hover:bg-[#38bdf8] disabled:opacity-40 transition-colors"
          >
            {saving ? 'Salvando…' : isNew ? 'Criar tarefa' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
