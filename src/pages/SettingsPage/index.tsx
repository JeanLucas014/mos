import { useState } from 'react'
import { PerfilTab } from './components/PerfilTab'
import { SegurancaTab } from './components/SegurancaTab'
import { ModulosTab } from './components/ModulosTab'
import { NotificacoesTab } from './components/NotificacoesTab'
import { AparenciaTab } from './components/AparenciaTab'
import { InstalarAppTab } from './components/InstalarAppTab'
import { SuporteTab } from './components/SuporteTab'

/* ══════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════ */
export default function SettingsPage() {
  const [tab, setTab] = useState<'perfil' | 'seguranca' | 'modulos' | 'notificacoes' | 'aparencia' | 'instalar' | 'suporte'>('perfil')

  const TABS = [
    { id: 'perfil',        label: 'Perfil' },
    { id: 'seguranca',     label: 'Segurança' },
    { id: 'modulos',       label: 'Módulos' },
    { id: 'notificacoes',  label: 'Notificações' },
    { id: 'aparencia',     label: 'Aparência' },
    { id: 'instalar',      label: 'Instalar app' },
    { id: 'suporte',       label: 'Suporte' },
  ] as const

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl lg:text-[30px]" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
          Configurações
        </h1>
        <p className="text-ink-2 mt-1 text-sm">Perfil, módulos e preferências.</p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-line mb-6">
        <div
          className="flex gap-0"
          style={{ overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 14px',
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${tab === t.id ? '#0ea5e9' : 'transparent'}`,
                color: tab === t.id ? '#0ea5e9' : 'var(--text3)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── PERFIL tab ── */}
      {tab === 'perfil' && <PerfilTab />}

      {/* ── SEGURANÇA tab ── */}
      {tab === 'seguranca' && <SegurancaTab />}

      {/* ── MÓDULOS tab ── */}
      {tab === 'modulos' && <ModulosTab />}

      {/* ── NOTIFICAÇÕES tab ── */}
      {tab === 'notificacoes' && <NotificacoesTab />}

      {/* ── APARÊNCIA tab ── */}
      {tab === 'aparencia' && <AparenciaTab />}

      {/* ── SUPORTE tab ── */}
      {tab === 'suporte' && <SuporteTab />}

      {/* ── INSTALAR APP tab ── */}
      {tab === 'instalar' && <InstalarAppTab />}
    </div>
  )
}
