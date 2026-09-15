"use client"

import { useMemo, useState } from "react"
import { Cell, Pie, PieChart, Tooltip as RechartsTooltip } from "recharts"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { formatMoney, percent } from "@/lib/budget/money"
import type { BudgetStore, MonthlyBudget } from "@/lib/budget/types"
import { categorySlices } from "@/lib/budget/selectors"

type Props = {
  store: BudgetStore
  month?: MonthlyBudget
  compact?: boolean
}

export function SpendChart({ store, month, compact = false }: Props) {
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [mode, setMode] = useState<"pie" | "bar">("pie")
  const slices = useMemo(
    () => categorySlices(store, month, hidden),
    [store, month, hidden]
  )
  const visible = slices.filter((slice) => !slice.hidden && slice.amount > 0)
  const total = visible.reduce((sum, slice) => sum + slice.amount, 0)
  const currency = store.settings.currency
  const locale = store.settings.locale

  if (!total) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed text-center">
        <p className="font-medium">No spend to chart yet</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Add your first expense and the pie will fill in by category.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Spend mix</p>
        {!compact && (
          <div className="flex rounded-lg bg-muted p-0.5">
            <Button
              size="xs"
              variant={mode === "pie" ? "secondary" : "ghost"}
              onClick={() => setMode("pie")}
            >
              Pie
            </Button>
            <Button
              size="xs"
              variant={mode === "bar" ? "secondary" : "ghost"}
              onClick={() => setMode("bar")}
            >
              Bar
            </Button>
          </div>
        )}
      </div>
      {mode === "pie" || compact ? (
        <ChartContainer
          config={{}}
          className={compact ? "aspect-square h-36" : "mx-auto aspect-square h-[280px]"}
        >
          <PieChart>
            <Pie
              data={visible}
              dataKey="amount"
              nameKey="name"
              innerRadius={compact ? 28 : 62}
              outerRadius={compact ? 52 : 104}
              paddingAngle={2}
              stroke="transparent"
            >
              {visible.map((slice) => (
                <Cell key={slice.id} fill={slice.color} />
              ))}
            </Pie>
            {!compact && (
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null
                  const slice = payload[0].payload as (typeof visible)[number]
                  return (
                    <div className="rounded-lg bg-popover px-3 py-2 text-xs shadow-md ring-1 ring-foreground/10">
                      <p className="font-medium">{slice.name}</p>
                      <p className="text-muted-foreground">
                        {formatMoney(slice.amount, currency, locale)} · {percent(slice.amount, total)}%
                      </p>
                    </div>
                  )
                }}
              />
            )}
          </PieChart>
        </ChartContainer>
      ) : (
        <ChartContainer config={{}} className="h-[280px] w-full">
          <BarChart data={visible}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} height={60} />
            <YAxis tick={{ fontSize: 11 }} />
            <RechartsTooltip
              formatter={(value) => formatMoney(Number(value), currency, locale)}
            />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
              {visible.map((slice) => (
                <Cell key={slice.id} fill={slice.color} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
      {!compact && (
        <ul className="flex flex-wrap gap-2">
          {categorySlices(store, month).map((slice) => (
            <li key={slice.id}>
              <button
                type="button"
                onClick={() => {
                  setHidden((current) => {
                    const next = new Set(current)
                    if (next.has(slice.id)) next.delete(slice.id)
                    else next.add(slice.id)
                    return next
                  })
                }}
                className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-opacity"
                style={{ opacity: hidden.has(slice.id) ? 0.35 : 1 }}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ background: slice.color }}
                />
                {slice.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function MiniPie({ store, month }: Props) {
  const slices = categorySlices(store, month).filter((slice) => slice.amount > 0)
  if (!slices.length) {
    return <div className="size-12 rounded-full bg-muted" />
  }
  return (
    <ChartContainer config={{}} className="size-12 aspect-square">
      <PieChart>
        <Pie data={slices} dataKey="amount" innerRadius={8} outerRadius={22} stroke="transparent">
          {slices.map((slice) => (
            <Cell key={slice.id} fill={slice.color} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
