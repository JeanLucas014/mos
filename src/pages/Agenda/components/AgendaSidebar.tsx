import { useState, useRef, useEffect } from 'react'
import { Plus, MoreVertical, Star } from 'lucide-react'
import type { Agenda } from '../types'

interface Props {
  agendas: Agenda[]
  visibleIds: Set<string>
  onToggleVisible: (id: string) => void
  onOpenCreate: () => void
  onOpenEdit: (agenda: Agenda) => void
  onSetDefault: (id: string) => void
  onOpenDelete: (agenda: Agenda) => void
  onClose: () => void
}

function AgendaMenu({
  agenda, onOpenEdit, onSetDefault, onOpenDelete, onCloseMenu,
}: {
  agenda: Agenda
  onOpenEdit: () => void
  onSetDefault: () => void
  onOpenDelete: () => void
  onCloseMenu: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onCloseMenu()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onCloseMenu])

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 z-10 rounded-lg border border-line overflow-hidden"
      style={{ background: 'var(--bg3)', minWidth: 170, boxShadow: '0 8px 24px rgba(0,0,0,.5)' }}
    >
      <button
        onClick={() => { onOpenEdit(); onCloseMenu() }}
        className="w-full text-left px-3 py-2 text-xs text-ink-2 hover:text-ink hover:bg-bg-3 transition-colors"
      >
        Renomear / mudar cor
      </button>
      {!agenda.eh_padrao && (
        <button
          onClick={() => { onSetDefault(); onCloseMenu() }}
          className="w-full text-left px-3 py-2 text-xs text-ink-2 hover:text-ink hover:bg-bg-3 transition-colors"
        >
          Definir como padrão
        </button>
      )}
      <button
        onClick={() => { if (!agenda.eh_padrao) { onOpenDelete(); onCloseMenu() } }}
        disabled={agenda.eh_padrao}
        title={agenda.eh_padrao ? 'Defina outra agenda como padrão antes de excluir esta' : undefined}
        className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-bg-3 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Excluir
      </button>
    </div>
  )
}

export function AgendaSidebar({
  agendas, visibleIds, onToggleVisible, onOpenCreate, onOpenEdit, onSetDefault, onOpenDelete, onClose,
}: Props) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-end sm:items-start sm:justify-end p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-[#111111] border border-[#1f1f1f] rounded-t-2xl sm:rounded-xl w-full sm:w-[280px] max-h-[80vh] overflow-y-auto sm:mt-14"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f]">
          <span className="text-sm font-semibold text-white font-[Sora]">Minhas agendas</span>
          <button onClick={onClose} className="text-ink-3 hover:text-white transition-colors text-lg leading-none">×</button>
        </div>

        <div className="p-2 space-y-0.5">
          {agendas.map(a => (
            <div key={a.id} className="relative flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-bg-3 transition-colors group">
              <input
                type="checkbox"
                checked={visibleIds.has(a.id)}
                onChange={() => onToggleVisible(a.id)}
                className="accent-brand shrink-0"
              />
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: a.cor }} />
              <span className="flex-1 text-sm text-ink truncate">{a.nome}</span>
              {a.eh_padrao && <Star size={11} className="text-brand shrink-0" fill="currentColor" />}
              <button
                onClick={() => setOpenMenuId(openMenuId === a.id ? null : a.id)}
                className="text-ink-3 hover:text-ink transition-colors shrink-0 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical size={14} />
              </button>
              {openMenuId === a.id && (
                <AgendaMenu
                  agenda={a}
                  onOpenEdit={() => onOpenEdit(a)}
                  onSetDefault={() => onSetDefault(a.id)}
                  onOpenDelete={() => onOpenDelete(a)}
                  onCloseMenu={() => setOpenMenuId(null)}
                />
              )}
            </div>
          ))}
        </div>

        <div className="p-2 border-t border-[#1f1f1f]">
          <button
            onClick={onOpenCreate}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-ink-2 hover:text-ink hover:bg-bg-3 transition-colors"
          >
            <Plus size={14} />
            Nova agenda
          </button>
        </div>
      </div>
    </div>
  )
}
