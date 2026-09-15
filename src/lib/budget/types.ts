export const SCHEMA_VERSION = 1
export const STORAGE_KEY = "budgetme:v1"

export const PAYMENT_METHODS = ["cash", "card", "upi", "bank"] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export interface Category {
  id: string
  name: string
  color: string
  monthlyBudgetCap?: number
}

export interface Expense {
  id: string
  amount: number
  categoryId: string
  date: string
  note: string
  paymentMethod?: PaymentMethod
  isRecurring: boolean
  recurringId?: string
  createdAt: string
  updatedAt: string
}

export interface MonthlyBudget {
  monthKey: string
  totalBudget?: number
  categoryBudgets: Record<string, number>
  expenses: Expense[]
}

export interface AppSettings {
  currency: string
  locale: string
  defaultTotalBudget?: number
  theme: "system" | "light" | "dark"
}

export interface BudgetStore {
  version: number
  categories: Category[]
  months: Record<string, MonthlyBudget>
  settings: AppSettings
}

export type SortKey = "date" | "amount" | "category"
export type SortDir = "asc" | "desc"
