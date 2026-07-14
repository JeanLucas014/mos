import { useState } from 'react'

/**
 * Estado da edição inline do valor "diário" numa linha (ItemRow/MobileItemRow).
 * `onSave` faz a gravação real (Supabase + reload); este hook só cuida do
 * estado local de edição e da validação antes de chamar `onSave`.
 */
export function useDiarioInlineEdit(onSave: (id: string, valor: number) => Promise<void>) {
  const [editingDiarioId, setEditingDiarioId] = useState<string | null>(null)
  const [editingValue, setEditingValue]       = useState('')

  function startEdit(id: string, currentVal: number) {
    setEditingDiarioId(id)
    setEditingValue(String(currentVal))
  }

  async function save(id: string) {
    const valor = parseFloat(editingValue.replace(',', '.'))
    if (isNaN(valor) || valor < 0) { setEditingDiarioId(null); return }
    await onSave(id, valor)
    setEditingDiarioId(null)
  }

  return {
    editingDiarioId,
    editingValue,
    startEdit,
    changeValue: setEditingValue,
    save,
  }
}
