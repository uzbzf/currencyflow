import { ChevronDown } from 'lucide-react'
import { CURRENCIES } from '../constants/currencies'

export function CurrencySelect({ id, label, value, onChange, disabledCodes = [] }) {
  const selected = CURRENCIES.find((c) => c.code === value)

  return (
    <label className="block w-full min-w-0">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
        {label}
      </span>
      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-base sm:text-lg">
          {selected?.flag}
        </div>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-12 w-full appearance-none rounded-2xl border border-border bg-surface-elevated py-3 pl-10 pr-9 text-sm font-semibold text-ink outline-none transition-all duration-300 hover:border-accent/60 hover:shadow-md focus:border-accent focus:ring-2 focus:ring-ring/30 sm:pl-11 sm:pr-10 sm:py-3.5"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code} disabled={disabledCodes.includes(c.code)}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
      </div>
    </label>
  )
}
