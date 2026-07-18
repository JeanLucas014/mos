import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { todayLocal, addDaysLocal } from '@/lib/dates'
import { Plus, Sun, Calendar, CalendarDays, FolderOpen, ChevronDown, ChevronRight, History, Settings } from 'lucide-react'
import type { Task, TaskProject, ViewId } from './types'
import { TaskItem } from './components/TaskItem'
import { TaskModal } from './components/TaskModal'
import { ProjectModal } from './components/ProjectModal'
import { HelpButton } from '@/components/help/HelpButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useRealtimeStore } from '@/stores/useRealtimeStore'

type ModalState = { task: Partial<Task> } | null

const SYSTEM_VIEWS = ['inbox', 'hoje', 'proximos7', 'historico']

function fmtDateHeader(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  })
}

export default function TarefasPage() {
  const [tasks, setTasks]           = useState<Task[]>([])
  const [projects, setProjects]     = useState<TaskProject[]>([])
  const [viewId, setViewId]         = useState<ViewId>('inbox')
  const [modal, setModal]           = useState<ModalState>(null)
  const [editingProject, setEditingProject] = useState<TaskProject | null>(null)
  const [quickTitle, setQuickTitle] = useState('')
  const [loading, setLoading]       = useState(true)
  const [showProjectDrawer, setShowProjectDrawer] = useState(false)
  const [projectsOpen, setProjectsOpen]           = useState(true)

  useEffect(() => { loadAll() }, [])

  // Recarrega quando outra aba/dispositivo muda `tasks` (useRealtimeSync).
  // Pula a primeira execução — o mount acima já carrega os dados.
  const tasksVersion = useRealtimeStore(s => s.versions.tasks)
  const skipFirstSync = useRef(true)
  useEffect(() => {
    if (skipFirstSync.current) { skipFirstSync.current = false; return }
    loadAll()
  }, [tasksVersion])

  async function loadAll() {
    const [{ data: t }, { data: p }] = await Promise.all([
      supabase.from('tasks').select('*').order('ordem').order('created_at'),
      supabase.from('task_projects').select('*').order('ordem').order('name'),
    ])
    setTasks((t ?? []) as Task[])
    setProjects((p ?? []) as TaskProject[])
    setLoading(false)
  }

  function getViewTasks(view: ViewId): Task[] {
    const todayStr = todayLocal()
    const t7 = addDaysLocal(todayStr, 7)
    const pendingTasks = tasks.filter(t => !t.parent_id && !t.completed_at)
    switch (view) {
      case 'inbox': {
        const todayTasks = pendingTasks.filter(t => t.due_date === todayStr)
        return todayTasks.length > 0 ? todayTasks : pendingTasks.filter(t => !t.due_date)
      }
      case 'hoje':      return pendingTasks.filter(t => t.due_date != null && t.due_date <= todayStr)
      case 'proximos7': return pendingTasks.filter(t => t.due_date != null && t.due_date <= t7)
      case 'historico': return [...tasks.filter(t => !!t.completed_at && !t.parent_id)]
        .sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))
      default:          return pendingTasks.filter(t => t.project_id === view)
    }
  }

  function subtasksOf(taskId: string) {
    return tasks.filter(t => t.parent_id === taskId && !t.completed_at)
  }

  function projectOf(task: Task) {
    return task.project_id ? projects.find(p => p.id === task.project_id) : undefined
  }

  async function handleComplete(task: Task) {
    const now = task.completed_at ? null : new Date().toISOString()
    await supabase.from('tasks').update({ completed_at: now }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed_at: now } : t))
  }

  async function handleDelete(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id && t.parent_id !== id))
    setModal(null)
  }

  async function handleDeleteProject(id: string) {
    await supabase.from('task_projects').delete().eq('id', id)
    setProjects(prev => prev.filter(p => p.id !== id))
    if (viewId === id) setViewId('inbox')
    setEditingProject(null)
  }

  async function handleSave(payload: Partial<Task>) {
    if (payload.id) {
      await supabase.from('tasks').update(payload).eq('id', payload.id)
      setTasks(prev => prev.map(t => t.id === payload.id ? { ...t, ...payload } : t))
    } else {
      if (!payload.title) return
      const insert = {
        title:       payload.title,
        description: payload.description ?? null,
        priority:    payload.priority ?? 4,
        project_id:  payload.project_id !== undefined ? payload.project_id : (!SYSTEM_VIEWS.includes(viewId) ? viewId : null),
        parent_id:   payload.parent_id ?? null,
        due_date:    payload.due_date ?? (viewId === 'hoje' ? todayLocal() : null),
        due_time:    payload.due_time ?? null,
        ordem:       tasks.length,
      }
      const { data } = await supabase.from('tasks').insert(insert).select().single()
      if (data) setTasks(prev => [...prev, data as Task])
    }
    setModal(null)
  }

  async function handleQuickAdd(e: React.KeyboardEvent) {
    if (e.key !== 'Enter' || !quickTitle.trim()) return
    const insert = {
      title:      quickTitle.trim(),
      priority:   4,
      project_id: !SYSTEM_VIEWS.includes(viewId) ? viewId : null,
      due_date:   viewId === 'hoje' ? todayLocal() : null,
      ordem:      tasks.length,
    }
    const { data } = await supabase.from('tasks').insert(insert).select().single()
    if (data) setTasks(prev => [...prev, data as Task])
    setQuickTitle('')
  }

  function openAddSubtask(parent: Task) {
    setModal({ task: { parent_id: parent.id, project_id: parent.project_id, priority: 4 } })
  }

  const viewLabel = (() => {
    if (viewId === 'inbox')      return 'Inbox'
    if (viewId === 'hoje')       return 'Hoje'
    if (viewId === 'proximos7')  return 'Próximos 7 dias'
    if (viewId === 'historico')  return 'Histórico'
    return projects.find(p => p.id === viewId)?.name ?? 'Projeto'
  })()

  const shown = getViewTasks(viewId)

  // Counts for nav badges
  const todayStr = todayLocal()
  const t7Str = addDaysLocal(todayStr, 7)

  const NAV_VIEWS: { id: ViewId; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'inbox',     label: 'Inbox',           icon: <CalendarDays size={14} />, count: tasks.filter(t => !t.parent_id && !t.completed_at && t.due_date === todayStr).length || tasks.filter(t => !t.parent_id && !t.completed_at && !t.due_date).length },
    { id: 'hoje',      label: 'Hoje',            icon: <Sun size={14} />,      count: tasks.filter(t => !t.parent_id && !t.completed_at && t.due_date != null && t.due_date <= todayStr).length },
    { id: 'proximos7', label: 'Próximos 7 dias', icon: <Calendar size={14} />, count: tasks.filter(t => !t.parent_id && !t.completed_at && t.due_date != null && t.due_date <= t7Str).length },
    { id: 'historico', label: 'Histórico',       icon: <History size={14} />,  count: tasks.filter(t => !!t.completed_at && !t.parent_id).length },
  ]

  // History: group by completion date
  const historyGroups: Array<{ day: string; items: Task[] }> = []
  if (viewId === 'historico') {
    const byDay: Record<string, Task[]> = {}
    shown.forEach(t => {
      const day = (t.completed_at ?? '').slice(0, 10)
      if (!byDay[day]) byDay[day] = []
      byDay[day].push(t)
    })
    Object.keys(byDay).sort((a, b) => b.localeCompare(a)).forEach(day => {
      historyGroups.push({ day, items: byDay[day] })
    })
  }

  function projectCount(projectId: string) {
    return tasks.filter(t => t.project_id === projectId && !t.parent_id && !t.completed_at).length
  }

  function handleAddProject() {
    setShowProjectDrawer(false)
    setEditingProject({
      id: 'new', user_id: '', name: '', color: '#0EA5E9',
      ordem: projects.length, created_at: '',
    })
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-r border-[#1a1a1a] w-56 shrink-0">
      <div className="px-3 pt-4 pb-2">
        <span className="text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-2">Visões</span>
      </div>
      <nav className="px-2 space-y-px">
        {NAV_VIEWS.map(v => (
          <button
            key={v.id}
            onClick={() => { setViewId(v.id); setShowProjectDrawer(false) }}
            className={[
              'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors',
              viewId === v.id ? 'bg-[#1a1a1a] text-white' : 'text-[#666] hover:text-[#ccc] hover:bg-[#111]',
            ].join(' ')}
          >
            <span className={viewId === v.id ? 'text-brand' : ''}>{v.icon}</span>
            {v.label}
            {v.count > 0 && (
              <span className="ml-auto text-[11px] text-[#444]">{v.count}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="px-3 pt-4 pb-1">
        <button
          onClick={() => setProjectsOpen(v => !v)}
          className="w-full flex items-center gap-1 text-[11px] font-semibold text-ink-3 uppercase tracking-wider px-2 hover:text-[#888] transition-colors"
        >
          {projectsOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          Projetos
        </button>
      </div>

      {projectsOpen && (
        <nav className="px-2 space-y-px flex-1 overflow-y-auto pb-2">
          {projects.map(p => {
            const count = tasks.filter(t => t.project_id === p.id && !t.parent_id && !t.completed_at).length
            return (
              <div key={p.id} className="group relative">
                <button
                  onClick={() => { setViewId(p.id); setShowProjectDrawer(false) }}
                  className={[
                    'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors pr-7',
                    viewId === p.id ? 'bg-[#1a1a1a] text-white' : 'text-[#666] hover:text-[#ccc] hover:bg-[#111]',
                  ].join(' ')}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                  <span className="truncate">{p.name}</span>
                  {count > 0 && (
                    <span className="ml-auto text-[11px] text-[#444] group-hover:opacity-0 transition-opacity">{count}</span>
                  )}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setEditingProject(p) }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-ink-3 hover:text-white transition-all p-1"
                  title="Editar projeto"
                >
                  <Settings size={11} />
                </button>
              </div>
            )
          })}
          {projects.length === 0 && (
            <div className="px-2 py-3 text-xs text-[#444] text-center">Nenhum projeto</div>
          )}
          <button
            onClick={() => setEditingProject({
              id: 'new', user_id: '', name: '', color: '#0EA5E9',
              ordem: projects.length, created_at: '',
            })}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-[#444] hover:text-[#888] hover:bg-[#111] transition-colors"
          >
            <Plus size={12} />
            Novo projeto
          </button>
        </nav>
      )}
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-64px)] font-[Manrope] -mx-4 lg:-mx-7 -mt-4 lg:-mt-7">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col">
        <SidebarContent />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1a1a1a] shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-white font-[Sora]">{viewLabel}</h1>
            <HelpButton pageId="tarefas" />
          </div>
          {viewId !== 'historico' && (
            <button
              onClick={() => setModal({ task: {} })}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-brand text-black text-xs font-semibold rounded-lg hover:bg-[#38bdf8] transition-colors"
            >
              <Plus size={13} />
              Nova tarefa
            </button>
          )}
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto px-2 py-3 pb-24 lg:pb-3">
          {loading ? (
            <div className="text-ink-3 text-sm text-center py-12">Carregando...</div>
          ) : shown.length === 0 ? (
            <EmptyState
              icon={<FolderOpen size={32} className="text-[#333]" />}
              title={viewId === 'historico' ? 'Nenhuma tarefa concluída.' : 'Nenhuma tarefa aqui.'}
              action={viewId !== 'historico' ? { label: 'Adicionar tarefa', onClick: () => setModal({ task: {} }) } : undefined}
            />
          ) : viewId === 'historico' ? (
            <div className="max-w-2xl mx-auto">
              {historyGroups.map(group => (
                <div key={group.day}>
                  <div className="flex items-center gap-3 py-3 px-3">
                    <div className="h-px flex-1 bg-[#1a1a1a]" />
                    <span className="text-[11px] text-[#444] whitespace-nowrap capitalize">
                      {fmtDateHeader(group.day)}
                    </span>
                    <div className="h-px flex-1 bg-[#1a1a1a]" />
                  </div>
                  {group.items.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      subtasks={[]}
                      project={projectOf(task)}
                      showProject={true}
                      onComplete={handleComplete}
                      onDelete={handleDelete}
                      onClick={t => setModal({ task: t })}
                      onAddSubtask={() => {}}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-px max-w-2xl mx-auto">
              {shown.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  subtasks={subtasksOf(task.id)}
                  project={projectOf(task)}
                  showProject={viewId === 'inbox' || viewId === 'hoje' || viewId === 'proximos7'}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                  onClick={t => setModal({ task: t })}
                  onAddSubtask={openAddSubtask}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick-add bar — hidden on mobile (bottom nav handles input) */}
        {viewId !== 'historico' && (
          <div className="hidden lg:block shrink-0 px-4 pb-4 max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-2 bg-[#111111] border border-[#1f1f1f] rounded-xl px-4 py-3 focus-within:border-brand/50 transition-colors">
              <Plus size={15} className="text-[#444] shrink-0" />
              <input
                value={quickTitle}
                onChange={e => setQuickTitle(e.target.value)}
                onKeyDown={handleQuickAdd}
                placeholder="Adicionar tarefa… (Enter para salvar)"
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#333]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile bottom navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0a0a0a] border-t border-[#1f1f1f] flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {[
          { id: 'inbox',     label: 'Inbox',   Icon: CalendarDays },
          { id: 'hoje',      label: 'Hoje',   Icon: Sun      },
          { id: 'proximos7', label: '7 dias', Icon: Calendar },
          { id: 'projetos',  label: 'Projetos', Icon: FolderOpen },
        ].map(({ id, label, Icon }) => {
          const isActive = id === 'projetos'
            ? !SYSTEM_VIEWS.includes(viewId) && viewId !== 'historico'
            : viewId === id
          return (
          <button key={id}
            onClick={() => id === 'projetos' ? setShowProjectDrawer(true) : setViewId(id as ViewId)}
            className={['flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] relative min-h-[52px]',
              isActive ? 'text-brand' : 'text-ink-3',
            ].join(' ')}>
            <Icon size={18} />
            {label}
            {id !== 'projetos' && NAV_VIEWS.find(v => v.id === id)?.count! > 0 && (
              <span className="absolute top-1.5 right-1/4 translate-x-1/2 w-4 h-4 rounded-full bg-brand text-black text-[9px] font-bold flex items-center justify-center">
                {NAV_VIEWS.find(v => v.id === id)?.count}
              </span>
            )}
          </button>
          )
        })}
      </div>

      {/* Mobile project drawer */}
      {showProjectDrawer && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end"
          onClick={() => setShowProjectDrawer(false)}>
          <div className="bg-[#111111] border-t border-[#1f1f1f] rounded-t-2xl p-4 max-h-[60vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[#333] rounded-full mx-auto mb-4" />
            <div className="text-xs text-ink-3 uppercase tracking-wider mb-3 px-1">Projetos</div>
            {projects.map(p => (
              <button key={p.id}
                onClick={() => { setViewId(p.id); setShowProjectDrawer(false) }}
                className="w-full flex items-center gap-3 py-3 border-b border-[#1a1a1a] text-left min-h-[44px]">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: p.color }} />
                <span className="flex-1 text-sm text-white">{p.name}</span>
                <span className="text-xs text-ink-3">{projectCount(p.id)}</span>
              </button>
            ))}
            <button onClick={handleAddProject}
              className="w-full flex items-center gap-2 py-3 text-sm text-brand mt-1 min-h-[44px]">
              <Plus size={14} /> Novo projeto
            </button>
          </div>
        </div>
      )}

      {/* Task modal */}
      {modal && (
        <TaskModal
          task={modal.task}
          projects={projects}
          onSave={handleSave}
          onClose={() => setModal(null)}
          onDelete={modal.task.id ? () => handleDelete(modal.task.id!) : undefined}
        />
      )}

      {/* Project modal */}
      {editingProject && (
        <ProjectModal
          project={editingProject}
          onSave={async updated => {
            if (!updated.name) return
            if (updated.id === 'new') {
              const { data } = await supabase
                .from('task_projects')
                .insert({ name: updated.name, color: updated.color, ordem: projects.length })
                .select().single()
              if (data) {
                setProjects(prev => [...prev, data as TaskProject])
                setViewId((data as TaskProject).id)
              }
            } else if (updated.id) {
              await supabase
                .from('task_projects')
                .update({ name: updated.name, color: updated.color })
                .eq('id', updated.id)
              setProjects(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p))
            }
            setEditingProject(null)
          }}
          onDelete={() => handleDeleteProject(editingProject.id)}
          onClose={() => setEditingProject(null)}
        />
      )}
    </div>
  )
}
