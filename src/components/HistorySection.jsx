import { ArrowRight, Clock3, Trash2 } from 'lucide-react'
import { CURRENCY_MAP } from '../constants/currencies'
import { formatAmount, formatRate } from '../utils/format'

function formatHistoryTime(timestamp) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function HistorySection({ history, onRestore, onClear, onRemove }) {
  return (
    <section className="animate-fade-up-delay-2">
      <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink sm:text-2xl">
            История последних расчётов
          </h2>
          <p className="mt-1 text-xs text-ink-muted sm:text-sm">
            Сохраняется локально — нажмите запись, чтобы повторить
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Clock3 className="hidden h-6 w-6 text-accent sm:block" />
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-border bg-surface-elevated px-2.5 py-1.5 text-xs font-semibold text-ink-muted transition-all hover:border-accent hover:text-accent active:scale-95"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Очистить
            </button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-elevated/60 px-4 py-8 text-center text-sm text-ink-muted">
          Пока пусто — сделайте конвертацию, и она появится здесь
        </div>
      ) : (
        <ul className="grid gap-2.5 sm:gap-3">
          {history.map((item, index) => {
            const fromMeta = CURRENCY_MAP[item.from]
            const toMeta = CURRENCY_MAP[item.to]

            return (
              <li
                key={item.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(index, 5) * 0.04}s` }}
              >
                <div className="group relative flex overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-sm transition-all duration-300 hover:border-accent hover:shadow-md">
                  <button
                    type="button"
                    onClick={() => onRestore(item)}
                    className="min-w-0 flex-1 p-3.5 text-left sm:p-4"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-ink sm:text-sm">
                        <span>{fromMeta?.flag}</span>
                        <span>{item.from}</span>
                        <ArrowRight className="h-3 w-3 text-ink-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-accent" />
                        <span>{toMeta?.flag}</span>
                        <span>{item.to}</span>
                      </div>
                      <time className="text-[11px] text-ink-muted sm:text-xs" dateTime={new Date(item.at).toISOString()}>
                        {formatHistoryTime(item.at)}
                      </time>
                    </div>

                    <p className="break-words font-display text-base font-semibold tracking-tight text-ink [overflow-wrap:anywhere] sm:text-lg">
                      {formatAmount(item.amount, item.from)} {item.from}
                      <span className="mx-1.5 text-ink-muted">→</span>
                      <span className="text-accent">
                        {formatAmount(item.result, item.to)} {item.to}
                      </span>
                    </p>
                    <p className="mt-1 text-[11px] text-ink-muted sm:text-xs">
                      курс {formatRate(item.rate, item.from, item.to)}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    aria-label="Удалить из истории"
                    className="flex w-11 shrink-0 items-center justify-center border-l border-border text-ink-muted transition-colors hover:bg-accent-soft hover:text-accent active:scale-95"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
