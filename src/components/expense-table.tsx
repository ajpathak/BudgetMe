"use client"

import { useMemo, useState } from "react"
import { Pencil, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ExpenseForm } from "@/components/expense-form"
import { useBudget } from "@/components/budget-provider"
import { PAYMENT_LABELS } from "@/lib/budget/constants"
import { formatMoney } from "@/lib/budget/money"
import { getCategory, sortExpenses } from "@/lib/budget/selectors"
import type { Expense, SortDir, SortKey } from "@/lib/budget/types"

export function ExpenseTable({
  monthKey,
  expenses,
}: {
  monthKey: string
  expenses: Expense[]
}) {
  const { store, deleteExpense } = useBudget()
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [editing, setEditing] = useState<Expense | null>(null)
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const matched = expenses.filter((expense) => {
      const category = getCategory(store, expense.categoryId)
      return (
        !needle ||
        expense.note.toLowerCase().includes(needle) ||
        category?.name.toLowerCase().includes(needle)
      )
    })
    return sortExpenses(matched, store, sortKey, sortDir)
  }, [expenses, query, sortDir, sortKey, store])

  function toggleSort(next: SortKey) {
    if (sortKey === next) setSortDir((dir) => (dir === "asc" ? "desc" : "asc"))
    else {
      setSortKey(next)
      setSortDir(next === "date" ? "desc" : "asc")
    }
  }

  if (!expenses.length) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-12 text-center">
        <p className="font-medium">No transactions this month</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Log coffee, rent, or a metro ride — they all land in this list.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Filter by note or category"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button type="button" onClick={() => toggleSort("date")}>
                  Date
                </button>
              </TableHead>
              <TableHead>
                <button type="button" onClick={() => toggleSort("category")}>
                  Category
                </button>
              </TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-right">
                <button type="button" onClick={() => toggleSort("amount")}>
                  Amount
                </button>
              </TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((expense) => {
              const category = getCategory(store, expense.categoryId)
              return (
                <TableRow key={expense.id}>
                  <TableCell className="whitespace-nowrap">{expense.date}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ background: category?.color }}
                      />
                      {category?.name ?? "Unknown"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[220px] truncate">
                      {expense.note || "—"}
                    </div>
                    {expense.paymentMethod ? (
                      <Badge variant="outline" className="mt-1">
                        {PAYMENT_LABELS[expense.paymentMethod]}
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMoney(
                      expense.amount,
                      store.settings.currency,
                      store.settings.locale
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => setEditing(expense)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => deleteExpense(monthKey, expense.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <Dialog open={Boolean(editing)} onOpenChange={() => setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit expense</DialogTitle>
          </DialogHeader>
          {editing ? (
            <ExpenseForm
              monthKey={monthKey}
              expense={editing}
              onDone={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
