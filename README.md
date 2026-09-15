# BudgetMe

Personal monthly budgeting app: log expenses for the current month, watch a live pie chart, and reopen any past month from a year → month archive.

21st.dev MCP is not available in this Project conversation, so the UI is built with **Next.js, Tailwind, and shadcn/ui**, styled as a calm finance dashboard (card layout, consistent category colors, sticky spend header).

## Run locally

```bash
npm install
npm run dev -- --port 43127 --hostname 127.0.0.1
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

## What you can do

- Add, edit, and delete expenses (amount, category, date, note, payment method, optional repeat-monthly)
- Set a total monthly budget and per-category caps with green → amber → red progress
- Live pie/donut chart (toggle slices, switch to a bar chart)
- History archive with month cards, year trend, and category/amount search
- Side-by-side month comparison with a delta table
- CSV/JSON export and import, dark mode, INR by default (USD/EUR/GBP in Settings)

Data lives in `localStorage` under `budgetme:v1` via a small repository in `src/lib/budget/repository.ts`. Swap that file for a REST backend later without rewriting the screens. First visit loads sample months so charts are not empty; Settings can clear or reload the demo.

## Stack

Next.js (App Router) · TypeScript · Tailwind v4 · shadcn/ui · Recharts · date-fns
