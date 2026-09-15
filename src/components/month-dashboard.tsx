"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ExpenseForm } from "@/components/expense-form"
import { ExpenseTable } from "@/components/expense-table"
import { SpendChart } from "@/components/spend-chart"
import { useBudget } from "@/components/budget-provider"
import { adjacentMonth, formatMonthLabel, isCurrentMonth, isPastMonth } from "@/lib/budget/dates"
import { insightForMonth } from "@/lib/budget/insights"
import { formatMoney, percent } from "@/lib/budget/money"
import { capTone, remaining, topCategories } from "@/lib/budget/selectors"
import { ensureMonth } from "@/lib/budget/mutations"
import { useEffect, useState } from "react"

export function MonthDashboard({ monthKey }: { monthKey: string }) {
  const { store, ready, persist, setTotalBudget, setCategoryCap } = useBudget()
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    if (!ready) return
    const next = ensureMonth(store, monthKey)
    if (next !== store) persist(next)
  }, [monthKey, persist, ready, store])

  const month = store.months[monthKey]
  const currency = store.settings.currency
  const locale = store.settings.locale
  const stats = remaining(month)
  const tops = topCategories(store, month)
  const insight = insightForMonth(store, monthKey)
  const current = isCurrentMonth(monthKey)
  const past = isPastMonth(monthKey)

  if (!ready) {
    return <div className="p-8 text-sm text-muted-foreground">Loading your books…</div>
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/90 px-4 py-3 backdrop-blur md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/m/${adjacentMonth(monthKey, -1)}`}
              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            >
              <ChevronLeft />
            </Link>
            <div>
              <p className="text-xs text-muted-foreground">
                {current ? "Current month" : past ? "Past month" : "Upcoming month"}
              </p>
              <h1 className="font-heading text-lg font-semibold tracking-tight">
                {formatMonthLabel(monthKey)}
              </h1>
            </div>
            <Link
              href={`/m/${adjacentMonth(monthKey, 1)}`}
              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            >
              <ChevronRight />
            </Link>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Spent</p>
            <p className="text-xl font-semibold tabular-nums">
              {formatMoney(stats.spent, currency, locale)}
              {typeof stats.budget === "number" ? (
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  of {formatMoney(stats.budget, currency, locale)}
                </span>
              ) : null}
            </p>
          </div>
        </div>
        {past ? (
          <div className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
            This month is archived. You can still correct expenses — it just is no longer the live month.
          </div>
        ) : null}
      </header>

      <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_320px] md:p-8">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-muted-foreground">Total spent</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold tabular-nums">
                {formatMoney(stats.spent, currency, locale)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-muted-foreground">Budgeted</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold tabular-nums">
                {typeof stats.budget === "number"
                  ? formatMoney(stats.budget, currency, locale)
                  : "Not set"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-muted-foreground">
                  {stats.over ? "Over by" : "Remaining"}
                </CardTitle>
              </CardHeader>
              <CardContent
                className={`text-2xl font-semibold tabular-nums ${stats.over ? "text-destructive" : ""}`}
              >
                {typeof stats.remaining === "number"
                  ? formatMoney(Math.abs(stats.remaining), currency, locale)
                  : "—"}
              </CardContent>
            </Card>
          </div>

          {insight ? (
            <p className="rounded-xl bg-muted/60 px-4 py-3 text-sm">
              {insight.change >= 0 ? "You are spending" : "You are spending"}{" "}
              <strong>
                {Math.abs(Math.round(insight.change))}% {insight.change >= 0 ? "more" : "less"}
              </strong>{" "}
              on {insight.name} than last month.
            </p>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Live breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <SpendChart store={store} month={month} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Transactions</CardTitle>
                <div className="flex gap-1">
                  {tops.map((item) => (
                    <Badge key={item.id} variant="outline">
                      {item.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ExpenseTable monthKey={monthKey} expenses={month?.expenses ?? []} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="hidden md:block">
            <CardHeader>
              <CardTitle>Add expense</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseForm monthKey={monthKey} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="number"
                min={0}
                placeholder="Total cap"
                defaultValue={month?.totalBudget ?? ""}
                onBlur={(event) => {
                  const value = Number(event.target.value)
                  setTotalBudget(monthKey, Number.isFinite(value) && value > 0 ? value : undefined)
                }}
              />
              <div className="space-y-3">
                {store.categories.map((category) => {
                  const spent =
                    month?.expenses
                      .filter((expense) => expense.categoryId === category.id)
                      .reduce((sum, expense) => sum + expense.amount, 0) ?? 0
                  const cap = month?.categoryBudgets[category.id]
                  const tone = capTone(spent, cap)
                  const width = cap ? Math.min(100, percent(spent, cap)) : 0
                  return (
                    <div key={category.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full" style={{ background: category.color }} />
                          {category.name}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {formatMoney(spent, currency, locale)}
                          {cap ? ` / ${formatMoney(cap, currency, locale)}` : ""}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${cap ? width : 0}%`,
                            background:
                              tone === "danger"
                                ? "#dc2626"
                                : tone === "warn"
                                  ? "#d97706"
                                  : category.color,
                          }}
                        />
                      </div>
                      <Input
                        type="number"
                        min={0}
                        className="h-7"
                        placeholder="Category cap"
                        defaultValue={cap ?? ""}
                        onBlur={(event) => {
                          const value = Number(event.target.value)
                          setCategoryCap(
                            monthKey,
                            category.id,
                            Number.isFinite(value) && value > 0 ? value : undefined
                          )
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger
          render={
            <Button
              className="fixed right-4 bottom-20 z-40 rounded-full shadow-lg md:hidden"
              size="lg"
            />
          }
        >
          <Plus />
          Add
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto p-4">
          <SheetHeader>
            <SheetTitle>Add expense</SheetTitle>
          </SheetHeader>
          <ExpenseForm monthKey={monthKey} onDone={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
