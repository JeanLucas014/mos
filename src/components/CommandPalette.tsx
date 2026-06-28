import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  Search, CheckSquare, Calendar, DollarSign,
  BookOpen, Lock, ShoppingCart, Target,
  Folder, FileText, X, ChevronRight,
} from 'lucide-react'

interface Result {
  id: string
  type: 'tarefa' | 'evento' | 'lancamento' | 'livro' | 'senha' | 'compra' | 'meta' | 'projeto' | 'nota'
  title: string
  subtitle?: string
  url: string
  icon: React.ReactNode
  color: string
}

const TYPE_CONFIG = {
  tarefa:     { label: 'Tarefa',     color: '#0EA5E9', icon: <CheckSquare  size={14} /> },
  evento:     { label: 'Evento',     color: '#a78bfa', icon: <Calendar     size={14} /> },
  lancamento: { label: 'Financeiro', color: '#22c55e', icon: <DollarSign   size={14} /> },
  livro:      { label: 'Biblioteca', color: '#f97316', icon: <BookOpen     size={14} /> },
  senha:      { label: 'Senha',      color: '#f59e0b', icon: <Lock         size={14} /> },
  compra:     { label: 'Compras',    color: '#ec4899', icon: <ShoppingCart size={14} /> },
  meta:       { label: 'Meta',       color: '#14b8a6', icon: <Target       size={14} /> },
  projeto:    { label: 'Projeto',    color: '#6366f1', icon: <Folder       size={14} /> },
  nota:       { label: 'Nota',       color: '#84cc16', icon: <FileText     size={14} /> },
}

const NAVIGATION = [
  { title: 'Dashboard',   url: '/',            icon: '🏠' },
  { title: 'Agenda',      url: '/agenda',      icon: '📅' },
  { title: 'Tarefas',     url: '/tarefas',     icon: '✅' },
  { title: 'Financeiro',  url: '/financeiro',  icon: '💰' },
  { title: 'Esportes',    url: '/esportes',    icon: '🏃' },
  { title: 'Biblioteca',  url: '/biblioteca',  icon: '📚' },
  { title: 'Senhas',      url: '/senhas',      icon: '🔑' },
  { title: 'Notas',       url: '/notas',       icon: '📝' },
  { title: 'Projetos',    url: '/projetos',    icon: '📁' },
  { title: 'Metas',       url: '/metas',       icon: '🎯' },
  { title: 'Hábitos',     url: '/habitos',     icon: '🔁' },
  { title: 'Integrações', url: '/integracoes', icon: '🔗' },
]

export function CommandPalette() {
  const [open,     setOpen]     = useState(false)
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState<Result[]>([])
  const [loading,  setLoading]  = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // CMD+K / CTRL+K toggle
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults([])
      setSelected(0)
    }
  }, [open])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    const term = `%${q}%`
    const found: Result[] = []

    const [
      { data: tasks },
      { data: events },
      { data: lancamentos },
      { data: books },
      { data: vault },
      { data: shopping },
      { data: goals },
      { data: projects },
      { data: notes },
    ] = await Promise.all([
      supabase.from('tasks').select('id,title')
        .ilike('title', term).is('completed_at', null).limit(4),
      (supabase as any).from('calendar_events').select('id,title,start_at,color')
        .ilike('title', term).limit(4),
      (supabase as any).from('fin_lancamentos').select('id,nome,valor')
        .ilike('nome', term).eq('is_grupo', false).limit(4),
      supabase.from('books').select('id,title,author')
        .ilike('title', term).limit(4),
      (supabase as any).from('vault_items').select('id,service,username')
        .ilike('service', term).limit(4),
      (supabase as any).from('shopping_items').select('id,title')
        .ilike('title', term).eq('done', false).limit(4),
      (supabase as any).from('goals').select('id,title')
        .ilike('title', term).limit(4).catch(() => ({ data: [] as any[] })),
      (supabase as any).from('projects').select('id,name')
        .ilike('name', term).limit(4).catch(() => ({ data: [] as any[] })),
      supabase.from('notes').select('id,title')
        .ilike('title', term).limit(4),
    ])

    tasks?.forEach(t => found.push({
      id: t.id, type: 'tarefa', title: t.title,
      url: '/tarefas', color: TYPE_CONFIG.tarefa.color,
      icon: TYPE_CONFIG.tarefa.icon,
    }))
    events?.forEach((e: any) => found.push({
      id: e.id, type: 'evento', title: e.title,
      subtitle: e.start_at ? new Date(e.start_at).toLocaleDateString('pt-BR') : undefined,
      url: '/agenda', color: e.color ?? TYPE_CONFIG.evento.color,
      icon: TYPE_CONFIG.evento.icon,
    }))
    lancamentos?.forEach((l: any) => found.push({
      id: l.id, type: 'lancamento', title: l.nome,
      subtitle: l.valor != null ? `R$ ${Number(l.valor).toFixed(2)}` : undefined,
      url: '/financeiro', color: TYPE_CONFIG.lancamento.color,
      icon: TYPE_CONFIG.lancamento.icon,
    }))
    books?.forEach(b => found.push({
      id: b.id, type: 'livro', title: b.title,
      subtitle: (b as any).author ?? undefined,
      url: '/biblioteca', color: TYPE_CONFIG.livro.color,
      icon: TYPE_CONFIG.livro.icon,
    }))
    vault?.forEach((v: any) => found.push({
      id: v.id, type: 'senha', title: v.service,
      subtitle: v.username ?? undefined,
      url: '/senhas', color: TYPE_CONFIG.senha.color,
      icon: TYPE_CONFIG.senha.icon,
    }))
    shopping?.forEach((s: any) => found.push({
      id: s.id, type: 'compra', title: s.title,
      url: '/compras', color: TYPE_CONFIG.compra.color,
      icon: TYPE_CONFIG.compra.icon,
    }))
    const goalsData = (goals as any)?.data ?? goals ?? []
    ;(goalsData as any[]).forEach((g: any) => found.push({
      id: g.id, type: 'meta' as const, title: g.title ?? '',
      url: '/metas', color: TYPE_CONFIG.meta.color,
      icon: TYPE_CONFIG.meta.icon,
    }))
    const projectsData = (projects as any)?.data ?? projects ?? []
    ;(projectsData as any[]).forEach((p: any) => found.push({
      id: p.id, type: 'projeto' as const, title: p.name ?? '',
      url: '/projetos', color: TYPE_CONFIG.projeto.color,
      icon: TYPE_CONFIG.projeto.icon,
    }))
    notes?.forEach(n => found.push({
      id: n.id, type: 'nota', title: n.title ?? '(sem título)',
      url: '/notas', color: TYPE_CONFIG.nota.color,
      icon: TYPE_CONFIG.nota.icon,
    }))

    setResults(found)
    setSelected(0)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200)
    return () => clearTimeout(timer)
  }, [query, search])

  function onKeyDown(e: React.KeyboardEvent) {
    const list = query ? results : NAVIGATION
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(v => Math.min(v + 1, list.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(v => Math.max(v - 1, 0)) }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (query && results[selected]) {
        navigate(results[selected].url); setOpen(false)
      } else if (!query && NAVIGATION[selected]) {
        navigate(NAVIGATION[selected].url); setOpen(false)
      }
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[100] flex items-start justify-center pt-[15vh] px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-[#111111] border border-[#2a2a2a] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1f1f1f]">
          <Search size={16} className="text-[#555] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar tarefas, eventos, senhas, livros..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-[#444]"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[#555] hover:text-white transition-colors">
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline text-[10px] text-[#444] border border-[#2a2a2a] rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="px-4 py-8 text-center text-xs text-[#444]">Buscando...</div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-[#444]">
              Nenhum resultado para "{query}"
            </div>
          )}

          {!loading && query && results.length > 0 && (
            <div className="py-2">
              {results.map((r, i) => (
                <button
                  key={r.id + i}
                  onClick={() => { navigate(r.url); setOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{ background: selected === i ? 'rgba(255,255,255,.05)' : 'transparent' }}
                  onMouseEnter={() => setSelected(i)}
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: r.color + '22', color: r.color }}
                  >
                    {r.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{r.title}</div>
                    {r.subtitle && (
                      <div className="text-[11px] text-[#555] truncate">{r.subtitle}</div>
                    )}
                  </div>
                  <span className="text-[10px] text-[#444] shrink-0 px-1.5 py-0.5 rounded border border-[#2a2a2a]">
                    {TYPE_CONFIG[r.type]?.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Navegação rápida */}
          {!query && (
            <div className="py-2">
              <div className="px-4 py-1.5 text-[10px] text-[#444] uppercase tracking-wider">
                Navegação rápida
              </div>
              {NAVIGATION.map((item, i) => (
                <button
                  key={item.url}
                  onClick={() => { navigate(item.url); setOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{ background: selected === i ? 'rgba(255,255,255,.05)' : 'transparent' }}
                  onMouseEnter={() => setSelected(i)}
                >
                  <span className="text-base w-7 text-center shrink-0">{item.icon}</span>
                  <span className="text-sm text-[#ccc]">{item.title}</span>
                  <ChevronRight size={12} className="text-[#333] ml-auto shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[#1f1f1f] flex items-center gap-4">
          <span className="text-[10px] text-[#333]">
            <kbd className="border border-[#2a2a2a] rounded px-1">↑↓</kbd> navegar
          </span>
          <span className="text-[10px] text-[#333]">
            <kbd className="border border-[#2a2a2a] rounded px-1">↵</kbd> abrir
          </span>
          <span className="text-[10px] text-[#333] ml-auto">
            <kbd className="border border-[#2a2a2a] rounded px-1">⌘K</kbd> fechar
          </span>
        </div>
      </div>
    </div>
  )
}
