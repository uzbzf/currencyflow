import { useEffect, useId } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Copy, Share2, X } from 'lucide-react'
import { formatAmount, formatRate } from '../utils/format'

export function ShareModal({
  open,
  onClose,
  theme,
  shareText,
  shareUrl,
  amount,
  from,
  to,
  netResult,
  unitRate,
  feeEnabled,
  feePercent,
  onCopyLink,
  linkCopied,
}) {
  const titleId = useId()
  const isDark = theme === 'dark'

  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-up"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[1.5rem] border border-border bg-surface-elevated p-5 shadow-2xl animate-fade-up sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              <Share2 className="h-3.5 w-3.5" />
              Поделиться
            </div>
            <h2 id={titleId} className="font-display text-xl font-semibold tracking-tight text-ink">
              QR-код конвертации
            </h2>
            <p className="mt-1 text-xs text-ink-muted sm:text-sm">
              Отсканируйте код, чтобы открыть текущий расчёт
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-muted text-ink transition-all duration-300 hover:border-accent hover:bg-accent/80 hover:text-white active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-border bg-surface-muted/50 px-3 py-3 text-sm">
          <p className="font-display text-base font-semibold text-ink">
            {formatAmount(amount, from)} {from}
            <span className="mx-1.5 text-ink-muted">→</span>
            <span className="text-accent">
              {formatAmount(netResult, to)} {to}
            </span>
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            1 {from} = {formatRate(unitRate, from, to)} {to}
            {feeEnabled ? ` · комиссия ${feePercent}%` : ''}
          </p>
        </div>

        <div className="mx-auto mb-4 flex w-fit items-center justify-center rounded-2xl border border-border bg-white p-4 shadow-sm">
          <QRCodeSVG
            value={shareText}
            size={200}
            level="M"
            includeMargin={false}
            bgColor="#ffffff"
            fgColor={isDark ? '#0f766e' : '#10231e'}
            title="QR-код текущей конвертации"
          />
        </div>

        <div className="mb-4 break-all rounded-xl border border-dashed border-border bg-surface-muted/40 px-3 py-2 text-[11px] leading-relaxed text-ink-muted sm:text-xs">
          {shareUrl}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onCopyLink}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-sm font-semibold text-ink transition-all duration-300 hover:border-accent hover:bg-accent/80 hover:text-white active:scale-[0.98]"
          >
            {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {linkCopied ? 'Ссылка скопирована' : 'Копировать ссылку'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-ink-muted transition-all duration-300 hover:border-accent hover:text-accent active:scale-[0.98] sm:min-w-28"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}
