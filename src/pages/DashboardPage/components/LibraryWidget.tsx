import { BookOpen } from 'lucide-react'
import { useDashBooks } from '../../../hooks/useDashboard'
import { Sk, Bar, Widget, BigStat } from './shared'

/* ══════════════════════════════════════════════════════════════════
   WIDGET 9 — BIBLIOTECA
══════════════════════════════════════════════════════════════════ */
export function LibraryWidget() {
  const { data, isLoading } = useDashBooks()
  const books   = data ?? []
  const reading = books.filter((b) => b.status === 'lendo')
  const readCnt = books.filter((b) => b.status === 'lido').length
  const current = reading[0]

  return (
    <Widget icon={<BookOpen size={14} />} title="Biblioteca" to="/biblioteca">
      {isLoading ? (
        <div className="space-y-2"><Sk w="w-16" h="h-6" /><Sk /><Sk w="w-4/5" /></div>
      ) : (
        <>
          <BigStat value={readCnt} label="lidos" color="#34d399" />
          {current ? (
            <div className="mt-3 bg-bg rounded-xl px-3 py-2.5">
              <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>
                Lendo agora
              </div>
              <div className="text-ink text-xs font-semibold truncate mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
                {current.title}
              </div>
              {current.author && (
                <div className="text-ink-3 truncate mb-1.5" style={{ fontSize: 10 }}>{current.author}</div>
              )}
              {current.total_pages && current.pages_read ? (
                <>
                  <Bar pct={(current.pages_read / current.total_pages) * 100} color="var(--blue)" />
                  <div className="text-right mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--blue)' }}>
                    {current.pages_read}/{current.total_pages}p
                  </div>
                </>
              ) : current.progress ? (
                <>
                  <Bar pct={current.progress} color="var(--blue)" />
                  <div className="text-right mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--blue)' }}>
                    {current.progress}%
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <p className="text-ink-3 text-xs mt-2">
              {books.length === 0 ? 'Nenhum livro cadastrado.' : 'Nenhum livro em leitura.'}
            </p>
          )}
        </>
      )}
    </Widget>
  )
}
