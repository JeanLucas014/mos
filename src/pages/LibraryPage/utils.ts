import { GRADIENTS } from './constants'

export function hashGradient(title: string | null | undefined) {
  if (!title) return GRADIENTS[0]
  let h = 0
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}
