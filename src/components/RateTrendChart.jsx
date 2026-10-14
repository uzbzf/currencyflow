import { useId, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChevronDown, TrendingDown, TrendingUp, Activity } from 'lucide-react'
import { useRateHistory } from '../hooks/useRateHistory'
import { formatRate } from '../utils/format'

function ChartTooltip({ active, payload, label, from, to }) {
  if (!active || !payload?.length) return null
  const rate = payload[0]?.value

  return (
    <div className="rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-ink">{label}</p>
      <p className="mt-0.5 text-accent">
        1 {from} = {formatRate(rate, from, to)} {to}
      </p>
    </div>
  )
}

export function RateTrendChart({ from, to, currentRate, theme }) {
  const [open, setOpen] = useState(true)
  const gradientId = useId().replace(/:/g, '')
  const { points, source, loading, change } = useRateHistory(from, to, currentRate)

  const isDark = theme === 'dark'
  const isUp = change.direction === 'up'
  const isDown = change.direction === 'down'

  const stroke = isUp ? '#10b981' : isDown ? '#f43f5e' : '#14b8a6'
  const gridStroke = isDark ? 'rgba(232,247,242,0.06)' : 'rgba(16,35,30,0.06)'
  const tickFill = isDark ? '#8aa39a' : '#5a6f68'

  const domain = useMemo(() => {
    if (!points.length) return ['auto', 'auto']
    const rates = points.map((p) => p.rate)
    const min = Math.min(...rates)
    const max = Math.max(...rates)
    const pad = (max - min) * 0.18 || max * 0.01
    return [Math.max(0, min - pad), max + pad]
  }, [points])

  const changeLabel = `${change.percent >= 0 ? '+' : ''}${change.percent.toFixed(2)}%`

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface-muted/40 shadow-sm transition-all duration-300">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors duration-300 hover:bg-surface-elevated/50 sm:px-4"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Activity className="h-4 w-4 shrink-0 text-accent" />
            <h3 className="text-sm font-semibold text-ink sm:text-base">
              Динамика курса за 7 дней
            </h3>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                isUp
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                  : isDown
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                    : 'bg-surface-elevated text-ink-muted'
              }`}
            >
              {isUp ? (
                <TrendingUp className="h-3 w-3" />
              ) : isDown ? (
                <TrendingDown className="h-3 w-3" />
              ) : null}
              {changeLabel}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-ink-muted sm:text-xs">
            {from} → {to}
            {source === 'live' ? ' · данные API' : ' · модельные данные'}
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-ink-muted transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border px-2 pb-3 pt-2 sm:px-3 sm:pb-4">
            {loading ? (
              <div className="flex h-44 items-center justify-center text-sm text-ink-muted">
                Загружаем динамику…
              </div>
            ) : points.length < 2 ? (
              <div className="flex h-44 items-center justify-center text-sm text-ink-muted">
                Недостаточно данных для графика
              </div>
            ) : (
              <div className="h-48 w-full sm:h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`rateFill-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={gridStroke} vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: tickFill, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      dy={6}
                    />
                    <YAxis
                      domain={domain}
                      width={52}
                      tick={{ fill: tickFill, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => {
                        if (v >= 1000) return `${(v / 1000).toFixed(1)}k`
                        if (v >= 1) return v.toFixed(2)
                        return v.toPrecision(2)
                      }}
                    />
                    <Tooltip
                      content={<ChartTooltip from={from} to={to} />}
                      cursor={{ stroke: stroke, strokeOpacity: 0.35 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rate"
                      stroke={stroke}
                      strokeWidth={2.5}
                      fill={`url(#rateFill-${gradientId})`}
                      animationDuration={700}
                      activeDot={{
                        r: 5,
                        strokeWidth: 2,
                        stroke: isDark ? '#0f1a17' : '#fff',
                        fill: stroke,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
