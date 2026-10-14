import { Percent } from 'lucide-react'
import { FEE_PERCENTS } from '../constants/currencies'

export function CommissionToggle({ enabled, percent, onToggle, onPercentChange }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/40 p-3 transition-all duration-300 sm:p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Percent className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Учесть комиссию банка/обменника</p>
            <p className="text-[11px] text-ink-muted sm:text-xs">
              Итог будет показан за вычетом комиссии
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Учесть комиссию банка или обменника"
          onClick={onToggle}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-all duration-300 ${
            enabled ? 'bg-accent' : 'bg-border'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-300 ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div
        className={`grid transition-all duration-300 ${
          enabled
            ? 'mt-3 grid-rows-[1fr] opacity-100'
            : 'mt-0 grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Процент комиссии">
            {FEE_PERCENTS.map((value) => {
              const active = percent === value
              return (
                <button
                  key={value}
                  type="button"
                  disabled={!enabled}
                  onClick={() => onPercentChange(value)}
                  className={`min-h-9 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all duration-300 active:scale-95 sm:text-[13px] ${
                    active
                      ? 'border-accent bg-accent text-white shadow-sm'
                      : 'border-border bg-surface-elevated text-ink hover:border-accent hover:bg-accent/80 hover:text-white'
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {value}%
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
