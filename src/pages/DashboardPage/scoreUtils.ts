/* ══════════════════════════════════════════════════════════════════
   SCORE HELPERS
══════════════════════════════════════════════════════════════════ */
export function calcFinancasScore(receitas: number, despesas: number): number {
  if (receitas === 0) return 50
  const saldo = receitas - despesas
  if (saldo >= 0) return Math.min(95, 70 + Math.round((saldo / receitas) * 30))
  return Math.max(15, 60 - Math.round((Math.abs(saldo) / receitas) * 60))
}
export function calcSaudeScore(
  countWeek: number,
  weekGoal: number,
  lastWorkoutDate: string | null,
): number {
  const weekScore = Math.min(70, Math.round((countWeek / weekGoal) * 70))

  let consistencyScore = 0
  if (lastWorkoutDate) {
    const daysSince = Math.floor(
      (Date.now() - new Date(lastWorkoutDate).getTime()) / 86400000,
    )
    if (daysSince <= 2)      consistencyScore = 30
    else if (daysSince <= 4) consistencyScore = 15
    else if (daysSince <= 6) consistencyScore = 5
  }

  return Math.max(10, weekScore + consistencyScore)
}
export function calcTarefasScore(total: number, overdue: number): number {
  if (total === 0) return 85
  if (overdue === 0) return 90
  return Math.max(30, 90 - Math.round((overdue / total) * 80))
}
export function calcHabitosScore(doneToday: number, total: number): number {
  if (total === 0) return 50
  return Math.round((doneToday / total) * 100)
}
export function calcEstudosScore(activeStudies: number, readingBooks: number, avgProgress: number): number {
  if (activeStudies === 0 && readingBooks === 0) return 20
  return Math.min(95, Math.min(70, (activeStudies + readingBooks) * 20) + Math.round(avgProgress * 0.25))
}
export function calcMetasScore(goals: { progress: number }[]): number {
  if (!goals.length) return 50
  return Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length)
}
export function scoreColor(s: number): string {
  if (s >= 80) return '#22c55e'
  if (s >= 60) return '#f59e0b'
  return '#ef4444'
}
export function scoreLabel(s: number): string {
  if (s >= 80) return 'Excelente'
  if (s >= 60) return 'Bom'
  if (s >= 40) return 'Atencao'
  return 'Critico'
}
