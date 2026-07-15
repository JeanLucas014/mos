import { Star } from 'lucide-react'

/* ── Star rating display ────────────────────────────────────────────── */
export function Stars({ value }: { value: number | null }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 1, lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={9} fill={i <= value ? '#fbbf24' : 'transparent'} color={i <= value ? '#fbbf24' : 'var(--text3)'} />
      ))}
    </div>
  )
}

/* ── Star rating interactive ────────────────────────────────────────── */
export function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(value === i ? 0 : i)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            lineHeight: 1,
            minWidth: 30,
            minHeight: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Star size={22} fill={i <= value ? '#fbbf24' : 'transparent'} color={i <= value ? '#fbbf24' : 'var(--text3)'} />
        </button>
      ))}
    </div>
  )
}
