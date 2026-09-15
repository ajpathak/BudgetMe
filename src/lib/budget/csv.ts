import { PAYMENT_LABELS } from "./constants"
import { getCategory } from "./selectors"
import type { BudgetStore, Expense, PaymentMethod } from "./types"

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}

export function expensesToCsv(store: BudgetStore, expenses: Expense[]) {
  const header = [
    "date",
    "amount",
    "category",
    "note",
    "paymentMethod",
    "recurring",
  ]
  const rows = expenses.map((expense) =>
    [
      expense.date,
      String(expense.amount),
      getCategory(store, expense.categoryId)?.name ?? "",
      expense.note,
      expense.paymentMethod ? PAYMENT_LABELS[expense.paymentMethod] : "",
      expense.isRecurring ? "yes" : "no",
    ]
      .map(csvEscape)
      .join(",")
  )
  return [header.join(","), ...rows].join("\n")
}

export function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const header = splitCsvLine(lines[0]).map((item) => item.trim().toLowerCase())
  const index = {
    date: header.indexOf("date"),
    amount: header.indexOf("amount"),
    category: header.indexOf("category"),
    note: header.indexOf("note"),
    paymentMethod: header.indexOf("paymentmethod"),
    recurring: header.indexOf("recurring"),
  }
  return lines.slice(1).flatMap((line) => {
    const cells = splitCsvLine(line)
    const amount = Number(cells[index.amount])
    if (!cells[index.date] || !Number.isFinite(amount)) return []
    return [
      {
        date: cells[index.date],
        amount,
        category: cells[index.category] || "Other",
        note: index.note >= 0 ? cells[index.note] : "",
        paymentMethod: normalizePayment(cells[index.paymentMethod]),
        isRecurring: /^(yes|true|1)$/i.test(cells[index.recurring] ?? ""),
      },
    ]
  })
}

function normalizePayment(value?: string): PaymentMethod | undefined {
  const raw = value?.trim().toLowerCase() ?? ""
  if (raw.includes("upi")) return "upi"
  if (raw.includes("card")) return "card"
  if (raw.includes("cash")) return "cash"
  if (raw.includes("bank")) return "bank"
  return undefined
}

function splitCsvLine(line: string) {
  const cells: string[] = []
  let current = ""
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else if (char === '"') {
        quoted = false
      } else {
        current += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ",") {
      cells.push(current)
      current = ""
    } else {
      current += char
    }
  }
  cells.push(current)
  return cells
}

export function downloadFile(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
