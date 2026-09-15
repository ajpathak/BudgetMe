import { FALLBACK_COLOR } from "./constants"
import { currentMonthKey, isPastMonth } from "./dates"
import type { BudgetStore, Category, Expense, MonthlyBudget } from "./types"

export function categoryMap(store: BudgetStore) {
  return new Map(store.categories.map((category) => [category.id, category]))
}

export function getCategory(store: BudgetStore, id: string): Category | undefined {
  return store.categories.find((category) => category.id === id)
}

export function monthTotal(month: MonthlyBudget | undefined) {
  return (month?.expenses ?? []).reduce((sum, expense) => sum + expense.amount, 0)
}

export function spentByCategory(month: MonthlyBudget | undefined) {
  const totals: Record<string, number> = {}
  for (const expense of month?.expenses ?? []) {
    totals[expense.categoryId] = (totals[expense.categoryId] ?? 0) + expense.amount
  }
  return totals
}

export function categorySlices(
  store: BudgetStore,
  month: MonthlyBudget | undefined,
  hidden = new Set<string>()
) {
  const totals = spentByCategory(month)
  const total = Object.entries(totals)
    .filter(([id]) => !hidden.has(id))
    .reduce((sum, [, amount]) => sum + amount, 0)

  return store.categories
    .map((category) => {
      const amount = totals[category.id] ?? 0
      return {
        id: category.id,
        name: category.name,
        color: category.color || FALLBACK_COLOR,
        amount,
        hidden: hidden.has(category.id),
        percent: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
        cap: month?.categoryBudgets[category.id],
      }
    })
    .filter((slice) => slice.amount > 0 || Boolean(slice.cap))
}

export function topCategories(store: BudgetStore, month: MonthlyBudget | undefined, limit = 3) {
  return categorySlices(store, month)
    .filter((slice) => slice.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
}

export function remaining(month: MonthlyBudget | undefined) {
  const spent = monthTotal(month)
  const budget = month?.totalBudget
  if (typeof budget !== "number") {
    return { spent, budget, remaining: undefined, over: false, ratio: 0 }
  }
  return {
    spent,
    budget,
    remaining: budget - spent,
    over: spent > budget,
    ratio: budget > 0 ? spent / budget : 0,
  }
}

export function capTone(spent: number, cap?: number) {
  if (!cap || cap <= 0) return "neutral" as const
  const ratio = spent / cap
  if (ratio >= 1) return "danger" as const
  if (ratio >= 0.8) return "warn" as const
  return "ok" as const
}

export function listMonthKeys(store: BudgetStore) {
  const keys = new Set(Object.keys(store.months))
  keys.add(currentMonthKey())
  return [...keys].sort()
}

export function yearsFromStore(store: BudgetStore) {
  return [...new Set(listMonthKeys(store).map((key) => key.slice(0, 4)))].sort().reverse()
}

export function yearTotals(store: BudgetStore, year: string) {
  const months = listMonthKeys(store).filter((key) => key.startsWith(year))
  const byMonth = months.map((monthKey) => ({
    monthKey,
    total: monthTotal(store.months[monthKey]),
  }))
  const byCategory: Record<string, number> = {}
  for (const monthKey of months) {
    const month = store.months[monthKey]
    for (const [id, amount] of Object.entries(spentByCategory(month))) {
      byCategory[id] = (byCategory[id] ?? 0) + amount
    }
  }
  return {
    total: byMonth.reduce((sum, row) => sum + row.total, 0),
    byMonth,
    byCategory,
  }
}

export function compareMonths(store: BudgetStore, leftKey: string, rightKey: string) {
  const left = store.months[leftKey]
  const right = store.months[rightKey]
  const leftTotals = spentByCategory(left)
  const rightTotals = spentByCategory(right)
  const rows = store.categories.map((category) => {
    const a = leftTotals[category.id] ?? 0
    const b = rightTotals[category.id] ?? 0
    const delta = a - b
    const change = b === 0 ? (a === 0 ? 0 : 100) : Math.round((delta / b) * 1000) / 10
    return {
      category,
      left: a,
      right: b,
      delta,
      change,
    }
  })
  return {
    leftTotal: monthTotal(left),
    rightTotal: monthTotal(right),
    rows: rows.filter((row) => row.left > 0 || row.right > 0),
  }
}

export function searchMonths(
  store: BudgetStore,
  query: {
    text?: string
    categoryId?: string
    minAmount?: number
  }
) {
  const text = query.text?.trim().toLowerCase()
  return listMonthKeys(store)
    .map((monthKey) => {
      const month = store.months[monthKey]
      const expenses = (month?.expenses ?? []).filter((expense) => {
        const category = getCategory(store, expense.categoryId)
        const haystack = `${expense.note} ${category?.name ?? ""}`.toLowerCase()
        const textOk = !text || haystack.includes(text)
        const catOk = !query.categoryId || expense.categoryId === query.categoryId
        return textOk && catOk
      })
      const matchedTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0)
      const amountOk =
        typeof query.minAmount !== "number" || matchedTotal >= query.minAmount
      return {
        monthKey,
        month,
        expenses,
        matchedTotal,
        amountOk,
      }
    })
    .filter((row) => {
      if (!query.text && !query.categoryId && typeof query.minAmount !== "number") {
        return Boolean(row.month?.expenses.length)
      }
      if (query.categoryId && typeof query.minAmount === "number") {
        return row.amountOk && row.expenses.length > 0
      }
      return row.expenses.length > 0 && row.amountOk
    })
}

export function sortExpenses(
  expenses: Expense[],
  store: BudgetStore,
  sortKey: "date" | "amount" | "category",
  dir: "asc" | "desc"
) {
  const sign = dir === "asc" ? 1 : -1
  return [...expenses].sort((a, b) => {
    if (sortKey === "amount") return (a.amount - b.amount) * sign
    if (sortKey === "category") {
      const left = getCategory(store, a.categoryId)?.name ?? ""
      const right = getCategory(store, b.categoryId)?.name ?? ""
      return left.localeCompare(right) * sign
    }
    return a.date.localeCompare(b.date) * sign || a.createdAt.localeCompare(b.createdAt) * sign
  })
}

export { isPastMonth }
