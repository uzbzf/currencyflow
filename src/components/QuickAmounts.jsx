import { QUICK_AMOUNTS } from '../constants/currencies'
import { formatGroupedNumber } from '../utils/format'

export function QuickAmounts({ onAdd }) {
  return (
    <div className="mt-2.5 flex flex-wrap gap-2" role="group" aria-label="Быстрое добавление суммы">
      {QUICK_AMOUNTS.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onAdd(value)}
          className="min-h-9 rounded-xl border border-border bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-ink transition-all duration-300 hover:border-accent hover:bg-accent/80 hover:text-white active:scale-95 sm:text-[13px]"
        >
          +{formatGroupedNumber(value, { maximumFractionDigits: 0 })}
        </button>
      ))}
    </div>
  )
}
