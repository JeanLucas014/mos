import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search } from 'lucide-react'
import { useUIStore } from '../../stores/useUIStore'

const VIEW_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/agenda': 'Agenda',
  '/tarefas': 'Tarefas',
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
  '/esportes': 'Esportes',
  '/integracoes': 'Integrações',
  '/perfil': 'Perfil',
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

        {/* Botão busca mobile */}
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
          className="ml-auto flex items-center justify-center w-10 h-10 -mr-1 rounded-input text-ink-2 hover:text-ink hover:bg-bg-3 transition-colors"
          aria-label="Buscar"
        >
          <Search size={18} />
        </button>
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
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
            className="flex items-center gap-2 text-xs text-[#555] hover:text-white border border-[#1f1f1f] rounded-lg px-3 py-1.5 transition-colors hover:border-[#0EA5E9]/40 bg-[#111111]"
          >
            <Search size={13} />
            <span className="hidden sm:inline">Buscar</span>
            <kbd className="hidden md:inline text-[10px] border border-[#2a2a2a] rounded px-1">⌘K</kbd>
          </button>
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
