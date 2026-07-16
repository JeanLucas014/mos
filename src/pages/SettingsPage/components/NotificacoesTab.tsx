import { useState, useEffect } from 'react'
import { useNotificationPrefs } from '@/hooks/useNotifications'
import type { NotificationPrefs } from '@/hooks/useNotifications'
import { Toggle } from '@/components/ui/Toggle'

/* ══════════════════════════════════════════════════════════════════
   NOTIFICAÇÕES TAB
══════════════════════════════════════════════════════════════════ */
export function NotificacoesTab() {
  const { prefs, update } = useNotificationPrefs()
  const [local, setLocal] = useState<NotificationPrefs>(prefs)

  useEffect(() => { setLocal(prefs) }, [prefs])

  function toggle(key: keyof NotificationPrefs) {
    const next = { ...local, [key]: !local[key] }
    setLocal(next)
    update.mutate(next)
  }

  const items: { key: keyof NotificationPrefs; label: string; desc: string }[] = [
    { key: 'tarefas_vencidas', label: 'Tarefas vencidas',      desc: 'Tarefas com prazo já ultrapassado' },
    { key: 'tarefas_hoje',     label: 'Tarefas para hoje',     desc: 'Tarefas com prazo para o dia atual' },
    { key: 'eventos_agenda',   label: 'Eventos da agenda',     desc: 'Eventos que começam nas próximas 2 horas' },
    { key: 'contas_vencidas',  label: 'Contas vencidas',       desc: 'Pagamentos recorrentes em atraso' },
    { key: 'contas_hoje',      label: 'Contas vencem hoje',    desc: 'Pagamentos recorrentes com vencimento hoje' },
    { key: 'habitos_fim_dia',  label: 'Hábitos pendentes',     desc: 'Hábitos não marcados (exibido após 18h)' },
  ]

  return (
    <div className="space-y-2">
      <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
        Escolha quais alertas aparecem no sino de notificações.
      </p>
      {items.map(item => (
        <div
          key={item.key}
          className="flex items-center justify-between rounded-xl border border-line bg-bg-2 px-4 py-3"
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
              {item.label}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{item.desc}</div>
          </div>
          <Toggle on={local[item.key]} onClick={() => toggle(item.key)} />
        </div>
      ))}
    </div>
  )
}
