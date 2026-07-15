import { C } from '../constants'

/* ── Tile ────────────────────────────────────────────────────────── */
export function Tile({ label, value, color, sub }: {
  label: string; value: string; color: string; sub?: string
}) {
  return (
    <div style={{
      background: C.card, borderRadius: 12,
      padding: '16px 18px', border: '1px solid ' + C.border,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 14, right: 14,
        width: 7, height: 7, borderRadius: '50%', background: color,
      }} />
      <div style={{
        color: C.dm, fontSize: 10, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 15, fontWeight: 700, color,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ color: C.dm2, fontSize: 10, marginTop: 3 }}>{sub}</div>
      )}
    </div>
  )
}
