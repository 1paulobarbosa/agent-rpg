const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'] as const

/** Short number for HUDs: 950, 12.3K, 4.56M ... and scientific notation past the suffixes. */
export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return '∞'
  const abs = Math.abs(value)
  if (abs < 1000) return String(Math.round(value))
  const tier = Math.floor(Math.log10(abs) / 3)
  if (tier >= SUFFIXES.length) return value.toExponential(2).replace('e+', 'e')
  const scaled = value / Math.pow(1000, tier)
  const digits = Math.abs(scaled) >= 100 ? 0 : Math.abs(scaled) >= 10 ? 1 : 2
  return `${scaled.toFixed(digits)}${SUFFIXES[tier]}`
}
