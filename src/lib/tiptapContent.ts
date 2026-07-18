import type { JSONContent } from '@tiptap/react'

export function emptyDoc(): JSONContent {
  return { type: 'doc', content: [{ type: 'paragraph' }] }
}

/** Marca trechos **negrito**, `código` e _itálico_/*itálico* dentro de uma linha. */
function parseInline(text: string): JSONContent[] {
  const nodes: JSONContent[] = []
  const regex = /(\*\*(.+?)\*\*|`(.+?)`|_(.+?)_|\*(.+?)\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', text: text.slice(lastIndex, match.index) })
    }
    if (match[2] !== undefined) nodes.push({ type: 'text', text: match[2], marks: [{ type: 'bold' }] })
    else if (match[3] !== undefined) nodes.push({ type: 'text', text: match[3], marks: [{ type: 'code' }] })
    else if (match[4] !== undefined) nodes.push({ type: 'text', text: match[4], marks: [{ type: 'italic' }] })
    else if (match[5] !== undefined) nodes.push({ type: 'text', text: match[5], marks: [{ type: 'italic' }] })
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) nodes.push({ type: 'text', text: text.slice(lastIndex) })
  return nodes
}

function paragraph(text: string): JSONContent {
  const inline = parseInline(text)
  return { type: 'paragraph', content: inline.length ? inline : undefined }
}

type ListBuffer = { type: 'bulletList' | 'orderedList' | 'taskList'; items: JSONContent[] }

/**
 * Converte texto puro (o `body` legado da tabela notes) num documento
 * Tiptap/ProseMirror válido. Reconhece uma sintaxe markdown básica —
 * `- item` / `* item` (lista), `1. item` (lista numerada),
 * `- [ ] item` / `- [x] item` (checklist), `**negrito**`, `_itálico_`/
 * `*itálico*`, `` `código` `` — e cai pra parágrafo simples pra qualquer
 * linha que não bata com esses padrões. Nunca lança erro e nunca perde
 * texto: na pior hipótese, tudo vira parágrafos simples.
 */
export function textToTiptapDoc(body: string | null | undefined): JSONContent {
  const text = (body ?? '').replace(/\r\n/g, '\n')
  if (!text.trim()) return emptyDoc()

  const lines = text.split('\n')
  const content: JSONContent[] = []
  let listBuffer: ListBuffer | null = null

  function flushList() {
    if (listBuffer && listBuffer.items.length > 0) {
      content.push({ type: listBuffer.type, content: listBuffer.items })
    }
    listBuffer = null
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const bulletMatch = /^\s*[-*]\s+(.*)$/.exec(line)
    const orderedMatch = /^\s*\d+\.\s+(.*)$/.exec(line)
    const taskMatch = bulletMatch ? /^\[( |x|X)\]\s+(.*)$/.exec(bulletMatch[1]) : null

    if (taskMatch) {
      if (!listBuffer || listBuffer.type !== 'taskList') { flushList(); listBuffer = { type: 'taskList', items: [] } }
      listBuffer.items.push({
        type: 'taskItem',
        attrs: { checked: taskMatch[1].toLowerCase() === 'x' },
        content: [paragraph(taskMatch[2])],
      })
      continue
    }
    if (bulletMatch) {
      if (!listBuffer || listBuffer.type !== 'bulletList') { flushList(); listBuffer = { type: 'bulletList', items: [] } }
      listBuffer.items.push({ type: 'listItem', content: [paragraph(bulletMatch[1])] })
      continue
    }
    if (orderedMatch) {
      if (!listBuffer || listBuffer.type !== 'orderedList') { flushList(); listBuffer = { type: 'orderedList', items: [] } }
      listBuffer.items.push({ type: 'listItem', content: [paragraph(orderedMatch[1])] })
      continue
    }

    flushList()
    content.push(line.trim() ? paragraph(line) : { type: 'paragraph' })
  }
  flushList()

  return content.length > 0 ? { type: 'doc', content } : emptyDoc()
}

/** Extrai texto puro de um doc Tiptap — usado pra manter `notes.body`
 * (preview na lista, fallback de busca) sincronizado com o conteúdo rico. */
export function tiptapDocToText(doc: JSONContent | null | undefined): string {
  if (!doc) return ''
  const lines: string[] = []

  function walkBlock(node: JSONContent) {
    if (node.type === 'text') {
      lines[lines.length - 1] = (lines[lines.length - 1] ?? '') + (node.text ?? '')
      return
    }
    if (node.type === 'paragraph' || node.type === 'heading' || node.type === 'taskItem' || node.type === 'listItem' || node.type === 'blockquote') {
      lines.push('')
    }
    node.content?.forEach(walkBlock)
  }

  doc.content?.forEach(walkBlock)
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}
