"use client"

import { MonthDashboard } from "@/components/month-dashboard"
import { currentMonthKey } from "@/lib/budget/dates"

export default function HomePage() {
  return <MonthDashboard monthKey={currentMonthKey()} />
}
