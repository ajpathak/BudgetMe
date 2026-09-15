"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBudget } from "@/components/budget-provider"
import { currentMonthKey } from "@/lib/budget/dates"

const CURRENCIES = [
  { code: "INR", locale: "en-IN", label: "Indian Rupee (₹)" },
  { code: "USD", locale: "en-US", label: "US Dollar ($)" },
  { code: "EUR", locale: "en-IE", label: "Euro (€)" },
  { code: "GBP", locale: "en-GB", label: "British Pound (£)" },
]

export function SettingsView() {
  const {
    store,
    updateSettings,
    updateCategory,
    deleteCategory,
    addCategory,
    exportMonth,
    exportAll,
    importJson,
    importCsv,
    loadDemo,
    resetAll,
  } = useBudget()
  const { setTheme, theme } = useTheme()
  const monthKey = currentMonthKey()

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Categories, currency, appearance, and backups — all stay on this device.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Currency</Label>
            <Select
              value={store.settings.currency}
              onValueChange={(code) => {
                const match = CURRENCIES.find((item) => item.code === code)
                if (match) updateSettings({ currency: match.code, locale: match.locale })
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Default monthly budget</Label>
            <Input
              type="number"
              min={0}
              defaultValue={store.settings.defaultTotalBudget ?? ""}
              onBlur={(event) => {
                const value = Number(event.target.value)
                updateSettings({
                  defaultTotalBudget: Number.isFinite(value) && value > 0 ? value : undefined,
                })
              }}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Theme</Label>
            <Select
              value={theme ?? "system"}
              onValueChange={(value) => {
                if (!value) return
                setTheme(value)
                updateSettings({ theme: value as "system" | "light" | "dark" })
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Colors stay consistent on every chart and list.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {store.categories.map((category) => (
            <div key={category.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
              <input
                type="color"
                value={category.color}
                onChange={(event) =>
                  updateCategory({ ...category, color: event.target.value })
                }
                className="size-8 cursor-pointer rounded border bg-transparent"
              />
              <Input
                defaultValue={category.name}
                onBlur={(event) => {
                  const name = event.target.value.trim()
                  if (name && name !== category.name) updateCategory({ ...category, name })
                }}
              />
              <Button variant="ghost" size="sm" onClick={() => deleteCategory(category.id)}>
                Remove
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() => addCategory("New category", "#64748B")}
          >
            Add category
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup</CardTitle>
          <CardDescription>Export JSON or CSV, or restore from a file.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => exportMonth(monthKey, "csv")}>
            Export this month CSV
          </Button>
          <Button variant="outline" onClick={() => exportMonth(monthKey, "json")}>
            Export this month JSON
          </Button>
          <Button variant="outline" onClick={() => exportAll("csv")}>
            Export all CSV
          </Button>
          <Button variant="outline" onClick={() => exportAll("json")}>
            Export all JSON
          </Button>
          <label className="inline-flex h-8 cursor-pointer items-center rounded-lg bg-secondary px-2.5 text-sm font-medium text-secondary-foreground">
            Import JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) return
                importJson(await file.text())
                event.target.value = ""
              }}
            />
          </label>
          <label className="inline-flex h-8 cursor-pointer items-center rounded-lg bg-secondary px-2.5 text-sm font-medium text-secondary-foreground">
            Import CSV
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) return
                importCsv(await file.text(), monthKey)
                event.target.value = ""
              }}
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sample data</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={loadDemo}>Load demo months</Button>
          <Button variant="destructive" onClick={resetAll}>
            Clear everything
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
