import { useState, useEffect } from 'react'

export function useHelpGuide(pageId: string) {
  const storageKey = `mos-help-seen-${pageId}`
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem(storageKey)
    if (!seen) setOpen(true)
  }, [storageKey])

  function close() {
    localStorage.setItem(storageKey, 'true')
    setOpen(false)
  }

  function reopen() {
    setOpen(true)
  }

  return { open, close, reopen }
}
