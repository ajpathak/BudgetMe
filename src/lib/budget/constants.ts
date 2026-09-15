import type { Category } from "./types"

export const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  { name: "Food & Dining", color: "#F97316", monthlyBudgetCap: 8000 },
  { name: "Groceries", color: "#22C55E", monthlyBudgetCap: 6000 },
  { name: "Rent/Housing", color: "#6366F1", monthlyBudgetCap: 25000 },
  { name: "Utilities", color: "#0EA5E9", monthlyBudgetCap: 3500 },
  { name: "Transport", color: "#EAB308", monthlyBudgetCap: 4000 },
  { name: "Shopping", color: "#EC4899", monthlyBudgetCap: 5000 },
  { name: "Entertainment", color: "#A855F7", monthlyBudgetCap: 3000 },
  { name: "Health", color: "#14B8A6", monthlyBudgetCap: 2500 },
  { name: "Subscriptions", color: "#8B5CF6", monthlyBudgetCap: 1500 },
  { name: "Savings/Investments", color: "#10B981", monthlyBudgetCap: 10000 },
  { name: "Other", color: "#64748B", monthlyBudgetCap: 2000 },
]

export const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  upi: "UPI",
  bank: "Bank Transfer",
}

export const FALLBACK_COLOR = "#94A3B8"
