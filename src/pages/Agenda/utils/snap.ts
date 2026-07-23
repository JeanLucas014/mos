/** Granularidade padrão de horário em todo o módulo Agenda — formulário,
 * clique-pra-criar na grade e drag-and-drop usam o mesmo valor. */
export const SNAP_MINUTES = 15

/** Arredonda um Date pro múltiplo de 15 minutos mais próximo. */
export function snapDateToQuarterHour(d: Date): Date {
  const ms = d.getTime()
  const stepMs = SNAP_MINUTES * 60 * 1000
  return new Date(Math.round(ms / stepMs) * stepMs)
}
