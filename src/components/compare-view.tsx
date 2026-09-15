"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useBudget } from "@/components/budget-provider"
import { adjacentMonth, currentMonthKey, formatMonthLabel } from "@/lib/budget/dates"
import { formatMoney } from "@/lib/budget/money"
import { compareMonths, listMonthKeys } from "@/lib/budget/selectors"
import { SpendChart } from "@/components/spend-chart"

export function CompareView() {
  const { store, ready } = useBudget()
  const keys = listMonthKeys(store)
  const current = currentMonthKey()
  const [left, setLeft] = useState(current)
  const [right, setRight] = useState(adjacentMonth(current, -1))
  const comparison = useMemo(() => compareMonths(store, left, right), [left, right, store])

  if (!ready) return <div className="p-8 text-sm text-muted-foreground">Loading comparison…</div>

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Compare periods</h1>
        <p className="text-sm text-muted-foreground">
          Sit two months next to each other — including the same month last year.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setLeft(current)
            setRight(adjacentMonth(current, -1))
          }}
        >
          vs last month
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setLeft(current)
            setRight(adjacentMonth(current, -12))
          }}
        >
          vs same month last year
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <MonthPicker label="This period" value={left} keys={keys} onChange={setLeft} />
        <MonthPicker label="That period" value={right} keys={keys} onChange={setRight} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{formatMonthLabel(left)}</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendChart store={store} month={store.months[left]} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{formatMonthLabel(right)}</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendChart store={store} month={store.months[right]} />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Category delta</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">This period</TableHead>
                <TableHead className="text-right">That period</TableHead>
                <TableHead className="text-right">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparison.rows.length ? (
                comparison.rows.map((row) => (
                  <TableRow key={row.category.id}>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <span className="size-2 rounded-full" style={{ background: row.category.color }} />
                        {row.category.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(row.left, store.settings.currency, store.settings.locale)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(row.right, store.settings.currency, store.settings.locale)}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${row.delta > 0 ? "text-destructive" : "text-emerald-600"}`}
                    >
                      {row.delta > 0 ? "+" : ""}
                      {formatMoney(row.delta, store.settings.currency, store.settings.locale)}{" "}
                      ({row.change > 0 ? "+" : ""}
                      {row.change}%)
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    Pick two months that have expenses to see a delta table.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function MonthPicker({
  label,
  value,
  keys,
  onChange,
}: {
  label: string
  value: string
  keys: string[]
  onChange: (value: string) => void
}) {
  const options = [...new Set([value, ...keys])].sort().reverse()
  return (
    <label className="grid gap-1.5 text-sm">
      {label}
      <Select value={value} onValueChange={(next) => next && onChange(next)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((key) => (
            <SelectItem key={key} value={key}>
              {formatMonthLabel(key)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}
