import { ArrowRight, Bitcoin, Coins } from 'lucide-react'
import { CURRENCY_MAP, POPULAR_PAIRS } from '../constants/currencies'
import { formatRate } from '../utils/format'

export function RateCards({ getRate, onSelectPair }) {
  return (
    <section className="animate-fade-up-delay-2">
      <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink sm:text-2xl">
            Популярные курсы
          </h2>
          <p className="mt-1 text-xs text-ink-muted sm:text-sm">
            <span className="sm:hidden">Нажмите пару, чтобы выбрать</span>
            <span className="hidden sm:inline">
              Актуальные пары на сегодня — нажмите, чтобы выбрать
            </span>
          </p>
        </div>
        <Coins className="hidden h-6 w-6 shrink-0 text-accent sm:block" />
      </div>

      <div className="grid grid-cols-1 gap-2.5 xs:grid-cols-2 sm:gap-3 lg:grid-cols-3">
        {POPULAR_PAIRS.map(({ from, to }) => {
          const rate = getRate(from, to)
          const fromMeta = CURRENCY_MAP[from]
          const toMeta = CURRENCY_MAP[to]
          const isCrypto = fromMeta?.type === 'crypto' || toMeta?.type === 'crypto'

          return (
            <button
              key={`${from}-${to}`}
              type="button"
              onClick={() => onSelectPair(from, to)}
              className="group relative min-h-[7.5rem] overflow-hidden rounded-2xl border border-border bg-surface-elevated p-3.5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:shadow-lg active:scale-[0.98] active:border-accent sm:min-h-0 sm:p-4"
            >
              <div className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100 group-active:scale-x-100" />

              <div className="mb-2.5 flex items-center justify-between gap-2 sm:mb-3">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs font-semibold text-ink sm:gap-2 sm:text-sm">
                  <span className="text-sm sm:text-base">{fromMeta?.flag}</span>
                  <span>{from}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-ink-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-accent sm:h-3.5 sm:w-3.5" />
                  <span className="text-sm sm:text-base">{toMeta?.flag}</span>
                  <span>{to}</span>
                </div>
                {isCrypto ? (
                  <Bitcoin className="h-4 w-4 shrink-0 text-accent opacity-70" />
                ) : (
                  <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                    Fiat
                  </span>
                )}
              </div>

              <p className="break-words font-display text-xl font-semibold tracking-tight text-ink [overflow-wrap:anywhere] sm:text-2xl">
                {formatRate(rate, from, to)}
              </p>
              <p className="mt-1 break-words text-[11px] text-ink-muted [overflow-wrap:anywhere] sm:text-xs">
                1 {from} = {formatRate(rate, from, to)} {to}
              </p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
