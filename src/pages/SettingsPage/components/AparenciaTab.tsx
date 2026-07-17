import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeOption } from '@/hooks/useTheme'

/* ══════════════════════════════════════════════════════════════════
   APARÊNCIA TAB
══════════════════════════════════════════════════════════════════ */
export function AparenciaTab() {
  const { theme, setTheme } = useTheme()

  const options: { value: ThemeOption; label: string; desc: string; Icon: React.ElementType }[] = [
    { value: 'system', label: 'Automático', desc: 'Segue a preferência do seu sistema operacional', Icon: Monitor },
    { value: 'dark',   label: 'Escuro',     desc: 'Interface escura sempre ativa',                  Icon: Moon    },
    { value: 'light',  label: 'Claro',      desc: 'Interface clara sempre ativa',                   Icon: Sun     },
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
    </div>
  )
}
