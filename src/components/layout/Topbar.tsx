import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useUIStore } from '../../stores/useUIStore'

const VIEW_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/agenda': 'Agenda',
  '/tarefas': 'Tarefas & To-do',
  '/projetos': 'Projetos',
  '/metas': 'Metas',
  '/habitos': 'Hábitos',
  '/compras': 'Lista de compras',
  '/financeiro': 'Financeiro',
  '/faturamento': 'Faturamento',
  '/notas': 'Notas',
  '/biblioteca': 'Biblioteca',
  '/estudos': 'Estudos',
  '/senhas': 'Senhas',
  '/corridas': 'Corridas',
  '/integracoes': 'Integrações',
}

export function Topbar() {
  const location = useLocation()
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  const currentLabel = VIEW_LABELS[location.pathname] ?? 'MOS'
  const dateStr = format(new Date(), "EEE dd MMM", { locale: ptBR })

  return (
    <header
      className="topbar-blur sticky top-0 z-10 flex items-center justify-between px-5 border-b border-line"
      style={{ height: 52, flexShrink: 0 }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger — only visible on mobile */}
        <button
          onClick={toggleSidebar}
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-input text-ink-2 hover:text-ink hover:bg-bg-3 transition-colors"
          aria-label="Menu"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>

        <div className="text-ink-2" style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13 }}>
          MOS /{' '}
          <strong className="text-ink" style={{ fontWeight: 600 }}>
            {currentLabel}
          </strong>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span
          className="text-ink-2"
          style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
        >
          {dateStr}
        </span>
        <span className="flex items-center gap-1.5 text-ink-2" style={{ fontSize: 12 }}>
          <span
            className="inline-block w-1.5 h-1.5 rounded-full bg-ok pulse-dot"
          />
          sincronizado
        </span>
      </div>
    </header>
  )
}
