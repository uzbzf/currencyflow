import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeftRight,
  ArrowUpDown,
  Check,
  Copy,
  Download,
  Loader2,
  RefreshCw,
  Share2,
  Sparkles,
  TrendingUp,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { CURRENCY_MAP, FEE_PERCENTS, STORAGE_KEYS } from './constants/currencies'
import { CommissionToggle } from './components/CommissionToggle'
import { ConversionReceipt } from './components/ConversionReceipt'
import { CurrencySelect } from './components/CurrencySelect'
import { HistorySection } from './components/HistorySection'
import { MultiCurrencyGrid } from './components/MultiCurrencyGrid'
import { QuickAmounts } from './components/QuickAmounts'
import { RateCards } from './components/RateCards'
import { RateTrendChart } from './components/RateTrendChart'
import { ShareModal } from './components/ShareModal'
import { ThemeToggle } from './components/ThemeToggle'
import { Toast } from './components/Toast'
import { useHistory } from './hooks/useHistory'
import { useRates } from './hooks/useRates'
import { useTheme } from './hooks/useTheme'
import {
  formatAmount,
  formatGroupedNumber,
  formatInputAmount,
  formatRate,
  formatTime,
} from './utils/format'
import { detectLocalCurrency } from './utils/geoCurrency'
import {
  evaluateExpression,
  looksLikeExpression,
  sanitizeExpressionInput,
} from './utils/mathExpression'
import { buildReceiptFilename, downloadReceiptPng } from './utils/downloadReceipt'
import { buildSharePayload, parseShareParams } from './utils/share'
import { playClick } from './utils/sounds'

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ?? fallback
  } catch {
    return fallback
  }
}

function hasStoredKey(key) {
  try {
    return localStorage.getItem(key) != null
  } catch {
    return false
  }
}

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const { convert, getRate, loading, error, source, updatedAt, refresh } = useRates()
  const { history, addEntry, clearHistory, removeEntry } = useHistory()

  const [from, setFrom] = useState(() => readStorage(STORAGE_KEYS.from, 'USD'))
  const [to, setTo] = useState(() => readStorage(STORAGE_KEYS.to, 'UZS'))
  const [amount, setAmount] = useState(() => readStorage(STORAGE_KEYS.amount, '100'))
  const [amountDraft, setAmountDraft] = useState(() =>
    formatInputAmount(readStorage(STORAGE_KEYS.amount, '100')),
  )
  const [feeEnabled, setFeeEnabled] = useState(
    () => readStorage(STORAGE_KEYS.feeEnabled, '0') === '1',
  )
  const [feePercent, setFeePercent] = useState(() => {
    const saved = Number(readStorage(STORAGE_KEYS.feePercent, '2'))
    return FEE_PERCENTS.includes(saved) ? saved : 2
  })
  const [swapSpin, setSwapSpin] = useState(false)
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [downloadingReceipt, setDownloadingReceipt] = useState(false)
  const [toast, setToast] = useState(null)
  const [geoDetecting, setGeoDetecting] = useState(
    () => !hasStoredKey(STORAGE_KEYS.from) && !hasStoredKey(STORAGE_KEYS.geoChecked),
  )

  const toastTimer = useRef(null)
  const historyTimer = useRef(null)
  const receiptRef = useRef(null)
  const trackHistoryRef = useRef(false)
  const shouldAutoDetectRef = useRef(geoDetecting)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.from, from)
      localStorage.setItem(STORAGE_KEYS.to, to)
      localStorage.setItem(STORAGE_KEYS.amount, amount)
      localStorage.setItem(STORAGE_KEYS.feeEnabled, feeEnabled ? '1' : '0')
      localStorage.setItem(STORAGE_KEYS.feePercent, String(feePercent))
    } catch {
      /* ignore */
    }
  }, [from, to, amount, feeEnabled, feePercent])

  const expressionPreview = useMemo(() => {
    if (!looksLikeExpression(amountDraft)) return null
    const evaluated = evaluateExpression(amountDraft)
    if (!evaluated.ok) return { ok: false, error: evaluated.error }
    return {
      ok: true,
      value: evaluated.value,
      label: formatGroupedNumber(evaluated.value, {
        maximumFractionDigits: 8,
        minimumFractionDigits: 0,
      }),
    }
  }, [amountDraft])

  const amountValue = useMemo(() => {
    const evaluated = evaluateExpression(amountDraft)
    if (evaluated.ok) return String(evaluated.value)
    return amount
  }, [amountDraft, amount])

  const result = useMemo(
    () => convert(amountValue, from, to),
    [amountValue, from, to, convert],
  )
  const unitRate = useMemo(() => getRate(from, to), [from, to, getRate])

  const feeAmount = useMemo(() => {
    if (!feeEnabled) return 0
    return (result * feePercent) / 100
  }, [feeEnabled, feePercent, result])

  const netResult = useMemo(() => {
    if (!feeEnabled) return result
    return Math.max(result - feeAmount, 0)
  }, [feeEnabled, feeAmount, result])

  const sharePayload = useMemo(
    () =>
      buildSharePayload({
        amount: amountValue,
        from,
        to,
        result,
        netResult,
        unitRate,
        feeEnabled,
        feePercent,
      }),
    [amountValue, from, to, result, netResult, unitRate, feeEnabled, feePercent],
  )

  const showToast = useCallback((message, type = 'success', duration = 2200) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    setToast({ message, type })
    toastTimer.current = window.setTimeout(() => setToast(null), duration)
  }, [])

  const markHistoryDirty = useCallback(() => {
    trackHistoryRef.current = true
  }, [])

  // Восстановление конвертации из shared-ссылки (?from=&to=&amount=&fee=)
  useEffect(() => {
    const shared = parseShareParams()
    if (!shared) return

    shouldAutoDetectRef.current = false
    setGeoDetecting(false)

    if (shared.from && CURRENCY_MAP[shared.from]) setFrom(shared.from)
    if (shared.to && CURRENCY_MAP[shared.to] && shared.to !== shared.from) setTo(shared.to)
    if (shared.amount != null && shared.amount !== '') {
      setAmount(String(shared.amount))
      setAmountDraft(formatInputAmount(String(shared.amount)))
    }
    if (shared.feeEnabled && FEE_PERCENTS.includes(shared.feePercent)) {
      setFeeEnabled(true)
      setFeePercent(shared.feePercent)
    }

    try {
      localStorage.setItem(STORAGE_KEYS.geoChecked, '1')
      window.history.replaceState({}, '', window.location.pathname)
    } catch {
      /* ignore */
    }
  }, [])

  // Автоопределение базовой валюты по стране (только при первом визите)
  useEffect(() => {
    if (!shouldAutoDetectRef.current) return undefined

    let cancelled = false

    ;(async () => {
      setGeoDetecting(true)
      try {
        const detected = await detectLocalCurrency()
        if (cancelled || !detected?.code) return

        setFrom(detected.code)
        setTo((prev) => {
          if (prev !== detected.code) return prev
          return detected.code === 'USD' ? 'EUR' : 'USD'
        })

        const place = detected.countryName || detected.countryCode
        const meta = CURRENCY_MAP[detected.code]
        showToast(
          place
            ? `Базовая валюта: ${detected.code}${meta ? ` · ${meta.name}` : ''} (${place})`
            : `Базовая валюта по региону: ${detected.code}`,
          'success',
          3200,
        )
      } catch {
        /* оставляем дефолт */
      } finally {
        if (!cancelled) {
          try {
            localStorage.setItem(STORAGE_KEYS.geoChecked, '1')
          } catch {
            /* ignore */
          }
          shouldAutoDetectRef.current = false
          setGeoDetecting(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [showToast])

  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    if (historyTimer.current) window.clearTimeout(historyTimer.current)
  }, [])

  // Дебаунс: пишем в историю только после действий пользователя
  useEffect(() => {
    if (!trackHistoryRef.current) return undefined

    if (historyTimer.current) window.clearTimeout(historyTimer.current)

    historyTimer.current = window.setTimeout(() => {
      addEntry({
        amount: amountValue,
        from,
        to,
        result,
        rate: unitRate,
      })
    }, 900)

    return () => {
      if (historyTimer.current) window.clearTimeout(historyTimer.current)
    }
  }, [amountValue, from, to, result, unitRate, addEntry])

  const handleFromChange = (code) => {
    markHistoryDirty()
    if (code === to) setTo(from)
    setFrom(code)
  }

  const handleToChange = (code) => {
    markHistoryDirty()
    if (code === from) setFrom(to)
    setTo(code)
  }

  const handleSwap = () => {
    playClick('swap')
    markHistoryDirty()
    setSwapSpin(true)
    setFrom(to)
    setTo(from)
    window.setTimeout(() => setSwapSpin(false), 350)
  }

  const handleSelectPair = (pairFrom, pairTo) => {
    markHistoryDirty()
    setFrom(pairFrom)
    setTo(pairTo)
  }

  const handleMakeBase = (code) => {
    if (code === from) return
    markHistoryDirty()
    if (code === to) {
      setTo(from)
    }
    setFrom(code)
    showToast(`Базовая валюта: ${code}`)
  }

  const commitAmountExpression = useCallback(
    (raw = amountDraft) => {
      const evaluated = evaluateExpression(raw)
      if (!evaluated.ok) return false

      const next = String(evaluated.value)
      markHistoryDirty()
      setAmount(next)
      setAmountDraft(formatInputAmount(next))
      return true
    },
    [amountDraft, markHistoryDirty],
  )

  const handleAmountChange = (value) => {
    markHistoryDirty()
    const sanitized = sanitizeExpressionInput(value)
    setAmountDraft(sanitized)

    const evaluated = evaluateExpression(sanitized)
    if (evaluated.ok) {
      setAmount(String(evaluated.value))
    }
  }

  const handleAmountKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitAmountExpression()
      event.currentTarget.blur()
    }
  }

  const handleAmountBlur = () => {
    commitAmountExpression()
  }

  const handleQuickAdd = (value) => {
    markHistoryDirty()
    const evaluated = evaluateExpression(amountDraft)
    const current = evaluated.ok ? evaluated.value : Number(amount)
    const base = Number.isFinite(current) ? current : 0
    const next = String(base + value)
    setAmount(next)
    setAmountDraft(formatInputAmount(next))
  }

  const handleCopyResult = async () => {
    const value = feeEnabled ? netResult : result
    const text = feeEnabled
      ? `${formatAmount(value, to)} ${to} (после комиссии ${feePercent}%)`
      : `${formatAmount(value, to)} ${to}`
    try {
      await navigator.clipboard.writeText(text)
      playClick('copy')
      setCopied(true)
      showToast('Скопировано в буфер обмена')
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      showToast('Не удалось скопировать', 'error')
    }
  }

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(sharePayload.shareUrl)
      setLinkCopied(true)
      showToast('Ссылка скопирована')
      window.setTimeout(() => setLinkCopied(false), 1800)
    } catch {
      showToast('Не удалось скопировать ссылку', 'error')
    }
  }

  const handleDownloadReceipt = async () => {
    if (downloadingReceipt) return
    setDownloadingReceipt(true)
    try {
      await downloadReceiptPng(receiptRef.current, buildReceiptFilename(from, to))
      showToast('Чек успешно сохранен!')
    } catch {
      showToast('Не удалось сохранить чек', 'error')
    } finally {
      setDownloadingReceipt(false)
    }
  }

  const handleRestore = (item) => {
    trackHistoryRef.current = false
    setAmount(item.amount)
    setAmountDraft(formatInputAmount(item.amount))
    setFrom(item.from)
    setTo(item.to)
    showToast('Расчёт восстановлен')
  }

  const fromMeta = CURRENCY_MAP[from]
  const toMeta = CURRENCY_MAP[to]
  const isLive = source === 'live'
  const isPartial = source === 'partial'

  const statusText = geoDetecting
    ? 'Определяем валюту по региону…'
    : loading
      ? 'Загрузка курсов…'
      : isLive
        ? `Живые курсы · ${formatTime(updatedAt)}`
        : isPartial
          ? `Фиат онлайн · крипта из резерва`
          : 'Резервные курсы'

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-5xl px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:py-12">
      <header className="animate-fade-up mb-5 flex items-start justify-between gap-3 sm:mb-8 sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-accent/25 bg-surface-elevated/90 px-2.5 py-1 text-[11px] font-semibold text-accent shadow-sm backdrop-blur sm:mb-3 sm:gap-2 sm:px-3 sm:text-xs">
            <Sparkles className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
            <span className="truncate">CurrencyFlow</span>
          </div>
          <h1 className="font-display text-[1.65rem] font-bold leading-tight tracking-tight text-ink xs:text-3xl sm:text-4xl md:text-5xl">
            Конвертер валют
            <span className="mt-1 block bg-gradient-to-r from-accent to-teal-500 bg-clip-text text-transparent dark:to-teal-300">
              &amp; криптовалют
            </span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted sm:mt-3 sm:text-base">
            <span className="sm:hidden">Мгновенный пересчёт фиата и крипты с живыми курсами.</span>
            <span className="hidden sm:inline">
              Мгновенный пересчёт между фиатом и криптой. Курсы подтягиваются из открытых API с
              надёжным резервом на случай сбоя.
            </span>
          </p>
        </div>
        <div className="shrink-0 pt-0.5">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      <main className="space-y-6 sm:space-y-8">
        <section className="panel-surface animate-fade-up-delay-1 overflow-visible rounded-2xl border border-border/80 bg-surface-elevated/95 p-4 shadow-xl shadow-teal-900/5 backdrop-blur sm:rounded-[1.75rem] sm:p-8 dark:shadow-black/20">
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2 text-xs text-ink-muted sm:text-sm">
              {isLive || isPartial ? (
                <Wifi className="h-4 w-4 shrink-0 text-accent" />
              ) : (
                <WifiOff className="h-4 w-4 shrink-0 text-amber-500" />
              )}
              <span className="min-w-0 truncate">{statusText}</span>
              {(loading || geoDetecting) && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-accent animate-pulse-soft" />
              )}
            </div>

            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-xs font-semibold text-ink transition-all duration-300 hover:border-accent hover:bg-surface-muted/80 hover:text-accent active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-h-0 sm:py-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-xs leading-relaxed text-amber-700 sm:mb-5 sm:px-4 sm:text-sm dark:text-amber-300">
              {error}
            </div>
          )}

          <div className="grid gap-3 sm:gap-4">
            <div className="origin-center rounded-2xl border border-border bg-surface-muted/50 p-3 shadow-sm transition-all duration-300 hover:z-10 hover:scale-105 hover:shadow-lg sm:p-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  Сумма
                  <span className="ml-2 font-medium normal-case tracking-normal text-ink-muted/80">
                    · можно 100+50*2
                  </span>
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base font-semibold text-ink-muted sm:left-4 sm:text-lg">
                    {fromMeta?.symbol}
                  </span>
                  <input
                    type="text"
                    inputMode="text"
                    enterKeyHint="done"
                    autoComplete="off"
                    spellCheck={false}
                    value={amountDraft}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    onKeyDown={handleAmountKeyDown}
                    onBlur={handleAmountBlur}
                    placeholder="100 + 50 * 2"
                    className="w-full rounded-2xl border border-border bg-surface-elevated py-3.5 pl-11 pr-3 font-display text-[1.35rem] font-semibold tracking-tight text-ink outline-none transition-all duration-300 placeholder:text-ink-muted/40 hover:shadow-md focus:border-accent focus:ring-2 focus:ring-ring/30 sm:py-4 sm:pl-12 sm:pr-4 sm:text-3xl"
                  />
                </div>
              </label>

              {expressionPreview?.ok && (
                <p className="mt-2 text-xs font-medium text-accent sm:text-sm">
                  = {expressionPreview.label}
                </p>
              )}
              {expressionPreview &&
                !expressionPreview.ok &&
                expressionPreview.error !== 'incomplete' &&
                expressionPreview.error !== 'empty' && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">
                    Некорректное выражение
                  </p>
                )}

              <QuickAmounts onAdd={handleQuickAdd} />
            </div>

            <div className="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-end sm:gap-3">
              <div className="origin-center min-w-0 rounded-2xl border border-border bg-surface-muted/50 p-3 shadow-sm transition-all duration-300 hover:z-10 hover:scale-105 hover:shadow-lg">
                <CurrencySelect
                  id="from-currency"
                  label="Из"
                  value={from}
                  onChange={handleFromChange}
                  disabledCodes={[to]}
                />
              </div>

              <div className="relative z-20 flex justify-center sm:mb-1 sm:block">
                <div className="pointer-events-none absolute inset-x-8 top-1/2 h-px bg-border sm:hidden" />
                <button
                  type="button"
                  onClick={handleSwap}
                  aria-label="Поменять валюты местами"
                  className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white shadow-lg shadow-teal-900/20 transition-all duration-300 hover:bg-accent/80 active:scale-95 sm:mx-auto"
                >
                  <ArrowUpDown className={`h-5 w-5 sm:hidden ${swapSpin ? 'swap-spin' : ''}`} />
                  <ArrowLeftRight className={`hidden h-5 w-5 sm:block ${swapSpin ? 'swap-spin' : ''}`} />
                </button>
              </div>

              <div className="origin-center min-w-0 rounded-2xl border border-border bg-surface-muted/50 p-3 shadow-sm transition-all duration-300 hover:z-10 hover:scale-105 hover:shadow-lg">
                <CurrencySelect
                  id="to-currency"
                  label="В"
                  value={to}
                  onChange={handleToChange}
                  disabledCodes={[from]}
                />
              </div>
            </div>

            <RateTrendChart from={from} to={to} currentRate={unitRate} theme={theme} />

            <CommissionToggle
              enabled={feeEnabled}
              percent={feePercent}
              onToggle={() => setFeeEnabled((prev) => !prev)}
              onPercentChange={setFeePercent}
            />

            <div className="relative mt-1 origin-center overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-br from-accent-soft/80 to-surface-muted p-4 shadow-sm transition-all duration-300 hover:z-10 hover:scale-105 hover:shadow-lg sm:mt-2 sm:p-6">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/10 blur-2xl" />
              <div className="relative min-w-0">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    <TrendingUp className="h-3.5 w-3.5 shrink-0 text-accent" />
                    {feeEnabled ? 'Итого к получению' : 'Результат'}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadReceipt}
                      disabled={downloadingReceipt}
                      aria-label="Скачать чек"
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-surface-elevated/80 px-2.5 py-1.5 text-xs font-semibold text-ink transition-all duration-300 hover:border-accent hover:bg-accent/80 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {downloadingReceipt ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      {downloadingReceipt ? 'Сохранение…' : 'Скачать чек'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShareOpen(true)}
                      aria-label="Поделиться результатом"
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-surface-elevated/80 px-2.5 py-1.5 text-xs font-semibold text-ink transition-all duration-300 hover:border-accent hover:bg-accent/80 hover:text-white active:scale-95"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Поделиться
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyResult}
                      aria-label="Скопировать результат"
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-surface-elevated/80 px-2.5 py-1.5 text-xs font-semibold text-ink transition-all duration-300 hover:border-accent hover:bg-surface-elevated/60 hover:text-accent active:scale-95"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-accent" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copied ? 'Скопировано' : 'Копировать'}
                    </button>
                  </div>
                </div>
                <p className="break-words font-display text-[1.75rem] font-bold leading-tight tracking-tight text-ink [overflow-wrap:anywhere] sm:text-4xl">
                  {formatAmount(netResult, to)}{' '}
                  <span className="text-lg font-semibold text-accent sm:text-2xl">{to}</span>
                </p>

                {feeEnabled && (
                  <div className="mt-3 space-y-1.5 rounded-xl border border-border/70 bg-surface-elevated/50 px-3 py-2.5 text-xs sm:text-sm">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-ink-muted">
                      <span>Без комиссии</span>
                      <span className="font-semibold text-ink">
                        {formatAmount(result, to)} {to}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-ink-muted">
                      <span>Комиссия ({feePercent}%)</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-300">
                        −{formatAmount(feeAmount, to)} {to}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border/70 pt-1.5">
                      <span className="font-semibold text-ink">Итого</span>
                      <span className="font-semibold text-accent">
                        {formatAmount(netResult, to)} {to}
                      </span>
                    </div>
                  </div>
                )}

                <p className="mt-2 break-words text-xs leading-relaxed text-ink-muted [overflow-wrap:anywhere] sm:text-sm">
                  1 {from} = {formatRate(unitRate, from, to)} {to}
                  {toMeta ? ` · ${toMeta.name}` : ''}
                </p>
              </div>
            </div>
          </div>
        </section>

        <MultiCurrencyGrid
          amount={amountValue}
          baseCurrency={from}
          convert={convert}
          onMakeBase={handleMakeBase}
        />

        <RateCards getRate={getRate} onSelectPair={handleSelectPair} />

        <HistorySection
          history={history}
          onRestore={handleRestore}
          onClear={clearHistory}
          onRemove={removeEntry}
        />
      </main>

      <footer className="mt-8 border-t border-border px-1 pt-5 text-center text-[11px] leading-relaxed text-ink-muted sm:mt-12 sm:pt-6 sm:text-xs">
        Данные: ExchangeRate-API · CoinGecko · резервные курсы при недоступности сети
      </footer>

      <Toast toast={toast} />

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        theme={theme}
        shareText={sharePayload.shareText}
        shareUrl={sharePayload.shareUrl}
        amount={amountValue}
        from={from}
        to={to}
        netResult={netResult}
        unitRate={unitRate}
        feeEnabled={feeEnabled}
        feePercent={feePercent}
        onCopyLink={handleCopyShareLink}
        linkCopied={linkCopied}
      />

      {/* Off-screen чек для html2canvas */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-10000px',
          top: 0,
          pointerEvents: 'none',
        }}
      >
        <ConversionReceipt
          ref={receiptRef}
          amount={amountValue}
          from={from}
          to={to}
          fromName={fromMeta?.name}
          toName={toMeta?.name}
          unitRate={unitRate}
          result={result}
          netResult={netResult}
          feeEnabled={feeEnabled}
          feePercent={feePercent}
          feeAmount={feeAmount}
        />
      </div>
    </div>
  )
}
