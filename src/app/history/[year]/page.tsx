"use client"

import { useParams } from "next/navigation"
import { YearView } from "@/components/year-view"

export default function YearPage() {
  const params = useParams<{ year: string }>()
  const year = params.year
  if (!year || !/^\d{4}$/.test(year)) {
    return <p className="p-8 text-sm text-muted-foreground">That is not a valid year.</p>
  }
  return <YearView year={year} />
}
