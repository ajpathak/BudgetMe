import { clampDateToMonth, monthKeyFromDate } from "./dates"
import { createId } from "./ids"
import { createMonth, emptyStore } from "./seed"
import type { BudgetStore, Expense, MonthlyBudget, PaymentMethod } from "./types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function migrateStore(raw: unknown): BudgetStore {
  const fallback = emptyStore()
  if (!isRecord(raw)) return fallback

  const categories = Array.isArray(raw.categories)
    ? raw.categories
        .filter(isRecord)
        .map((category) => ({
          id: String(category.id || createId()),
          name: String(category.name || "Other"),
          color: String(category.color || "#64748B"),
          monthlyBudgetCap:
            typeof category.monthlyBudgetCap === "number"
              ? category.monthlyBudgetCap
              : undefined,
        }))
    : fallback.categories

  const months: Record<string, MonthlyBudget> = {}
  if (isRecord(raw.months)) {
    for (const [key, value] of Object.entries(raw.months)) {
      if (!isRecord(value)) continue
      months[key] = {
        monthKey: key,
        totalBudget:
          typeof value.totalBudget === "number" ? value.totalBudget : undefined,
        categoryBudgets: isRecord(value.categoryBudgets)
          ? Object.fromEntries(
              Object.entries(value.categoryBudgets).flatMap(([id, amount]) =>
                typeof amount === "number" ? [[id, amount]] : []
              )
            )
          : {},
        expenses: Array.isArray(value.expenses)
          ? value.expenses.filter(isRecord).map((expense) => ({
              id: String(expense.id || createId()),
              amount: Number(expense.amount) || 0,
              categoryId: String(expense.categoryId || ""),
              date: String(expense.date || `${key}-01`),
              note: String(expense.note || ""),
              paymentMethod: expense.paymentMethod as PaymentMethod | undefined,
              isRecurring: Boolean(expense.isRecurring),
              recurringId: expense.recurringId
                ? String(expense.recurringId)
                : undefined,
              createdAt: String(expense.createdAt || new Date().toISOString()),
              updatedAt: String(expense.updatedAt || new Date().toISOString()),
            }))
          : [],
      }
    }
  }

  const settings = isRecord(raw.settings) ? raw.settings : {}

  return {
    version: 1,
    categories: categories.length ? categories : fallback.categories,
    months,
    settings: {
      currency: String(settings.currency || "INR"),
      locale: String(settings.locale || "en-IN"),
      defaultTotalBudget:
        typeof settings.defaultTotalBudget === "number"
          ? settings.defaultTotalBudget
          : fallback.settings.defaultTotalBudget,
      theme:
        settings.theme === "light" || settings.theme === "dark"
          ? settings.theme
          : "system",
    },
  }
}

export function applyRecurring(store: BudgetStore, monthKey: string) {
  const month = store.months[monthKey] ?? createMonth(monthKey, store)
  const existing = new Set(
    month.expenses
      .map((expense) => expense.recurringId)
      .filter((id): id is string => Boolean(id))
  )
  const templates = new Map<string, Expense>()
  for (const [key, candidate] of Object.entries(store.months)) {
    if (key >= monthKey) continue
    for (const expense of candidate.expenses) {
      if (!expense.isRecurring || !expense.recurringId) continue
      templates.set(expense.recurringId, expense)
    }
  }
  const extras: Expense[] = []
  const now = new Date().toISOString()
  for (const [recurringId, template] of templates) {
    if (existing.has(recurringId)) continue
    extras.push({
      ...template,
      id: createId(),
      date: clampDateToMonth(template.date, monthKey),
      createdAt: now,
      updatedAt: now,
    })
  }
  return {
    ...month,
    expenses: [...month.expenses, ...extras],
  }
}

export function ensureMonth(store: BudgetStore, monthKey: string): BudgetStore {
  const existing = store.months[monthKey]
  const next = applyRecurring(store, monthKey)
  if (
    existing &&
    existing.expenses.length === next.expenses.length &&
    existing.totalBudget === next.totalBudget
  ) {
    return store
  }
  return {
    ...store,
    months: { ...store.months, [monthKey]: next },
  }
}

export function upsertExpense(
  store: BudgetStore,
  monthKey: string,
  expense: Expense
): BudgetStore {
  const withMonth = ensureMonth(store, monthKey)
  const month = withMonth.months[monthKey]
  const targetKey = monthKeyFromDate(expense.date)
  if (targetKey !== monthKey) {
    const without = {
      ...month,
      expenses: month.expenses.filter((item) => item.id !== expense.id),
    }
    const moved = ensureMonth(
      { ...withMonth, months: { ...withMonth.months, [monthKey]: without } },
      targetKey
    )
    const dest = moved.months[targetKey]
    return {
      ...moved,
      months: {
        ...moved.months,
        [targetKey]: {
          ...dest,
          expenses: [
            ...dest.expenses.filter((item) => item.id !== expense.id),
            expense,
          ],
        },
      },
    }
  }
  const index = month.expenses.findIndex((item) => item.id === expense.id)
  const expenses = [...month.expenses]
  if (index >= 0) expenses[index] = expense
  else expenses.unshift(expense)
  return {
    ...withMonth,
    months: {
      ...withMonth.months,
      [monthKey]: { ...month, expenses },
    },
  }
}

export function removeExpense(
  store: BudgetStore,
  monthKey: string,
  expenseId: string
): BudgetStore {
  const month = store.months[monthKey]
  if (!month) return store
  return {
    ...store,
    months: {
      ...store.months,
      [monthKey]: {
        ...month,
        expenses: month.expenses.filter((expense) => expense.id !== expenseId),
      },
    },
  }
}
