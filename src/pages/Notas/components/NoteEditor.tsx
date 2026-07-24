import { useRef } from 'react'
import { useEditor, EditorContent, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorToolbar } from './EditorToolbar'
import { uploadNoteImage } from '../lib/uploadNoteImage'
import { tiptapDocToText } from '@/lib/tiptapContent'
import './noteEditor.css'

interface Props {
  content: JSONContent
  userId: string | undefined
  onChange: (doc: JSONContent, plainText: string) => void
}

// O pai monta este componente com `key={noteId}` — trocar de nota sempre
// desmonta/remonta o editor do zero, então `content` só precisa servir
// como valor inicial do Tiptap; não há necessidade (nem risco de race)
// de sincronizar conteúdo depois do mount.
export function NoteEditor({ content, userId, onChange }: Props) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false, heading: { levels: [1, 2, 3] } }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({ inline: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: 'Comece a escrever...' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      onChangeRef.current(json, tiptapDocToText(json))
    },
    editorProps: {
      attributes: { class: 'note-prosemirror' },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items
        if (!items || !userId) return false
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile()
            if (!file) continue
            event.preventDefault()
            uploadNoteImage(file, userId)
              .then((url) => {
                const { schema } = view.state
                const node = schema.nodes.image.create({ src: url })
                view.dispatch(view.state.tr.replaceSelectionWith(node))
              })
              .catch((err) => console.error('[NoteEditor] falha ao colar imagem', err))
            return true
          }
        }
        return false
      },
    },
  })

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="hidden lg:block border-b border-line flex-shrink-0" style={{ background: '#0a0a0a' }}>
        <EditorToolbar editor={editor} userId={userId} />
      </div>
      <div className="lg:hidden border-b border-line flex-shrink-0" style={{ background: '#0a0a0a' }}>
        <EditorToolbar editor={editor} userId={userId} compact />
      </div>
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
