import { useCallback, useRef, useState } from 'react'
import type { JSONContent } from '@tiptap/react'
import { ArrowLeft } from 'lucide-react'
import { NoteEditor } from '@/pages/Notas/components/NoteEditor'
import { emptyDoc } from '@/lib/tiptapContent'
import type { EstudoItem } from '../hooks/useEstudosItens'
import { AttachmentsPanel } from './AttachmentsPanel'

interface Props {
  item: EstudoItem
  userId: string | undefined
  onRename: (nome: string) => void
  onSaveConteudo: (id: string, conteudo: JSONContent) => void
  onBack: () => void
}

export function PageEditor({ item, userId, onRename, onSaveConteudo, onBack }: Props) {
  const [title, setTitle] = useState(item.nome)
  const [saved, setSaved] = useState(false)
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const content: JSONContent = (item.conteudo as unknown as JSONContent) ?? emptyDoc()

  function flashSaved() {
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const debouncedRename = useCallback(
    (value: string) => {
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current)
      titleDebounceRef.current = setTimeout(() => {
        onRename(value)
        flashSaved()
      }, 500)
    },
    [onRename],
  )

  const debouncedSaveConteudo = useCallback(
    (doc: JSONContent) => {
      if (contentDebounceRef.current) clearTimeout(contentDebounceRef.current)
      contentDebounceRef.current = setTimeout(() => {
        onSaveConteudo(item.id, doc)
        flashSaved()
      }, 500)
    },
    [item.id, onSaveConteudo],
  )

  function handleTitleChange(value: string) {
    setTitle(value)
    debouncedRename(value)
  }

  function handleContentChange(doc: JSONContent) {
    debouncedSaveConteudo(doc)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
      <div className="flex-1 flex flex-col min-w-0 bg-bg-2 border border-line rounded-card overflow-hidden" style={{ minHeight: 420 }}>
        <div className="flex items-center gap-2 px-4 border-b border-line flex-shrink-0" style={{ minHeight: 48 }}>
          <button
            onClick={onBack}
            className="lg:hidden flex items-center justify-center w-8 h-8 -ml-1 text-ink-2 hover:text-ink transition-colors flex-shrink-0"
            aria-label="Voltar"
          >
            <ArrowLeft size={16} />
          </button>
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="bg-transparent text-ink font-semibold focus:outline-none flex-1 py-2"
            style={{ fontFamily: 'Sora, sans-serif', fontSize: 14 }}
            placeholder="Título da página"
          />
          {saved && (
            <span className="text-brand flex-shrink-0" style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
              salvo
            </span>
          )}
        </div>
        <NoteEditor key={item.id} content={content} userId={userId} onChange={handleContentChange} />
      </div>

      <div className="lg:w-[280px] flex-shrink-0">
        <AttachmentsPanel itemId={item.id} userId={userId} />
      </div>
    </div>
  )
}
