import { useState } from 'react'
import { FolderPlus, FilePlus } from 'lucide-react'
import { collectDescendants, type EstudoItem, type useEstudosItens } from '../hooks/useEstudosItens'
import { ItemRow } from './ItemRow'
import { NameModal } from './NameModal'
import { MoveModal } from './MoveModal'

type Store = ReturnType<typeof useEstudosItens>

interface Props {
  items: EstudoItem[]
  cursoNome: string
  parentId: string | null
  store: Store
  onOpenItem: (item: EstudoItem) => void
  /** 'full' = painel principal da navegação em pilha. 'embedded' = seção
   * "Sub-páginas" dentro do editor de uma página — mais compacta, com
   * altura própria e sem crescer pra ocupar o resto da tela. */
  variant?: 'full' | 'embedded'
}

type ModalState =
  | { kind: 'create-pasta' }
  | { kind: 'create-pagina' }
  | { kind: 'rename'; item: EstudoItem }
  | { kind: 'move'; item: EstudoItem }
  | null

export function ItemsExplorer({ items, cursoNome, parentId, store, onOpenItem, variant = 'full' }: Props) {
  const [modal, setModal] = useState<ModalState>(null)

  const children = items.filter((it) => it.parent_id === parentId)

  function handleCreate(tipo: 'pasta' | 'pagina', nome: string) {
    store.addItem.mutate(
      { tipo, nome, parentId },
      {
        onSuccess: (novo) => {
          // Página nova abre direto no editor — pasta nova só aparece na lista.
          if (tipo === 'pagina') onOpenItem(novo)
        },
      },
    )
    setModal(null)
  }

  function handleRename(nome: string) {
    if (modal?.kind !== 'rename') return
    store.updateItem.mutate({ id: modal.item.id, nome })
    setModal(null)
  }

  function handleMove(destParentId: string | null) {
    if (modal?.kind !== 'move') return
    store.updateItem.mutate({ id: modal.item.id, parentId: destParentId })
    setModal(null)
  }

  function handleDelete(item: EstudoItem) {
    const count = collectDescendants(item.id, items).size - 1
    const msg = count > 0
      ? `Excluir "${item.nome}" e ${count} item${count !== 1 ? 's' : ''} dentro dela?`
      : `Excluir "${item.nome}"?`
    if (window.confirm(msg)) store.deleteItem.mutate(item.id)
  }

  const isEmbedded = variant === 'embedded'

  return (
    <div
      className={[
        'bg-bg-2 border border-line rounded-card flex flex-col',
        isEmbedded ? '' : 'flex-1 min-h-0',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line flex-shrink-0">
        <button
          onClick={() => setModal({ kind: 'create-pasta' })}
          className="flex items-center gap-1.5 text-xs text-ink-2 hover:text-white transition-colors border border-line rounded-input px-2.5 py-1.5"
        >
          <FolderPlus size={13} /> Pasta
        </button>
        <button
          onClick={() => setModal({ kind: 'create-pagina' })}
          className="flex items-center gap-1.5 text-xs text-ink-2 hover:text-white transition-colors border border-line rounded-input px-2.5 py-1.5"
        >
          <FilePlus size={13} /> Página
        </button>
      </div>

      <div className={isEmbedded ? 'overflow-y-auto' : 'flex-1 overflow-y-auto'} style={isEmbedded ? { maxHeight: 240 } : undefined}>
        {children.length === 0 ? (
          <p className="text-ink-3 text-sm text-center py-10">Vazio. Crie uma pasta ou página acima.</p>
        ) : (
          children.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onOpen={() => onOpenItem(item)}
              onRename={() => setModal({ kind: 'rename', item })}
              onMove={() => setModal({ kind: 'move', item })}
              onDelete={() => handleDelete(item)}
            />
          ))
        )}
      </div>

      {modal?.kind === 'create-pasta' && (
        <NameModal title="Nova pasta" confirmLabel="Criar" onSave={(n) => handleCreate('pasta', n)} onClose={() => setModal(null)} />
      )}
      {modal?.kind === 'create-pagina' && (
        <NameModal title="Nova página" confirmLabel="Criar" onSave={(n) => handleCreate('pagina', n)} onClose={() => setModal(null)} />
      )}
      {modal?.kind === 'rename' && (
        <NameModal title="Renomear" initialValue={modal.item.nome} confirmLabel="Salvar" onSave={handleRename} onClose={() => setModal(null)} />
      )}
      {modal?.kind === 'move' && (
        <MoveModal items={items} cursoNome={cursoNome} itemToMove={modal.item} onMove={handleMove} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
