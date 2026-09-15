import {
  addMonths,
  format,
  getDaysInMonth,
  isValid,
  parse,
  parseISO,
  startOfMonth,
} from "date-fns"

export function currentMonthKey(now = new Date()) {
  return format(now, "yyyy-MM")
}

export function monthKeyFromDate(isoDate: string) {
  return isoDate.slice(0, 7)
}

export function parseMonthKey(monthKey: string) {
  const date = parse(`${monthKey}-01`, "yyyy-MM-dd", new Date())
  return isValid(date) ? date : startOfMonth(new Date())
}

export function formatMonthLabel(monthKey: string, pattern = "MMMM yyyy") {
  return format(parseMonthKey(monthKey), pattern)
}

export function formatShortMonth(monthKey: string) {
  return format(parseMonthKey(monthKey), "MMM yyyy")
}

export function isCurrentMonth(monthKey: string, now = new Date()) {
  return monthKey === currentMonthKey(now)
}

export function isPastMonth(monthKey: string, now = new Date()) {
  return monthKey < currentMonthKey(now)
}

export function clampDateToMonth(isoDate: string, monthKey: string) {
  const day = Number(isoDate.slice(8, 10) || "1")
  const monthDate = parseMonthKey(monthKey)
  const max = getDaysInMonth(monthDate)
  const safeDay = Math.min(Math.max(day, 1), max)
  return `${monthKey}-${String(safeDay).padStart(2, "0")}`
}

export function todayInMonth(monthKey: string, now = new Date()) {
  if (isCurrentMonth(monthKey, now)) return format(now, "yyyy-MM-dd")
  const monthDate = parseMonthKey(monthKey)
  if (isPastMonth(monthKey, now)) {
    return format(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0), "yyyy-MM-dd")
  }
  return `${monthKey}-01`
}

export function monthRange(monthKey: string) {
  const start = parseMonthKey(monthKey)
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
  return {
    min: format(start, "yyyy-MM-dd"),
    max: format(end, "yyyy-MM-dd"),
  }
}

export function adjacentMonth(monthKey: string, delta: number) {
  return format(addMonths(parseMonthKey(monthKey), delta), "yyyy-MM")
}

export function yearOf(monthKey: string) {
  return monthKey.slice(0, 4)
}

export function monthsInYear(year: string) {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`)
}

export function parseIsoDate(value: string) {
  const date = parseISO(value)
  return isValid(date) ? date : new Date()
}
