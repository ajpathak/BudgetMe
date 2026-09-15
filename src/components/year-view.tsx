"use client"

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts"
import { Cell, Pie, PieChart } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { useBudget } from "@/components/budget-provider"
import { formatShortMonth } from "@/lib/budget/dates"
import { formatMoney } from "@/lib/budget/money"
import { yearTotals } from "@/lib/budget/selectors"

export function YearView({ year }: { year: string }) {
  const { store, ready } = useBudget()
  if (!ready) return <div className="p-8 text-sm text-muted-foreground">Loading year…</div>
  const totals = yearTotals(store, year)
  const pie = store.categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      amount: totals.byCategory[category.id] ?? 0,
    }))
    .filter((slice) => slice.amount > 0)
  const bars = totals.byMonth.map((row) => ({
    ...row,
    label: formatShortMonth(row.monthKey),
  }))

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{year} in review</h1>
        <p className="text-sm text-muted-foreground">
          {formatMoney(totals.total, store.settings.currency, store.settings.locale)} across the year
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Category mix</CardTitle>
          </CardHeader>
          <CardContent>
            {pie.length ? (
              <ChartContainer config={{}} className="mx-auto h-[280px] aspect-square">
                <PieChart>
                  <Pie data={pie} dataKey="amount" nameKey="name" innerRadius={60} outerRadius={100}>
                    {pie.map((slice) => (
                      <Cell key={slice.id} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(Number(value), store.settings.currency, store.settings.locale)} />
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No expenses recorded in {year}.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Month-by-month trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[280px] w-full">
              <BarChart data={bars}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatMoney(Number(value), store.settings.currency, store.settings.locale)} />
                <Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
