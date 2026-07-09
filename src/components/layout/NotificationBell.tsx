import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppNotifications } from '../../hooks/useNotifications'

const TYPE_LABELS: Record<string, string> = {
  tarefa_vencida: 'Tarefa vencida',
  tarefa_hoje: 'Para hoje',
  evento_agenda: 'Agenda',
  conta_vencida: 'Financeiro',
  conta_hoje: 'Financeiro',
  habito: 'Hábitos',
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { data: notifications = [] } = useAppNotifications()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const unread = notifications.length

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          position: 'relative', background: 'none', border: 'none',
          cursor: 'pointer', padding: 6, color: 'var(--text3)',
          display: 'flex', alignItems: 'center',
        }}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            width: 8, height: 8, borderRadius: '50%',
            background: '#ef4444', border: '2px solid var(--bg)',
          }} />
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)',
          width: 320, background: 'var(--bg2)',
          border: '1px solid var(--border)', borderRadius: 14,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          zIndex: 100, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Notificações</span>
            {unread > 0 && (
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>{unread} nova(s)</span>
            )}
          </div>

          {/* Lista */}
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
                Nenhuma notificação
              </div>
            ) : (
              notifications.map(n => (
                <Link
                  key={n.id}
                  to={n.link}
                  onClick={() => setOpen(false)}
                  style={{ display: 'block', textDecoration: 'none' }}
                >
                  <div
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg3)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: n.type === 'tarefa_vencida' || n.type === 'conta_vencida'
                        ? '#ef4444' : '#f59e0b',
                      flexShrink: 0, marginTop: 5,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                        {TYPE_LABELS[n.type]}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.body}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <Link
              to="/configuracoes"
              onClick={() => setOpen(false)}
              style={{ fontSize: 11, color: 'var(--text3)', textDecoration: 'none' }}
            >
              Gerenciar notificações →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
