"use client"

import { ThemeProvider } from "next-themes"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { BudgetProvider } from "@/components/budget-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <BudgetProvider>
          {children}
          <Toaster />
        </BudgetProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}
