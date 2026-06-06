import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useUIStore } from '../../stores/useUIStore'

const GROUPS = [
  {
    label: 'Sistema',
    items: [
      {
        path: '/',
        label: 'Dashboard',
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
            <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
            <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
            <rect x="9" y="9" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        ),
        end: true,
      },
    ],
  },
  {
    label: 'Produtividade',
    items: [
      {
        path: '/agenda',
        label: 'Agenda',
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <rect x="1.8" y="3" width="12.4" height="11" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
            <path d="M1.8 6.2h12.4M5 1.8v2.4M11 1.8v2.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        path: '/tarefas',
        label: 'Tarefas & To-do',
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <path d="M2 4l1.6 1.6L6 3M2 11l1.6 1.6L6 10M9 4.3h5M9 11.3h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        path: '/projetos',
        label: 'Projetos',
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <path d="M1.8 4.5C1.8 3.7 2.4 3 3.2 3H6l1.5 1.6h5.3c.8 0 1.4.7 1.4 1.5v5.4c0 .8-.6 1.5-1.4 1.5H3.2c-.8 0-1.4-.7-1.4-1.5V4.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        path: '/metas',
        label: 'Metas',
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
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <path d="M2 2.5h1.6l1.4 8h6.5l1.3-5.5H4.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6" cy="13" r="1" fill="currentColor" />
            <circle cx="11.5" cy="13" r="1" fill="currentColor" />
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
        path: '/notas',
        label: 'Notas',
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <path d="M3 2.5h7l3 3V13a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 3 13V2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M5.5 7.5h5M5.5 10h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        path: '/biblioteca',
        label: 'Biblioteca',
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <path d="M2.5 3.5C2.5 3 2.9 2.5 8 2.5V13C2.9 13 2.5 12.5 2.5 12V3.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M13.5 3.5C13.5 3 13.1 2.5 8 2.5V13C13.1 13 13.5 12.5 13.5 12V3.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        path: '/estudos',
        label: 'Estudos',
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
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <rect x="2.5" y="7" width="11" height="7" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
            <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="8" cy="10.3" r="1" fill="currentColor" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Vida',
    items: [
      {
        path: '/corridas',
        label: 'Corridas',
        icon: (
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <path d="M2 13L5 8L8 10L14 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
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

export function Sidebar() {
  const { signOut } = useAuth()
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  function handleNavClick() {
    setSidebarOpen(false)
  }

  return (
    <aside
      className="flex flex-col h-full overflow-y-auto"
      style={{ fontFamily: 'Manrope, sans-serif' }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-2.5 px-[14px] h-[52px] flex-shrink-0 border-b border-line"
      >
        <div
          className="w-7 h-7 rounded-[6px] bg-brand flex items-center justify-center flex-shrink-0"
          style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 11, color: '#fff' }}
        >
          M
        </div>
        <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15, color: '#fff' }}>
          MOS
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            <h5
              className="px-2 mb-1 text-ink-3 uppercase tracking-[0.13em]"
              style={{ fontSize: 10, fontWeight: 600 }}
            >
              {group.label}
            </h5>
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={'end' in item ? item.end : false}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-2.5 px-[10px] py-2 rounded-input transition-colors duration-[180ms] cursor-pointer select-none',
                    isActive
                      ? 'nav-active bg-bg-3 text-ink'
                      : 'text-ink-2 hover:bg-bg-3 hover:text-ink',
                  ].join(' ')
                }
                style={{ fontSize: 13, fontWeight: 500, textDecoration: 'none' }}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-line flex-shrink-0">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-[10px] py-2 rounded-input text-ink-2 hover:bg-bg-3 hover:text-ink transition-colors duration-[180ms] w-full"
          style={{ fontSize: 13, fontWeight: 500 }}
        >
          <svg className="w-[15px] h-[15px]" viewBox="0 0 16 16" fill="none">
            <path d="M9 3L4 8L9 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 8h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Sair
        </button>
      </div>
    </aside>
  )
}
