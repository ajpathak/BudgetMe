"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { toast } from "sonner"
import { downloadFile, expensesToCsv, parseCsv } from "@/lib/budget/csv"
import { clampDateToMonth, currentMonthKey, monthKeyFromDate } from "@/lib/budget/dates"
import { createId } from "@/lib/budget/ids"
import {
  ensureMonth,
  migrateStore,
  removeExpense,
  upsertExpense,
} from "@/lib/budget/mutations"
import { localStorageRepository } from "@/lib/budget/repository"
import { emptyStore, seedDemoStore } from "@/lib/budget/seed"
import type {
  AppSettings,
  BudgetStore,
  Category,
  Expense,
  PaymentMethod,
} from "@/lib/budget/types"

type ExpenseDraft = {
  amount: number
  categoryId: string
  date: string
  note?: string
  paymentMethod?: PaymentMethod
  isRecurring?: boolean
  recurringId?: string
}

type BudgetContextValue = {
  store: BudgetStore
  ready: boolean
  persist: (next: BudgetStore) => void
  addExpense: (monthKey: string, draft: ExpenseDraft) => void
  updateExpense: (monthKey: string, expense: Expense) => void
  deleteExpense: (monthKey: string, expenseId: string) => void
  setTotalBudget: (monthKey: string, amount?: number) => void
  setCategoryCap: (monthKey: string, categoryId: string, amount?: number) => void
  addCategory: (name: string, color: string, cap?: number) => string
  updateCategory: (category: Category) => void
  deleteCategory: (categoryId: string) => void
  updateSettings: (settings: Partial<AppSettings>) => void
  exportMonth: (monthKey: string, format: "csv" | "json") => void
  exportAll: (format: "csv" | "json") => void
  importJson: (text: string) => void
  importCsv: (text: string, monthKey: string) => void
  loadDemo: () => void
  resetAll: () => void
}

const BudgetContext = createContext<BudgetContextValue | null>(null)

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<BudgetStore>(emptyStore)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    localStorageRepository.load().then((loaded) => {
      if (cancelled) return
      setStore(ensureMonth(loaded, currentMonthKey()))
      setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const persist = useCallback((next: BudgetStore) => {
    setStore(next)
    void localStorageRepository.save(next)
  }, [])

  const addExpense = useCallback(
    (monthKey: string, draft: ExpenseDraft) => {
      const now = new Date().toISOString()
      const expense: Expense = {
        id: createId(),
        amount: draft.amount,
        categoryId: draft.categoryId,
        date: clampDateToMonth(draft.date, monthKeyFromDate(draft.date) || monthKey),
        note: draft.note?.trim() ?? "",
        paymentMethod: draft.paymentMethod,
        isRecurring: Boolean(draft.isRecurring),
        recurringId: draft.isRecurring
          ? draft.recurringId || `recurring:${createId()}`
          : undefined,
        createdAt: now,
        updatedAt: now,
      }
      persist(upsertExpense(store, monthKey, expense))
      toast.success("Expense added")
    },
    [persist, store]
  )

  const updateExpense = useCallback(
    (monthKey: string, expense: Expense) => {
      persist(
        upsertExpense(store, monthKey, {
          ...expense,
          updatedAt: new Date().toISOString(),
        })
      )
      toast.success("Expense updated")
    },
    [persist, store]
  )

  const deleteExpense = useCallback(
    (monthKey: string, expenseId: string) => {
      persist(removeExpense(store, monthKey, expenseId))
      toast.success("Expense deleted")
    },
    [persist, store]
  )

  const setTotalBudget = useCallback(
    (monthKey: string, amount?: number) => {
      const next = ensureMonth(store, monthKey)
      persist({
        ...next,
        months: {
          ...next.months,
          [monthKey]: { ...next.months[monthKey], totalBudget: amount },
        },
      })
    },
    [persist, store]
  )

  const setCategoryCap = useCallback(
    (monthKey: string, categoryId: string, amount?: number) => {
      const next = ensureMonth(store, monthKey)
      const month = next.months[monthKey]
      const categoryBudgets = { ...month.categoryBudgets }
      if (typeof amount === "number") categoryBudgets[categoryId] = amount
      else delete categoryBudgets[categoryId]
      persist({
        ...next,
        months: { ...next.months, [monthKey]: { ...month, categoryBudgets } },
      })
    },
    [persist, store]
  )

  const addCategory = useCallback(
    (name: string, color: string, cap?: number) => {
      const id = createId()
      persist({
        ...store,
        categories: [
          ...store.categories,
          { id, name, color, monthlyBudgetCap: cap },
        ],
      })
      toast.success(`Added ${name}`)
      return id
    },
    [persist, store]
  )

  const updateCategory = useCallback(
    (category: Category) => {
      persist({
        ...store,
        categories: store.categories.map((item) =>
          item.id === category.id ? category : item
        ),
      })
    },
    [persist, store]
  )

  const deleteCategory = useCallback(
    (categoryId: string) => {
      persist({
        ...store,
        categories: store.categories.filter((category) => category.id !== categoryId),
      })
    },
    [persist, store]
  )

  const updateSettings = useCallback(
    (settings: Partial<AppSettings>) => {
      persist({
        ...store,
        settings: { ...store.settings, ...settings },
      })
    },
    [persist, store]
  )

  const exportMonth = useCallback(
    (monthKey: string, format: "csv" | "json") => {
      const month = store.months[monthKey]
      if (format === "json") {
        downloadFile(
          `budgetme-${monthKey}.json`,
          JSON.stringify(month ?? {}, null, 2),
          "application/json"
        )
        return
      }
      downloadFile(
        `budgetme-${monthKey}.csv`,
        expensesToCsv(store, month?.expenses ?? []),
        "text/csv"
      )
    },
    [store]
  )

  const exportAll = useCallback(
    (format: "csv" | "json") => {
      if (format === "json") {
        downloadFile(
          "budgetme-history.json",
          JSON.stringify(store, null, 2),
          "application/json"
        )
        return
      }
      const expenses = Object.values(store.months).flatMap((month) => month.expenses)
      downloadFile("budgetme-history.csv", expensesToCsv(store, expenses), "text/csv")
    },
    [store]
  )

  const importJson = useCallback(
    (text: string) => {
      try {
        const parsed = migrateStore(JSON.parse(text))
        persist(ensureMonth(parsed, currentMonthKey()))
        toast.success("Imported backup")
      } catch {
        toast.error("That file is not a BudgetMe JSON backup")
      }
    },
    [persist]
  )

  const importCsv = useCallback(
    (text: string, monthKey: string) => {
      const rows = parseCsv(text)
      if (!rows.length) {
        toast.error("No rows found in that CSV")
        return
      }
      let next = ensureMonth(store, monthKey)
      for (const row of rows) {
        let category = next.categories.find(
          (item) => item.name.toLowerCase() === row.category.toLowerCase()
        )
        if (!category) {
          category = {
            id: createId(),
            name: row.category,
            color: "#64748B",
          }
          next = { ...next, categories: [...next.categories, category] }
        }
        const now = new Date().toISOString()
        next = upsertExpense(next, monthKey, {
          id: createId(),
          amount: row.amount,
          categoryId: category.id,
          date: clampDateToMonth(row.date, monthKey),
          note: row.note,
          paymentMethod: row.paymentMethod,
          isRecurring: row.isRecurring,
          createdAt: now,
          updatedAt: now,
        })
      }
      persist(next)
      toast.success(`Imported ${rows.length} expenses`)
    },
    [persist, store]
  )

  const loadDemo = useCallback(() => {
    const seeded = ensureMonth(seedDemoStore(), currentMonthKey())
    persist(seeded)
    toast.success("Loaded sample months")
  }, [persist])

  const resetAll = useCallback(() => {
    const fresh = ensureMonth(emptyStore(), currentMonthKey())
    persist(fresh)
    toast.success("Cleared all data")
  }, [persist])

  const value = useMemo(
    () => ({
      store,
      ready,
      persist,
      addExpense,
      updateExpense,
      deleteExpense,
      setTotalBudget,
      setCategoryCap,
      addCategory,
      updateCategory,
      deleteCategory,
      updateSettings,
      exportMonth,
      exportAll,
      importJson,
      importCsv,
      loadDemo,
      resetAll,
    }),
    [
      store,
      ready,
      persist,
      addExpense,
      updateExpense,
      deleteExpense,
      setTotalBudget,
      setCategoryCap,
      addCategory,
      updateCategory,
      deleteCategory,
      updateSettings,
      exportMonth,
      exportAll,
      importJson,
      importCsv,
      loadDemo,
      resetAll,
    ]
  )

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
}

export function useBudget() {
  const context = useContext(BudgetContext)
  if (!context) throw new Error("useBudget must be used inside BudgetProvider")
  return context
}
