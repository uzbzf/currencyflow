import { formatAmount, formatRate } from './format'

export function buildShareUrl({ amount, from, to, feeEnabled, feePercent }) {
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.set('from', from)
  url.searchParams.set('to', to)
  url.searchParams.set('amount', String(amount || '0'))
  if (feeEnabled) {
    url.searchParams.set('fee', String(feePercent))
  } else {
    url.searchParams.delete('fee')
  }
  return url.toString()
}

export function buildSharePayload({
  amount,
  from,
  to,
  result,
  netResult,
  unitRate,
  feeEnabled,
  feePercent,
}) {
  const shareUrl = buildShareUrl({ amount, from, to, feeEnabled, feePercent })
  const lines = [
    'CurrencyFlow — конвертация',
    `${formatAmount(amount, from)} ${from} → ${formatAmount(netResult, to)} ${to}`,
    `Курс: 1 ${from} = ${formatRate(unitRate, from, to)} ${to}`,
  ]

  if (feeEnabled) {
    lines.push(`Комиссия: ${feePercent}%`)
    lines.push(`Без комиссии: ${formatAmount(result, to)} ${to}`)
  }

  lines.push(shareUrl)

  return {
    shareUrl,
    shareText: lines.join('\n'),
  }
}

export function parseShareParams(search = window.location.search) {
  const params = new URLSearchParams(search)
  const from = params.get('from')
  const to = params.get('to')
  const amount = params.get('amount')
  const fee = params.get('fee')

  if (!from && !to && !amount) return null

  return {
    from,
    to,
    amount,
    feeEnabled: fee != null && fee !== '' && Number(fee) > 0,
    feePercent: Number(fee) || 0,
  }
}
