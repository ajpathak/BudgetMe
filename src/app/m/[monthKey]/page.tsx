"use client"

import { useParams } from "next/navigation"
import { MonthDashboard } from "@/components/month-dashboard"

export default function MonthPage() {
  const params = useParams<{ monthKey: string }>()
  const monthKey = params.monthKey
  if (!/^\d{4}-\d{2}$/.test(monthKey)) {
    return <p className="p-8 text-sm text-muted-foreground">That is not a valid month.</p>
  }
  return <MonthDashboard monthKey={monthKey} />
}
