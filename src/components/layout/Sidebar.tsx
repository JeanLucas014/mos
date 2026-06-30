import { NavLink, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useUIStore } from '../../stores/useUIStore'
import { useUserSettings } from '../../hooks/useUserSettings'

const GROUPS = [
  {
    label: 'Sistema',
    items: [
      {
        path: '/dashboard',
        label: 'Dashboard',
        moduleId: 'dashboard',
        end: false,
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
            <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
            <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
            <rect x="9" y="9" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Produtividade',
    items: [
      {
        path: '/agenda',
        label: 'Agenda',
        moduleId: 'agenda',
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <rect x="1.8" y="3" width="12.4" height="11" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
            <path d="M1.8 6.2h12.4M5 1.8v2.4M11 1.8v2.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        path: '/tarefas',
        label: 'Tarefas',
        moduleId: 'tarefas',
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <path d="M2 4l1.6 1.6L6 3M2 11l1.6 1.6L6 10M9 4.3h5M9 11.3h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        path: '/projetos',
        label: 'Projetos',
        moduleId: 'projetos',
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <path d="M1.8 4.5C1.8 3.7 2.4 3 3.2 3H6l1.5 1.6h5.3c.8 0 1.4.7 1.4 1.5v5.4c0 .8-.6 1.5-1.4 1.5H3.2c-.8 0-1.4-.7-1.4-1.5V4.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        path: '/metas',
        label: 'Metas',
        moduleId: 'metas',
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="8" cy="8" r=".4" fill="currentColor" stroke="currentColor" />
          </svg>
        ),
      },
      {
        path: '/habitos',
        label: 'Hábitos',
        moduleId: 'habitos',
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8 4.5V8L10.3 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        path: '/compras',
        label: 'Lista de compras',
        moduleId: 'compras',
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <path d="M2 2.5h1.6l1.4 8h6.5l1.3-5.5H4.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6" cy="13" r="1" fill="currentColor" />
            <circle cx="11.5" cy="13" r="1" fill="currentColor" />
          </svg>
        ),
      },
      {
        path: '/notas',
        label: 'Notas',
        moduleId: 'notas',
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <path d="M3 2.5h7l3 3V13a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 3 13V2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M5.5 7.5h5M5.5 10h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Finanças',
    items: [
      {
        path: '/financeiro',
        label: 'Financeiro',
        moduleId: 'financeiro',
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8 5v6M6.3 6.5h3a1.2 1.2 0 0 1 0 2.4H6.7a1.2 1.2 0 0 0 0 2.4h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        path: '/faturamento',
        label: 'Faturamento',
        moduleId: 'faturamento',
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <path d="M3.5 1.8h6L13 5v9.2H3.5V1.8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M6 8h4M6 10.5h4M6 5.5h1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Conhecimento',
    items: [
      {
        path: '/estudos',
        label: 'Estudos',
        moduleId: 'estudos',
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <path d="M8 2.2L14.5 5 8 7.8 1.5 5 8 2.2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M4 6.3v3.4c0 .9 1.8 1.8 4 1.8s4-.9 4-1.8V6.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        path: '/senhas',
        label: 'Senhas',
        moduleId: 'senhas',
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <rect x="2.5" y="7" width="11" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
            <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="8" cy="10.3" r="1" fill="currentColor" />
          </svg>
        ),
      },
      {
        path: '/sistemas',
        label: 'Sistemas',
        moduleId: 'sistemas',
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="2.5" width="13" height="9" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
            <path d="M5.5 13.5h5M8 11.5v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M4.5 6h2M4.5 8h7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Vida',
    items: [
      {
        path: '/esportes',
        label: 'Esportes',
        moduleId: 'esportes',
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Conexões',
    items: [
      {
        path: '/integracoes',
        label: 'Integrações',
        moduleId: 'integracoes',
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <circle cx="4" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="12" cy="4" r="2.2" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.3" />
            <path d="M5.9 7L10 4.8M5.9 9L10 11.2" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        ),
      },
    ],
  },
]

const NAV_LINK_CLASS = (isActive: boolean, c: boolean) =>
  [
    'flex items-center rounded-input transition-colors duration-[180ms] cursor-pointer select-none',
    c ? 'justify-center px-0 py-2 w-full' : 'gap-2.5 px-[10px] py-2',
    isActive ? 'nav-active bg-bg-3 text-ink' : 'text-ink-2 hover:bg-bg-3 hover:text-ink',
  ].join(' ')

export function Sidebar() {
  const { signOut } = useAuth()
  const setSidebarOpen         = useUIStore((s) => s.setSidebarOpen)
  const sidebarCollapsed       = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebarCollapsed = useUIStore((s) => s.toggleSidebarCollapsed)
  const navigate = useNavigate()
  const { data: settings } = useUserSettings()
  const enabledModules = settings?.enabled_modules ?? GROUPS.flatMap(g => g.items.map(i => i.moduleId))

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  function handleNavClick() {
    setSidebarOpen(false)
  }

  const c = sidebarCollapsed

  return (
    <aside
      className="flex flex-col h-full overflow-y-auto overflow-x-hidden"
      style={{ fontFamily: 'Manrope, sans-serif' }}
    >
      {/* Brand */}
      <div className={['flex items-center h-[52px] flex-shrink-0 border-b border-line', c ? 'justify-center px-2' : 'gap-2.5 px-[14px]'].join(' ')}>
        {!c && <img src="/logo.png" alt="MOS" className="h-8 w-auto" />}
        {c  && <img src="/logo.png" alt="MOS" className="h-6 w-auto" />}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {GROUPS.map((group) => {
          const visibleItems = group.items.filter(
            item => enabledModules.includes(item.moduleId),
          )
          if (visibleItems.length === 0) return null
          return (
            <div key={group.label} className="mb-4">
              {!c && (
                <h5
                  className="px-2 mb-1 text-ink-3 uppercase tracking-[0.13em]"
                  style={{ fontSize: 10, fontWeight: 600 }}
                >
                  {group.label}
                </h5>
              )}
              {c && <div className="mb-1 border-t border-line mx-1" />}
              {visibleItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.path}
                  end={'end' in item ? (item as any).end : false}
                  onClick={handleNavClick}
                  title={c ? item.label : undefined}
                  className={({ isActive }) => NAV_LINK_CLASS(isActive, c)}
                  style={{ fontSize: 13, fontWeight: 500, textDecoration: 'none' }}
                >
                  {item.icon}
                  {!c && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={['border-t border-line flex-shrink-0 space-y-0.5', c ? 'px-1 py-2' : 'px-2 py-3'].join(' ')}>
        <NavLink
          to="/configuracoes"
          onClick={handleNavClick}
          title={c ? 'Configurações' : undefined}
          className={({ isActive }) => NAV_LINK_CLASS(isActive, c)}
          style={{ fontSize: 13, fontWeight: 500, textDecoration: 'none' }}
        >
          <Settings size={15} className="shrink-0" />
          {!c && <span>Configurações</span>}
        </NavLink>

        <button
          onClick={handleSignOut}
          title={c ? 'Sair' : undefined}
          className={['flex items-center rounded-input text-ink-2 hover:bg-bg-3 hover:text-ink transition-colors duration-[180ms] w-full', c ? 'justify-center px-0 py-2' : 'gap-2.5 px-[10px] py-2'].join(' ')}
          style={{ fontSize: 13, fontWeight: 500 }}
        >
          <svg className="w-[15px] h-[15px] shrink-0" viewBox="0 0 16 16" fill="none">
            <path d="M9 3L4 8L9 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 8h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          {!c && <span>Sair</span>}
        </button>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={toggleSidebarCollapsed}
          title={c ? 'Expandir menu' : 'Colapsar menu'}
          className={['hidden lg:flex items-center rounded-input text-[#555] hover:text-white hover:bg-bg-3 transition-colors w-full', c ? 'justify-center px-0 py-2' : 'gap-2.5 px-[10px] py-2'].join(' ')}
        >
          {c ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!c && <span style={{ fontSize: 13, fontWeight: 500 }}>Colapsar</span>}
        </button>
      </div>
    </aside>
  )
}
