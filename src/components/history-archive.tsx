"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MiniPie } from "@/components/spend-chart"
import { useBudget } from "@/components/budget-provider"
import { formatMonthLabel, formatShortMonth, isCurrentMonth, monthsInYear, yearOf } from "@/lib/budget/dates"
import { formatMoney } from "@/lib/budget/money"
import { listMonthKeys, monthTotal, remaining, searchMonths, yearsFromStore } from "@/lib/budget/selectors"

export function HistoryArchive() {
  const { store, ready } = useBudget()
  const [text, setText] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [minAmount, setMinAmount] = useState("")
  const years = yearsFromStore(store)
  const matches = useMemo(
    () =>
      searchMonths(store, {
        text: text || undefined,
        categoryId: categoryId || undefined,
        minAmount: minAmount ? Number(minAmount) : undefined,
      }),
    [categoryId, minAmount, store, text]
  )
  const filtering = Boolean(text || categoryId || minAmount)

  if (!ready) return <div className="p-8 text-sm text-muted-foreground">Loading archive…</div>

  if (!listMonthKeys(store).some((key) => store.months[key]?.expenses.length) && !filtering) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-dashed px-6 py-16 text-center">
          <h1 className="font-heading text-xl font-semibold">No history yet</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Months fold into this archive automatically when the calendar turns. Add spend this month and last month will sit here as a card with its own tiny pie.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">History</h1>
        <p className="text-sm text-muted-foreground">
          Browse every archived month, or filter for spikes — try Dining over ₹5,000.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Input
          placeholder="Search notes or category names"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <Select
          value={categoryId || "all"}
          onValueChange={(value) => setCategoryId(value === "all" || !value ? "" : value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any category</SelectItem>
            {store.categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          min={0}
          placeholder="Min amount in month"
          value={minAmount}
          onChange={(event) => setMinAmount(event.target.value)}
        />
      </div>

      {filtering ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {matches.length ? (
            matches.map((row) => (
              <MonthCard
                key={row.monthKey}
                monthKey={row.monthKey}
                highlight={row.matchedTotal}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No months match that filter.</p>
          )}
        </div>
      ) : (
        years.map((year) => (
          <section key={year} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-medium">{year}</h2>
              <Link href={`/history/${year}`} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
                Year view
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {monthsInYear(year)
                .filter((monthKey) => store.months[monthKey] || isCurrentMonth(monthKey))
                .map((monthKey) => (
                  <MonthCard key={monthKey} monthKey={monthKey} />
                ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

function MonthCard({
  monthKey,
  highlight,
}: {
  monthKey: string
  highlight?: number
}) {
  const { store } = useBudget()
  const month = store.months[monthKey]
  const stats = remaining(month)
  const total = monthTotal(month)
  return (
    <Link href={`/m/${monthKey}`} className="block">
      <Card className="h-full transition-colors hover:bg-muted/40">
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle>{formatMonthLabel(monthKey, "MMM yyyy")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatMoney(total, store.settings.currency, store.settings.locale)}
            </p>
          </div>
          <MiniPie store={store} month={month} />
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          {typeof stats.budget === "number" ? (
            <Badge variant={stats.over ? "destructive" : "outline"}>
              {stats.over ? "Over budget" : "Under budget"}
            </Badge>
          ) : (
            <Badge variant="outline">No cap</Badge>
          )}
          {isCurrentMonth(monthKey) ? <Badge>Live</Badge> : null}
          {typeof highlight === "number" ? (
            <span className="text-xs text-muted-foreground">
              Match {formatMoney(highlight, store.settings.currency, store.settings.locale)}
            </span>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  )
}

export { formatShortMonth, yearOf }
