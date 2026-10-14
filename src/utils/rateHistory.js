const CRYPTO_IDS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
}

const FRANKFURTER_CODES = new Set([
  'USD',
  'EUR',
  'CNY',
  // Frankfurter не всегда стабилен для всех пар — остальные через mock
])

function hashSeed(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed) {
  let a = seed
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function formatDayLabel(date) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
  }).format(date)
}

function buildPoints(values) {
  const today = new Date()
  today.setHours(12, 0, 0, 0)

  return values.map((rate, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (values.length - 1 - index))
    return {
      date: date.toISOString().slice(0, 10),
      label: formatDayLabel(date),
      rate,
    }
  })
}

/**
 * Реалистичный mock: случайное блуждание, последняя точка = текущий курс.
 */
export function generateMockHistory(from, to, currentRate, days = 7) {
  const end = Number(currentRate)
  if (!Number.isFinite(end) || end <= 0) return []

  const rand = mulberry32(hashSeed(`${from}:${to}:v1`))
  const isCrypto = from === 'BTC' || from === 'ETH' || to === 'BTC' || to === 'ETH'
  const volatility = isCrypto ? 0.035 : 0.012

  const series = new Array(days)
  series[days - 1] = end

  for (let i = days - 2; i >= 0; i -= 1) {
    const shock = (rand() - 0.48) * volatility * 2
    const prev = series[i + 1] * (1 - shock)
    series[i] = Math.max(prev, end * 0.7)
  }

  // лёгкое сглаживание
  for (let pass = 0; pass < 2; pass += 1) {
    for (let i = 1; i < days - 1; i += 1) {
      series[i] = series[i] * 0.5 + series[i - 1] * 0.25 + series[i + 1] * 0.25
    }
  }
  series[days - 1] = end

  return buildPoints(series)
}

async function fetchFrankfurterHistory(from, to) {
  if (!FRANKFURTER_CODES.has(from) || !FRANKFURTER_CODES.has(to)) return null

  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 6)

  const startStr = start.toISOString().slice(0, 10)
  const endStr = end.toISOString().slice(0, 10)

  const res = await fetch(
    `https://api.frankfurter.app/${startStr}..${endStr}?from=${from}&to=${to}`,
    { signal: AbortSignal.timeout(6000) },
  )
  if (!res.ok) throw new Error('Frankfurter error')
  const data = await res.json()
  const rates = data?.rates
  if (!rates || typeof rates !== 'object') throw new Error('Invalid frankfurter data')

  const points = Object.keys(rates)
    .sort()
    .map((date) => {
      const rate = rates[date]?.[to]
      if (typeof rate !== 'number') return null
      return {
        date,
        label: formatDayLabel(new Date(`${date}T12:00:00`)),
        rate,
      }
    })
    .filter(Boolean)

  return points.length >= 2 ? points : null
}

async function fetchCryptoHistory(from, to) {
  // CoinGecko: крипта → USD/EUR
  const coin = CRYPTO_IDS[from]
  const vs = to.toLowerCase()
  if (!coin || !['usd', 'eur'].includes(vs)) return null

  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=${vs}&days=7`,
    { signal: AbortSignal.timeout(7000) },
  )
  if (!res.ok) throw new Error('CoinGecko history error')
  const data = await res.json()
  const prices = data?.prices
  if (!Array.isArray(prices) || prices.length < 2) return null

  // Берём по одной точке на день (последняя в сутках)
  const byDay = new Map()
  for (const [ts, price] of prices) {
    if (typeof price !== 'number') continue
    const day = new Date(ts).toISOString().slice(0, 10)
    byDay.set(day, price)
  }

  const points = [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([date, rate]) => ({
      date,
      label: formatDayLabel(new Date(`${date}T12:00:00`)),
      rate,
    }))

  return points.length >= 2 ? points : null
}

export function calcWeekChange(points) {
  if (!points || points.length < 2) {
    return { percent: 0, direction: 'flat' }
  }
  const first = points[0].rate
  const last = points[points.length - 1].rate
  if (!first) return { percent: 0, direction: 'flat' }

  const percent = ((last - first) / first) * 100
  const direction = percent > 0.01 ? 'up' : percent < -0.01 ? 'down' : 'flat'
  return { percent, direction }
}

/**
 * История курса: API при возможности, иначе реалистичный mock.
 */
export async function loadRateHistory(from, to, currentRate) {
  try {
    if (CRYPTO_IDS[from]) {
      const crypto = await fetchCryptoHistory(from, to)
      if (crypto) return { points: crypto, source: 'live' }
    }

    const fiat = await fetchFrankfurterHistory(from, to)
    if (fiat) {
      // подтягиваем последнюю точку к актуальному курсу
      const next = [...fiat]
      if (Number.isFinite(currentRate) && currentRate > 0) {
        next[next.length - 1] = {
          ...next[next.length - 1],
          rate: currentRate,
        }
      }
      return { points: next, source: 'live' }
    }
  } catch {
    /* fallback below */
  }

  return {
    points: generateMockHistory(from, to, currentRate),
    source: 'mock',
  }
}
