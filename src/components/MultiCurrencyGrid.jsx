import { useMemo, useState } from 'react'
import { ArrowUpRight, LayoutGrid, Search, X } from 'lucide-react'
import { CURRENCIES } from '../constants/currencies'
import { formatAmount, formatInputAmount } from '../utils/format'

/** Доп. алиасы для поиска на русском/английском */
const SEARCH_ALIASES = {
  USD: ['доллар', 'dollar', 'бакс', 'usd'],
  EUR: ['евро', 'euro', 'eur'],
  CNY: ['юань', 'yuan', 'кнй', 'cny', 'китай'],
  RUB: ['рубль', 'руб', 'ruble', 'rub'],
  UZS: ['сум', 'som', 'узб', 'uzs'],
  KZT: ['тенге', 'tenge', 'kzt'],
  BTC: ['bitcoin', 'биткоин', 'биток', 'btc'],
  ETH: ['ethereum', 'эфир', 'эфириум', 'eth'],
}

function normalizeQuery(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
}

function matchesCurrency(currency, query) {
  if (!query) return true
  const haystack = [
    currency.code,
    currency.name,
    currency.symbol,
    ...(SEARCH_ALIASES[currency.code] || []),
  ]
    .join(' ')
    .toLowerCase()
    .replace(/ё/g, 'е')

  return haystack.includes(query)
}

export function MultiCurrencyGrid({ amount, baseCurrency, convert, onMakeBase }) {
  const [query, setQuery] = useState('')
  const normalized = normalizeQuery(query)

  const others = useMemo(
    () =>
      CURRENCIES.filter(
        (c) => c.code !== baseCurrency && matchesCurrency(c, normalized),
      ),
    [baseCurrency, normalized],
  )

  const displayAmount = formatInputAmount(amount) || '0'

  return (
    <section className="animate-fade-up-delay-2">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink sm:text-2xl">
            Курсы во всех валютах
          </h2>
          <p className="mt-1 text-xs text-ink-muted sm:text-sm">
            {displayAmount} {baseCurrency} → пересчёт по всем доступным валютам
          </p>
        </div>
        <LayoutGrid className="hidden h-6 w-6 shrink-0 text-accent sm:block" />
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск: USD, Сум, Евро, Bitcoin…"
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-2xl border border-border bg-surface-elevated py-3 pl-10 pr-10 text-sm font-medium text-ink shadow-sm outline-none transition-all duration-300 placeholder:text-ink-muted/60 hover:border-accent/50 focus:border-accent focus:ring-2 focus:ring-ring/30"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Очистить поиск"
            className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {others.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-elevated/70 px-4 py-10 text-center text-sm text-ink-muted shadow-sm">
          Ничего не найдено по запросу «{query}»
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((currency) => {
            const converted = convert(amount, baseCurrency, currency.code)

            return (
              <article
                key={currency.code}
                className="group relative overflow-hidden rounded-2xl border border-border bg-surface-elevated p-4 shadow-[0_8px_24px_rgba(16,35,30,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_14px_34px_rgba(15,118,110,0.12)] dark:shadow-sm dark:hover:shadow-lg"
              >
                <div className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100" />

                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-muted text-xl transition-colors duration-300 group-hover:bg-accent-soft">
                      {currency.flag}
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-base font-semibold tracking-tight text-ink">
                        {currency.code}
                      </p>
                      <p className="truncate text-xs text-ink-muted sm:text-sm">{currency.name}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-ink-muted">
                    {currency.symbol}
                  </span>
                </div>

                <p className="break-words font-display text-2xl font-semibold tracking-tight text-ink [overflow-wrap:anywhere]">
                  {formatAmount(converted, currency.code)}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {displayAmount} {baseCurrency} → {currency.code}
                </p>

                <div className="mt-3 min-h-9">
                  <button
                    type="button"
                    onClick={() => onMakeBase(currency.code)}
                    className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-muted px-3 py-2 text-xs font-semibold text-ink opacity-100 transition-all duration-300 hover:border-accent hover:bg-accent/80 hover:text-white active:scale-[0.98] sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Сделать базовой
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
