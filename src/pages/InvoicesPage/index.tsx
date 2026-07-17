import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Invoice } from './types'
import { C } from './constants'
import { MotoTab } from './components/MotoTab'
import { FaturasTab } from './components/FaturasTab'
/* ── Main page ───────────────────────────────────────────────────── */
export function InvoicesPage() {
  const [modal, setModal] = useState<Partial<Invoice> | null | false>(false)
  // false = closed, null = new invoice, Invoice partial = editing

  const [tab, setTab] = useState<'faturas' | 'moto'>('faturas')

  return (
    <div style={{ fontFamily: 'Manrope, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16, flexWrap: 'wrap', gap: 12,
      }}>
        <h1 style={{
          fontFamily: 'Sora, sans-serif', fontWeight: 800,
          fontSize: 26, letterSpacing: '-0.03em', margin: 0,
        }}>
          Faturamento
        </h1>
        {tab === 'faturas' && (
          <button
            onClick={() => setModal(null)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '9px 16px',
              background: 'linear-gradient(135deg, var(--blue), #0284c7)',
              border: 'none', borderRadius: 10,
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={15} />
            Nova fatura
          </button>
        )}
      </div>

      {/* ── Tab switcher ── */}
      <div style={{ display:'flex', gap:2, marginBottom:22, background:C.card, borderRadius:10, border:'1px solid '+C.border, padding:4, width:'fit-content' }}>
        {(['faturas','moto'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:'7px 18px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:500, background: tab===t ? C.card2 : 'transparent', border: tab===t ? '1px solid rgba(255,255,255,.08)' : '1px solid transparent', color: tab===t ? C.tx : C.dm, transition:'all .15s' }}>
            {t === 'faturas' ? 'Faturas' : 'Moto'}
          </button>
        ))}
      </div>

      {/* ── Moto tab ── */}
      {tab === 'moto' && <MotoTab />}

      {/* ── Faturas content ── */}
      {tab === 'faturas' && <FaturasTab modal={modal} setModal={setModal} />}
    </div>
  )
}

