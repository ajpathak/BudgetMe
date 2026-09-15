import { format, getDaysInMonth, subMonths } from "date-fns"
import { DEFAULT_CATEGORIES } from "./constants"
import { currentMonthKey } from "./dates"
import { createId } from "./ids"
import type { BudgetStore, Category, Expense, MonthlyBudget } from "./types"

function hash(input: string) {
  let value = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    value ^= input.charCodeAt(i)
    value = Math.imul(value, 16777619)
  }
  return value >>> 0
}

function pick<T>(list: T[], seed: number) {
  return list[seed % list.length]
}

export function createDefaultCategories(): Category[] {
  return DEFAULT_CATEGORIES.map((category) => ({
    ...category,
    id: createId(),
  }))
}

export function emptyStore(): BudgetStore {
  return {
    version: 1,
    categories: createDefaultCategories(),
    months: {},
    settings: {
      currency: "INR",
      locale: "en-IN",
      defaultTotalBudget: 65000,
      theme: "system",
    },
  }
}

export function createMonth(
  monthKey: string,
  store: BudgetStore
): MonthlyBudget {
  const categoryBudgets: Record<string, number> = {}
  for (const category of store.categories) {
    if (typeof category.monthlyBudgetCap === "number") {
      categoryBudgets[category.id] = category.monthlyBudgetCap
    }
  }
  return {
    monthKey,
    totalBudget: store.settings.defaultTotalBudget,
    categoryBudgets,
    expenses: [],
  }
}

const TEMPLATES: Array<{
  category: string
  notes: string[]
  min: number
  max: number
  count: [number, number]
  payment?: Expense["paymentMethod"]
}> = [
  {
    category: "Food & Dining",
    notes: ["Lunch at cafe", "Dinner out", "Late-night dosa", "Office canteen"],
    min: 180,
    max: 1400,
    count: [4, 8],
    payment: "upi",
  },
  {
    category: "Groceries",
    notes: ["Weekly vegetables", "BigBasket run", "Milk & bread", "Kirana store"],
    min: 420,
    max: 2800,
    count: [2, 4],
    payment: "upi",
  },
  {
    category: "Rent/Housing",
    notes: ["Monthly rent"],
    min: 22000,
    max: 25000,
    count: [1, 1],
    payment: "bank",
  },
  {
    category: "Utilities",
    notes: ["Electricity bill", "Wi-Fi", "Water"],
    min: 400,
    max: 2200,
    count: [1, 3],
    payment: "upi",
  },
  {
    category: "Transport",
    notes: ["Metro card", "Cab home", "Petrol", "Auto to office"],
    min: 80,
    max: 1800,
    count: [3, 7],
    payment: "upi",
  },
  {
    category: "Shopping",
    notes: ["T-shirt", "Home supplies", "Headphones"],
    min: 499,
    max: 4200,
    count: [0, 3],
    payment: "card",
  },
  {
    category: "Entertainment",
    notes: ["Movie night", "Concert tickets", "Board game cafe"],
    min: 250,
    max: 1800,
    count: [0, 3],
    payment: "card",
  },
  {
    category: "Health",
    notes: ["Pharmacy", "Lab test", "Gym snack"],
    min: 150,
    max: 1600,
    count: [0, 2],
    payment: "upi",
  },
  {
    category: "Subscriptions",
    notes: ["Spotify", "iCloud", "Hotstar"],
    min: 129,
    max: 649,
    count: [1, 3],
    payment: "card",
  },
  {
    category: "Savings/Investments",
    notes: ["SIP — Nifty 50", "Emergency fund"],
    min: 3000,
    max: 10000,
    count: [1, 2],
    payment: "bank",
  },
]

export function seedDemoStore(now = new Date()): BudgetStore {
  const store = emptyStore()
  const categoriesByName = new Map(store.categories.map((c) => [c.name, c]))
  const current = currentMonthKey(now)

  for (let offset = 5; offset >= 0; offset -= 1) {
    const monthDate = subMonths(now, offset)
    const monthKey = format(monthDate, "yyyy-MM")
    const month = createMonth(monthKey, store)
    const days = getDaysInMonth(monthDate)
    const expenses: Expense[] = []

    for (const template of TEMPLATES) {
      const category = categoriesByName.get(template.category)
      if (!category) continue
      const seed = hash(`${monthKey}:${template.category}`)
      const span = template.count[1] - template.count[0]
      const count = template.count[0] + (span === 0 ? 0 : seed % (span + 1))
      for (let i = 0; i < count; i += 1) {
        const local = hash(`${monthKey}:${template.category}:${i}`)
        const day = 1 + (local % days)
        const amount =
          template.min + (local % Math.max(1, template.max - template.min))
        const isRecurring =
          template.category === "Rent/Housing" ||
          (template.category === "Subscriptions" && i === 0)
        const createdAt = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth(),
          Math.min(day, days),
          10
        ).toISOString()
        expenses.push({
          id: createId(),
          amount: Math.round(amount),
          categoryId: category.id,
          date: `${monthKey}-${String(day).padStart(2, "0")}`,
          note: pick(template.notes, local),
          paymentMethod: template.payment,
          isRecurring,
          recurringId: isRecurring ? `recurring:${template.category}` : undefined,
          createdAt,
          updatedAt: createdAt,
        })
      }
    }

    month.expenses = expenses.sort((a, b) => b.date.localeCompare(a.date))
    store.months[monthKey] = month
  }

  const currentMonth = store.months[current]
  if (currentMonth) {
    currentMonth.expenses = currentMonth.expenses.filter((expense) => {
      return expense.date <= format(now, "yyyy-MM-dd")
    })
  }

  return store
}
