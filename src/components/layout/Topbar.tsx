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
  const dateStr = format(new Date(), 'EEE dd MMM', { locale: ptBR })

  return (
    <header
      className="topbar-blur sticky top-0 z-10 flex items-center border-b border-line"
      style={{ height: 52, flexShrink: 0 }}
    >
      {/* ── Mobile layout ── */}
      <div className="flex lg:hidden items-center w-full px-4">
        {/* Hamburger */}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-10 h-10 -ml-1 rounded-input text-ink-2 hover:text-ink hover:bg-bg-3 transition-colors"
          aria-label="Menu"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Logo centrada */}
        <img
          src="/logo.png"
          alt="MOS"
          className="h-7 w-auto absolute left-1/2 -translate-x-1/2"
        />
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden lg:flex items-center justify-between w-full px-5">
        <div className="text-ink-2" style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13 }}>
          MOS /{' '}
          <strong className="text-ink" style={{ fontWeight: 600 }}>
            {currentLabel}
          </strong>
        </div>

        <div className="flex items-center gap-4">
          <span
            className="text-ink-2"
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
          >
            {dateStr}
          </span>
          <span className="flex items-center gap-1.5 text-ink-2" style={{ fontSize: 12 }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-ok pulse-dot" />
            sincronizado
          </span>
        </div>
      </div>
    </header>
  )
}
