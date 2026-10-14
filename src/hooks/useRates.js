import { useCallback, useEffect, useState } from 'react'
import { FALLBACK_RATES, SUPPORTED_FIAT } from '../constants/currencies'

const FIAT_CODES = SUPPORTED_FIAT

async function fetchFiatRates() {
  const res = await fetch('https://open.er-api.com/v6/latest/USD', {
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error('Fiat API error')
  const data = await res.json()
  if (data.result !== 'success' || !data.rates) throw new Error('Invalid fiat payload')

  const rates = { USD: 1 }
  for (const code of FIAT_CODES) {
    if (code === 'USD') continue
    if (typeof data.rates[code] !== 'number') throw new Error(`Missing rate: ${code}`)
    rates[code] = data.rates[code]
  }
  return rates
}

async function fetchCryptoRates() {
  const res = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd',
    { signal: AbortSignal.timeout(8000) },
  )
  if (!res.ok) throw new Error('Crypto API error')
  const data = await res.json()
  const btcUsd = data?.bitcoin?.usd
  const ethUsd = data?.ethereum?.usd
  if (!btcUsd || !ethUsd) throw new Error('Invalid crypto payload')
  return {
    BTC: 1 / btcUsd,
    ETH: 1 / ethUsd,
  }
}

export function useRates() {
  const [rates, setRates] = useState(FALLBACK_RATES)
  const [source, setSource] = useState('fallback')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [fiat, crypto] = await Promise.all([fetchFiatRates(), fetchCryptoRates()])
      setRates({ ...fiat, ...crypto })
      setSource('live')
      setUpdatedAt(new Date())
    } catch (err) {
      try {
        const fiat = await fetchFiatRates()
        setRates({ ...FALLBACK_RATES, ...fiat })
        setSource('partial')
        setUpdatedAt(new Date())
        setError('Крипто-курсы из резерва')
      } catch {
        setRates(FALLBACK_RATES)
        setSource('fallback')
        setUpdatedAt(new Date())
        setError(err?.message || 'API недоступен — используются резервные курсы')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const convert = useCallback(
    (amount, from, to) => {
      const value = Number(amount)
      if (!Number.isFinite(value) || !rates[from] || !rates[to]) return 0
      return (value * rates[to]) / rates[from]
    },
    [rates],
  )

  const getRate = useCallback(
    (from, to) => {
      if (!rates[from] || !rates[to]) return 0
      return rates[to] / rates[from]
    },
    [rates],
  )

  return { rates, source, loading, error, updatedAt, convert, getRate, refresh: load }
}
