import { adjacentMonth } from "./dates"
import type { BudgetStore } from "./types"

export function previousMonthKey(monthKey: string) {
  return adjacentMonth(monthKey, -1)
}

export function insightForMonth(store: BudgetStore, monthKey: string) {
  const prev = previousMonthKey(monthKey)
  const current = store.months[monthKey]
  const last = store.months[prev]
  if (!current || !last) return null
  const currentTotals: Record<string, number> = {}
  const lastTotals: Record<string, number> = {}
  for (const expense of current.expenses) {
    currentTotals[expense.categoryId] =
      (currentTotals[expense.categoryId] ?? 0) + expense.amount
  }
  for (const expense of last.expenses) {
    lastTotals[expense.categoryId] =
      (lastTotals[expense.categoryId] ?? 0) + expense.amount
  }
  let best: { name: string; change: number } | null = null
  for (const category of store.categories) {
    const a = currentTotals[category.id] ?? 0
    const b = lastTotals[category.id] ?? 0
    if (b <= 0 || a <= 0) continue
    const change = ((a - b) / b) * 100
    if (!best || Math.abs(change) > Math.abs(best.change)) {
      best = { name: category.name, change }
    }
  }
  return best ? { previousKey: prev, ...best } : null
}
