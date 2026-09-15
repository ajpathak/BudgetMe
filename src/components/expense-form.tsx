"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PAYMENT_LABELS } from "@/lib/budget/constants"
import { monthRange, todayInMonth } from "@/lib/budget/dates"
import { parseAmount } from "@/lib/budget/money"
import { PAYMENT_METHODS, type Expense, type PaymentMethod } from "@/lib/budget/types"
import { useBudget } from "@/components/budget-provider"

type Props = {
  monthKey: string
  expense?: Expense | null
  onDone?: () => void
}

export function ExpenseForm({ monthKey, expense, onDone }: Props) {
  const { store, addExpense, updateExpense, addCategory } = useBudget()
  const range = monthRange(monthKey)
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "")
  const [categoryId, setCategoryId] = useState(
    expense?.categoryId ?? store.categories[0]?.id ?? ""
  )
  const [date, setDate] = useState(expense?.date ?? todayInMonth(monthKey))
  const [note, setNote] = useState(expense?.note ?? "")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "none">(
    expense?.paymentMethod ?? "none"
  )
  const [isRecurring, setIsRecurring] = useState(Boolean(expense?.isRecurring))
  const [error, setError] = useState("")
  const [newOpen, setNewOpen] = useState(false)
  const [newName, setNewName] = useState("")

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const parsed = parseAmount(amount)
    if (parsed === null || parsed <= 0) {
      setError("Enter a valid amount")
      return
    }
    if (!categoryId) {
      setError("Pick a category")
      return
    }
    if (date < range.min || date > range.max) {
      setError("Date must fall in this month")
      return
    }
    const payload = {
      amount: parsed,
      categoryId,
      date,
      note,
      paymentMethod: paymentMethod === "none" ? undefined : paymentMethod,
      isRecurring,
      recurringId: expense?.recurringId,
    }
    if (expense) {
      updateExpense(monthKey, {
        ...expense,
        ...payload,
      })
    } else {
      addExpense(monthKey, payload)
      setAmount("")
      setNote("")
      setDate(todayInMonth(monthKey))
      setIsRecurring(false)
    }
    setError("")
    onDone?.()
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          required
        />
      </div>
      <div className="grid gap-1.5">
        <Label>Category</Label>
        <Select
          value={categoryId}
          onValueChange={(value) => {
            if (value === "__new__") {
              setNewOpen(true)
              return
            }
            if (value) setCategoryId(value)
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a category" />
          </SelectTrigger>
          <SelectContent>
            {store.categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <span className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: category.color }}
                  />
                  {category.name}
                </span>
              </SelectItem>
            ))}
            <SelectItem value="__new__">+ Add new category</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          min={range.min}
          max={range.max}
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
        />
      </div>
      <div className="grid gap-1.5">
        <Label>Payment method</Label>
        <Select
          value={paymentMethod}
          onValueChange={(value) =>
            setPaymentMethod((value as PaymentMethod | "none") ?? "none")
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Optional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {PAYMENT_METHODS.map((method) => (
              <SelectItem key={method} value={method}>
                {PAYMENT_LABELS[method]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="note">Note</Label>
        <Textarea
          id="note"
          rows={2}
          placeholder="What was this for?"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>
      <label className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
        <span className="text-sm">
          Repeat monthly
          <span className="block text-xs text-muted-foreground">
            Copies into future months automatically
          </span>
        </span>
        <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit">{expense ? "Save changes" : "Add expense"}</Button>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              if (!newName.trim()) return
              const id = addCategory(newName.trim(), "#0F766E")
              setCategoryId(id)
              setNewName("")
              setNewOpen(false)
            }}
          >
            <Input
              autoFocus
              placeholder="e.g. Gifts"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
            />
            <Button type="submit">Create category</Button>
          </form>
        </DialogContent>
      </Dialog>
    </form>
  )
}
