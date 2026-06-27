import type { CalendarEvent } from '../types'

function parseRrule(rule: string): Record<string, string> {
  const map: Record<string, string> = {}
  rule.split(';').forEach(part => {
    const idx = part.indexOf('=')
    if (idx > 0) map[part.slice(0, idx)] = part.slice(idx + 1)
  })
  return map
}

export function expandRecurringEvents(
  events: CalendarEvent[],
  viewStart: Date,
  viewEnd: Date
): CalendarEvent[] {
  const result: CalendarEvent[] = []

  for (const event of events) {
    if (!event.recurrence_rule) {
      result.push(event)
      continue
    }

    const rule     = parseRrule(event.recurrence_rule)
    const freq     = rule['FREQ'] ?? 'DAILY'
    const interval = parseInt(rule['INTERVAL'] ?? '1')
    const byDay    = rule['BYDAY'] ? rule['BYDAY'].split(',') : []
    const until    = rule['UNTIL']
      ? new Date(rule['UNTIL'].replace(/^(\d{4})(\d{2})(\d{2}).*/, '$1-$2-$3'))
      : null

    const eventStart = new Date(event.start_at)
    const eventEnd   = new Date(event.end_at)
    const duration   = eventEnd.getTime() - eventStart.getTime()
    const limitDate  = until && until < viewEnd ? until : viewEnd

    const cursor = new Date(viewStart)
    cursor.setHours(eventStart.getHours(), eventStart.getMinutes(), 0, 0)
    // Don't start before the event's own start
    if (cursor < eventStart) cursor.setTime(eventStart.getTime())

    let safetyLimit = 0
    while (cursor <= limitDate && safetyLimit < 400) {
      safetyLimit++
      const dayOfWeek = cursor.getDay()
      let matches = false

      if (freq === 'DAILY') {
        const daysDiff = Math.round(
          (cursor.getTime() - eventStart.getTime()) / 86_400_000
        )
        matches = daysDiff >= 0 && daysDiff % interval === 0
      } else if (freq === 'WEEKLY') {
        if (byDay.length > 0) {
          const DAYS = ['SU','MO','TU','WE','TH','FR','SA']
          matches = byDay.includes(DAYS[dayOfWeek])
          if (matches && interval > 1) {
            const weeksDiff = Math.floor(
              (cursor.getTime() - eventStart.getTime()) / (7 * 86_400_000)
            )
            matches = weeksDiff % interval === 0
          }
        } else {
          const weeksDiff = Math.round(
            (cursor.getTime() - eventStart.getTime()) / (7 * 86_400_000)
          )
          matches = weeksDiff >= 0 && weeksDiff % interval === 0
            && dayOfWeek === eventStart.getDay()
        }
      } else if (freq === 'MONTHLY') {
        const monthsDiff =
          (cursor.getFullYear() - eventStart.getFullYear()) * 12
          + (cursor.getMonth() - eventStart.getMonth())
        matches = cursor.getDate() === eventStart.getDate()
          && monthsDiff >= 0 && monthsDiff % interval === 0
      } else if (freq === 'YEARLY') {
        matches = cursor.getDate()  === eventStart.getDate()
               && cursor.getMonth() === eventStart.getMonth()
      }

      if (matches && cursor >= viewStart) {
        const occEnd = new Date(cursor.getTime() + duration)
        result.push({
          ...event,
          id:       `${event.id}_${cursor.toISOString().slice(0, 10)}`,
          start_at: cursor.toISOString(),
          end_at:   occEnd.toISOString(),
        })
      }

      cursor.setDate(cursor.getDate() + 1)
    }
  }

  return result
}
