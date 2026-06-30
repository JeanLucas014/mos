import { useState, useEffect, useRef, useCallback } from 'react'
import { useNotes } from '../hooks/useNotes'
import { HelpButton } from '@/components/help/HelpButton'

export function NotesPage() {
  const { data: notes, isLoading, isError, error, addNote, updateNote, deleteNote } = useNotes()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [title, setTitle] = useState('')
  const [saved, setSaved] = useState(false)
  const [showList, setShowList] = useState(true) // mobile: toggle between list and editor
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selected = (notes ?? []).find((n) => n.id === selectedId)

  useEffect(() => {
    if (notes?.length && !selectedId) {
      setSelectedId(notes[0].id)
    }
  }, [notes, selectedId])

  useEffect(() => {
    if (selected) {
      setBody(selected.body)
      setTitle(selected.title)
    }
  }, [selected?.id])

  const saveNote = useCallback(
    (id: string, newTitle: string, newBody: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        updateNote.mutate(
          { id, title: newTitle, body: newBody },
          {
            onSuccess: () => {
              setSaved(true)
              setTimeout(() => setSaved(false), 1800)
            },
          },
        )
      }, 500)
    },
    [updateNote],
  )

  function handleBodyChange(value: string) {
    setBody(value)
    if (selectedId) saveNote(selectedId, title, value)
  }

  function handleTitleChange(value: string) {
    setTitle(value)
    if (selectedId) saveNote(selectedId, value, body)
  }

  function handleNewNote() {
    addNote.mutate(undefined, {
      onSuccess: (note) => {
        setSelectedId(note.id)
        setShowList(false) // open editor on mobile
      },
    })
  }

  function handleSelectNote(id: string) {
    setSelectedId(id)
    setShowList(false) // open editor on mobile
  }

  function handleDelete(id: string) {
    deleteNote.mutate(id)
    if (selectedId === id) {
      const remaining = (notes ?? []).filter((n) => n.id !== id)
      setSelectedId(remaining[0]?.id ?? null)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <h1
          className="text-2xl lg:text-[30px]"
          style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05 }}
        >
          Notas
        </h1>
        <HelpButton pageId="notas" />
      </div>
      <p className="text-ink-2 mt-1 text-sm">
        {isLoading ? 'Carregando...' : 'Bloco de notas com autosave.'}
      </p>

      {isError && (
        <p className="text-red-400 text-sm mt-3">Erro: {(error as Error).message}</p>
      )}

      <div
        className="bg-bg-2 border border-line rounded-card mt-5 flex flex-col lg:flex-row overflow-hidden"
        style={{ minHeight: 420 }}
      >
        {/* ── Sidebar (list) ── */}
        {/* Mobile: visible when showList=true; Desktop: always visible */}
        <div
          className={[
            'border-b lg:border-b-0 lg:border-r border-line flex flex-col flex-shrink-0',
            'lg:w-[220px]',
            showList ? 'flex' : 'hidden lg:flex',
          ].join(' ')}
        >
          <div className="flex items-center justify-between px-3 py-3 border-b border-line" style={{ minHeight: 48 }}>
            <span
              className="text-ink-2"
              style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: 12 }}
            >
              Notas
            </span>
            <button
              onClick={handleNewNote}
              disabled={addNote.isPending}
              className="text-brand hover:brightness-110 transition-colors w-8 h-8 flex items-center justify-center rounded-input hover:bg-bg-3"
              title="Nova nota"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-bg-3 rounded-input animate-pulse" />
                ))}
              </div>
            ) : (notes ?? []).length === 0 ? (
              <p className="text-ink-3 text-xs text-center py-6">Nenhuma nota.</p>
            ) : (
              <ul>
                {(notes ?? []).map((note) => (
                  <li
                    key={note.id}
                    className={[
                      'group flex items-center justify-between px-3 cursor-pointer transition-colors',
                      note.id === selectedId ? 'bg-bg-3' : 'hover:bg-bg-3',
                    ].join(' ')}
                    style={{ minHeight: 52 }}
                    onClick={() => handleSelectNote(note.id)}
                  >
                    <div className="min-w-0 flex-1 py-2">
                      <div className="text-sm text-ink truncate">{note.title || 'Sem título'}</div>
                      <div className="text-ink-3 truncate" style={{ fontSize: 10 }}>
                        {note.body?.slice(0, 40) || 'Vazio'}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(note.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 text-ink-3 hover:text-red-400 transition-all ml-2 text-base flex-shrink-0 w-8 h-8 flex items-center justify-center"
                      title="Excluir"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── Editor ── */}
        {/* Mobile: visible when showList=false; Desktop: always visible */}
        <div
          className={[
            'flex-1 flex flex-col',
            !showList ? 'flex' : 'hidden lg:flex',
          ].join(' ')}
        >
          {selected ? (
            <>
              <div className="flex items-center gap-2 px-4 border-b border-line" style={{ minHeight: 48 }}>
                {/* Back button — mobile only */}
                <button
                  onClick={() => setShowList(true)}
                  className="lg:hidden flex items-center justify-center w-8 h-8 -ml-1 text-ink-2 hover:text-ink transition-colors flex-shrink-0"
                  aria-label="Voltar para lista"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="bg-transparent text-ink font-semibold focus:outline-none flex-1 py-2"
                  style={{ fontFamily: 'Sora, sans-serif', fontSize: 14 }}
                  placeholder="Título da nota"
                />
                {saved && (
                  <span
                    className="text-brand flex-shrink-0"
                    style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    salvo
                  </span>
                )}
              </div>
              <textarea
                value={body}
                onChange={(e) => handleBodyChange(e.target.value)}
                className="flex-1 bg-bg resize-none p-4 text-ink focus:outline-none"
                style={{
                  fontFamily: 'JetBrains Mono, Manrope, sans-serif',
                  fontSize: 13,
                  lineHeight: 1.7,
                  minHeight: 200,
                }}
                placeholder="Comece a escrever..."
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-ink-3 text-sm p-6">
              {isLoading ? (
                'Carregando...'
              ) : (
                <>
                  <span>Selecione ou crie uma nota.</span>
                  {/* Show list button on mobile when no note selected */}
                  <button
                    onClick={() => setShowList(true)}
                    className="lg:hidden text-brand text-sm font-medium"
                  >
                    Ver notas
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
