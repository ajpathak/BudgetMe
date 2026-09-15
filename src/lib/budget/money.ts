export function formatMoney(
  amount: number,
  currency = "INR",
  locale = "en-IN"
) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount)
  } catch {
    return `₹${amount.toLocaleString("en-IN")}`
  }
}

export function formatCompact(amount: number, currency = "INR", locale = "en-IN") {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount)
  } catch {
    return formatMoney(amount, currency, locale)
  }
}

export function parseAmount(raw: string) {
  const cleaned = raw.replace(/[^\d.]/g, "")
  const value = Number.parseFloat(cleaned)
  if (!Number.isFinite(value) || value < 0) return null
  return Math.round(value * 100) / 100
}

export function percent(part: number, whole: number) {
  if (whole <= 0) return 0
  return Math.round((part / whole) * 1000) / 10
}
