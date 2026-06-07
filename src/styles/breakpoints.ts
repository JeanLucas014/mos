/** Breakpoints padrão do MOS — use sempre mobile-first (escreva o mobile, depois md: e lg:) */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
} as const

export type Breakpoint = keyof typeof breakpoints
