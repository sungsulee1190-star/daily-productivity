import { differenceInDays, startOfDay, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

export function getDaysOverdue(deadline: string): number {
  const today = startOfDay(new Date())
  const deadlineDate = startOfDay(parseISO(deadline))
  return differenceInDays(today, deadlineDate)
}

export function isToday(dateStr: string): boolean {
  const today = startOfDay(new Date())
  const date = startOfDay(parseISO(dateStr))
  return differenceInDays(today, date) === 0
}

export function isPast(dateStr: string): boolean {
  const today = startOfDay(new Date())
  const date = startOfDay(parseISO(dateStr))
  return differenceInDays(today, date) > 0
}

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr)
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

export function isThisWeek(dateStr: string): boolean {
  const date = parseISO(dateStr)
  const now = new Date()
  return isWithinInterval(date, {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  })
}

export function isThisMonth(dateStr: string): boolean {
  const date = parseISO(dateStr)
  const now = new Date()
  return isWithinInterval(date, {
    start: startOfMonth(now),
    end: endOfMonth(now),
  })
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
