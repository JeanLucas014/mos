import { useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Bold, Italic, Strikethrough, Code, Quote,
  List, ListOrdered, ListChecks, TableIcon, LinkIcon, ImageIcon,
} from 'lucide-react'
import { uploadNoteImage } from '../lib/uploadNoteImage'

interface Props {
  editor: Editor | null
  userId: string | undefined
  /** Compacto: usado na barra fixa do rodapé no mobile — ícones menores,
   * sem o dropdown de título (mobile prioriza espaço horizontal). */
  compact?: boolean
}

function ToolbarButton({
  active, onClick, title, children,
}: {
  active?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // não tira o foco do editor
      onClick={onClick}
      title={title}
      aria-label={title}
      className="flex items-center justify-center rounded-input transition-colors flex-shrink-0"
      style={{
        width: 30, height: 30,
        color: active ? '#0EA5E9' : 'var(--text2)',
        background: active ? 'rgba(14,165,233,.14)' : 'transparent',
      }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 18, background: '#1f1f1f', flexShrink: 0, margin: '0 2px' }} />
}

export function EditorToolbar({ editor, userId, compact }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkValue, setLinkValue] = useState('')

  if (!editor) return null

  function openLinkPopover() {
    const prevUrl = editor!.getAttributes('link').href as string | undefined
    setLinkValue(prevUrl ?? '')
    setLinkOpen(true)
  }

  function applyLink() {
    const url = linkValue.trim()
    if (!url) {
      editor!.chain().focus().unsetLink().run()
    } else {
      editor!.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
    setLinkOpen(false)
  }

  async function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !userId) return
    try {
      const url = await uploadNoteImage(file, userId)
      editor!.chain().focus().setImage({ src: url }).run()
    } catch (err) {
      console.error('[EditorToolbar] falha ao enviar imagem', err)
    }
  }

  const iconSize = compact ? 15 : 14

  return (
    <div
      className="flex items-center gap-0.5 overflow-x-auto"
      style={{ padding: compact ? '6px 8px' : '6px 10px', WebkitOverflowScrolling: 'touch' }}
    >
      {!compact && (
        <>
          <select
            value={
              editor.isActive('heading', { level: 1 }) ? 'h1' :
              editor.isActive('heading', { level: 2 }) ? 'h2' :
              editor.isActive('heading', { level: 3 }) ? 'h3' : 'p'
            }
            onChange={(e) => {
              const v = e.target.value
              const chain = editor.chain().focus()
              if (v === 'p') chain.setParagraph().run()
              else chain.toggleHeading({ level: Number(v.slice(1)) as 1 | 2 | 3 }).run()
            }}
            className="bg-transparent text-ink-2 text-xs rounded-input outline-none flex-shrink-0"
            style={{ height: 28, border: '1px solid #1f1f1f', padding: '0 4px' }}
          >
            <option value="p">Texto</option>
            <option value="h1">Título 1</option>
            <option value="h2">Título 2</option>
            <option value="h3">Título 3</option>
          </select>
          <Divider />
        </>
      )}

      <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrito">
        <Bold size={iconSize} />
      </ToolbarButton>
      <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Itálico">
        <Italic size={iconSize} />
      </ToolbarButton>
      <ToolbarButton active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Riscado">
        <Strikethrough size={iconSize} />
      </ToolbarButton>
      <ToolbarButton active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="Código">
        <Code size={iconSize} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Citação">
        <Quote size={iconSize} />
      </ToolbarButton>
      <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista com marcadores">
        <List size={iconSize} />
      </ToolbarButton>
      <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
        <ListOrdered size={iconSize} />
      </ToolbarButton>
      <ToolbarButton active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} title="Checklist">
        <ListChecks size={iconSize} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Inserir tabela"
      >
        <TableIcon size={iconSize} />
      </ToolbarButton>
      <div style={{ position: 'relative' }}>
        <ToolbarButton active={editor.isActive('link')} onClick={openLinkPopover} title="Link">
          <LinkIcon size={iconSize} />
        </ToolbarButton>
        {linkOpen && (
          <div
            className="flex items-center gap-1.5"
            style={{
              position: 'absolute', top: 'calc(100% + 6px)',
              left: 0, zIndex: 40,
              background: '#111111', border: '1px solid #1f1f1f', borderRadius: 10,
              padding: 6, boxShadow: '0 8px 24px rgba(0,0,0,.5)',
            }}
          >
            <input
              autoFocus
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyLink()
                if (e.key === 'Escape') setLinkOpen(false)
              }}
              placeholder="https://..."
              className="bg-bg border border-line rounded-input text-ink text-xs px-2 outline-none focus:border-brand"
              style={{ width: 200, height: 28 }}
            />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={applyLink}
              className="text-brand text-xs font-semibold flex-shrink-0"
              style={{ padding: '0 6px' }}
            >
              OK
            </button>
          </div>
        )}
      </div>
      <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Inserir imagem">
        <ImageIcon size={iconSize} />
      </ToolbarButton>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChosen} />
    </div>
  )
}
