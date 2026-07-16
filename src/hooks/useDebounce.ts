import { useState, useEffect } from 'react'

/** Retorna `value` com atraso de `delay`ms — útil para buscas/filtros que
 * disparam uma query a cada keystroke (evita uma chamada por tecla). */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
