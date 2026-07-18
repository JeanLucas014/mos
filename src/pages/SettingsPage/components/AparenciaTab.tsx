import { Monitor, Moon, Sun, Calendar } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeOption } from '@/hooks/useTheme'
import { useWeekStart } from '@/hooks/useWeekStart'
import type { WeekStartOption } from '@/hooks/useWeekStart'

/* ══════════════════════════════════════════════════════════════════
   APARÊNCIA TAB
══════════════════════════════════════════════════════════════════ */
export function AparenciaTab() {
  const { theme, setTheme } = useTheme()
  const { weekStart, setWeekStart } = useWeekStart()

  const options: { value: ThemeOption; label: string; desc: string; Icon: React.ElementType }[] = [
    { value: 'system', label: 'Automático', desc: 'Segue a preferência do seu sistema operacional', Icon: Monitor },
    { value: 'dark',   label: 'Escuro',     desc: 'Interface escura sempre ativa',                  Icon: Moon    },
    { value: 'light',  label: 'Claro',      desc: 'Interface clara sempre ativa',                   Icon: Sun     },
  ]

  const weekStartOptions: { value: WeekStartOption; label: string }[] = [
    { value: 'monday', label: 'Segunda-feira' },
    { value: 'sunday',  label: 'Domingo' },
  ]

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
        Escolha como o MOS deve aparecer para você.
      </p>
      <div className="space-y-2">
        {options.map(opt => {
          const active = theme === opt.value
          const { Icon } = opt
          return (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className="w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors"
              style={{
                background: active ? 'var(--bg2)' : 'transparent',
                borderColor: active ? 'var(--blue)' : 'var(--border)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Icon size={16} color={active ? 'var(--blue)' : 'var(--text3)'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: active ? 'var(--text)' : 'var(--text3)' }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>
                  {opt.desc}
                </div>
              </div>
              {active && (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--blue)', flexShrink: 0,
                }} />
              )}
            </button>
          )
        })}
      </div>

      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 28, marginBottom: 8 }}>
        Início da semana
      </p>
      <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
        Define em qual dia a semana começa na Agenda.
      </p>
      <div className="space-y-2">
        {weekStartOptions.map(opt => {
          const active = weekStart === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => setWeekStart(opt.value)}
              className="w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors"
              style={{
                background: active ? 'var(--bg2)' : 'transparent',
                borderColor: active ? 'var(--blue)' : 'var(--border)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Calendar size={16} color={active ? 'var(--blue)' : 'var(--text3)'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: active ? 'var(--text)' : 'var(--text3)' }}>
                  {opt.label}
                </div>
              </div>
              {active && (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--blue)', flexShrink: 0,
                }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
