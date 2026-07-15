import { FileText } from 'lucide-react'
import { useDashNotes } from '../../../hooks/useDashboard'
import { Sk, Widget, BigStat } from './shared'

/* ══════════════════════════════════════════════════════════════════
   WIDGET 8 — NOTAS
══════════════════════════════════════════════════════════════════ */
export function NotesWidget() {
  const { data, isLoading } = useDashNotes()
  const notes  = data ?? []
  const latest = notes[0]

  return (
    <Widget icon={<FileText size={14} />} title="Notas" to="/notas">
      {isLoading ? (
        <div className="space-y-2"><Sk w="w-12" h="h-6" /><Sk w="w-full" /></div>
      ) : (
        <>
          <BigStat value={notes.length} label={`nota${notes.length !== 1 ? 's' : ''} salva${notes.length !== 1 ? 's' : ''}`} color="#a78bfa" />
          {latest ? (
            <div className="mt-3 bg-bg rounded-xl px-3 py-2">
              <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>
                Mais recente
              </div>
              <div className="text-ink-2 text-xs line-clamp-2" style={{ lineHeight: 1.5 }}>
                {latest.title || 'Sem titulo'}
              </div>
            </div>
          ) : (
            <p className="text-ink-3 text-xs mt-2">Nenhuma nota ainda.</p>
          )}
        </>
      )}
    </Widget>
  )
}
