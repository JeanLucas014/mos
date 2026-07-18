import { useEffect, useRef } from 'react'
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
  noteId: string
  content: JSONContent
  userId: string | undefined
  onChange: (doc: JSONContent, plainText: string) => void
}

export function NoteEditor({ noteId, content, userId, onChange }: Props) {
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

  // Troca de conteúdo só quando a nota selecionada muda de fato (por id) —
  // nunca em resposta ao próprio onUpdate, senão o cursor pula a cada
  // tecla digitada (autosave que reflete de volta pro editor controlado).
  const prevNoteId = useRef(noteId)
  useEffect(() => {
    if (!editor) return
    if (noteId !== prevNoteId.current) {
      editor.commands.setContent(content, { emitUpdate: false })
      prevNoteId.current = noteId
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, editor])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="hidden lg:block border-b border-line" style={{ background: '#0a0a0a' }}>
        <EditorToolbar editor={editor} userId={userId} />
      </div>
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
      <div className="lg:hidden border-t border-line flex-shrink-0" style={{ background: '#0a0a0a' }}>
        <EditorToolbar editor={editor} userId={userId} compact />
      </div>
    </div>
  )
}
