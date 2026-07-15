import { useState } from 'react'
import { X } from 'lucide-react'
import { C, ENTRADA_CATS, GASTO_CATS } from '../constants'
import { labelStyle } from './InvoiceModal'

/* Add record modal */
export function MotoAddModal({
  date, onClose,
  onSave,
}: { date: string; onClose: () => void; onSave: (r: { revenue_date: string; kind: string; category: string; description: string; amount_cents: number; notes?: string }) => void }) {
  const [type,     setType]     = useState<'entrada' | 'gasto'>('entrada')
  const [category, setCategory] = useState(ENTRADA_CATS[0])
  const [desc,     setDesc]     = useState('')
  const [amount,   setAmount]   = useState('')
  const [notes,    setNotes]    = useState('')
  const [saving,   setSaving]   = useState(false)
  const [err,      setErr]      = useState('')

  const cats = type === 'entrada' ? ENTRADA_CATS : GASTO_CATS

  function handleTypeChange(t: 'entrada' | 'gasto') {
    setType(t)
    setCategory(t === 'entrada' ? ENTRADA_CATS[0] : GASTO_CATS[0])
  }

  async function handleSubmit() {
    if (!desc.trim()) { setErr('Preencha a descrição'); return }
    const cents = Math.round(parseFloat(amount.replace(',', '.')) * 100)
    if (isNaN(cents) || cents <= 0) { setErr('Valor inválido'); return }
    setErr(''); setSaving(true)
    onSave({ revenue_date: date, kind: type, category, description: desc.trim(), amount_cents: cents, notes: notes.trim() || undefined })
    setSaving(false)
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
  const fs: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', marginBottom: 10,
    background: 'var(--bg3)', border: '0.5px solid #2a2a2a',
    borderRadius: 8, padding: '10px 12px', color: C.tx, fontSize: 13, outline: 'none',
    fontFamily: 'Manrope, sans-serif',
  }

  const [y, m, d] = date.split('-')
  const dateLabel = `${d}/${m}/${y}`

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,.7)', display:'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent:'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:C.card, border:'1px solid '+C.border, borderRadius: isMobile ? '18px 18px 0 0' : 14, padding: isMobile ? '24px 20px 32px' : 24, width:'100%', maxWidth: isMobile ? '100%' : 420, maxHeight:'92dvh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <span style={{ fontSize:15, fontWeight:700, color:C.tx }}>Novo registro · {dateLabel}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:C.dm }}><X size={18} /></button>
        </div>

        {/* Type toggle */}
        <div style={{ display:'flex', gap:6, marginBottom:14 }}>
          {(['entrada', 'gasto'] as const).map(t => (
            <button key={t} onClick={() => handleTypeChange(t)} style={{ flex:1, padding:'9px', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', border: type===t ? 'none' : '1px solid '+C.border, background: type===t ? (t==='entrada' ? 'rgba(52,211,153,.2)' : 'rgba(248,113,113,.2)') : 'transparent', color: type===t ? (t==='entrada' ? C.g : C.r) : C.dm }}>
              {t === 'entrada' ? '↑ Entrada' : '↓ Gasto'}
            </button>
          ))}
        </div>

        <label style={labelStyle}>Categoria</label>
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...fs, cursor:'pointer', colorScheme: 'dark' }}>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <label style={labelStyle}>Descrição</label>
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder={type==='entrada' ? 'Ex: Corrida turno manhã' : 'Ex: Gasolina posto BR'} style={fs} autoFocus />

        <label style={labelStyle}>Valor (R$)</label>
        <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" style={fs} />

        <label style={labelStyle}>Observações (opcional)</label>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="..." style={{ ...fs, marginBottom:20 }} />

        {err && <div style={{ color:C.r, fontSize:12, marginBottom:10 }}>{err}</div>}

        <div style={{ display:'flex', gap:8 }}>
          <button onClick={handleSubmit} disabled={saving} style={{ flex:1, padding:'12px', borderRadius:10, background:'linear-gradient(135deg, #0EA5E9, #0284c7)', border:'none', color:'#fff', fontSize:13, fontWeight:600, cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1 }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button onClick={onClose} style={{ padding:'12px 20px', borderRadius:10, background:'rgba(255,255,255,.04)', border:'1px solid '+C.border, color:C.dm, fontSize:13, cursor:'pointer' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
