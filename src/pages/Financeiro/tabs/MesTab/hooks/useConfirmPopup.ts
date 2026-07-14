import { useState, useEffect, type MouseEvent } from 'react'

/**
 * Estado de um popup de confirmação posicionado no clique (posição em tela
 * + fecha ao clicar fora). Usado por ItemRow/MobileItemRow para o popup de
 * "Confirmar pagamento?".
 */
export function useConfirmPopup() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmPos, setConfirmPos]   = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!showConfirm) return
    function handle() { setShowConfirm(false) }
    document.addEventListener('click', handle)
    return () => document.removeEventListener('click', handle)
  }, [showConfirm])

  function open(e: MouseEvent) {
    setConfirmPos({ x: e.clientX, y: e.clientY })
    setShowConfirm(true)
  }

  function close() {
    setShowConfirm(false)
  }

  return { showConfirm, confirmPos, open, close }
}
