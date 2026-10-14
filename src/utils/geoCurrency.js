import {
  COUNTRY_CURRENCY_MAP,
  CURRENCY_MAP,
  SUPPORTED_FIAT,
} from '../constants/currencies'

function resolveCurrency({ currency, countryCode, countryName }) {
  const code = String(currency || '').toUpperCase()
  const cc = String(countryCode || '').toUpperCase()

  if (SUPPORTED_FIAT.includes(code) && CURRENCY_MAP[code]) {
    return {
      code,
      countryCode: cc || null,
      countryName: countryName || null,
    }
  }

  const byCountry = COUNTRY_CURRENCY_MAP[cc]
  if (byCountry && CURRENCY_MAP[byCountry]) {
    return {
      code: byCountry,
      countryCode: cc || null,
      countryName: countryName || null,
    }
  }

  return null
}

async function fetchFromIpapi(signal) {
  const res = await fetch('https://ipapi.co/json/', { signal })
  if (!res.ok) throw new Error('ipapi.co unavailable')
  const data = await res.json()
  if (data?.error) throw new Error(data.reason || 'ipapi.co error')

  return resolveCurrency({
    currency: data.currency,
    countryCode: data.country_code,
    countryName: data.country_name,
  })
}

async function fetchFromIpwho(signal) {
  const res = await fetch('https://ipwho.is/', { signal })
  if (!res.ok) throw new Error('ipwho.is unavailable')
  const data = await res.json()
  if (!data?.success) throw new Error(data?.message || 'ipwho.is error')

  return resolveCurrency({
    currency: data.currency?.code,
    countryCode: data.country_code,
    countryName: data.country,
  })
}

/**
 * Определяет базовую валюту по IP/стране.
 * Возвращает { code, countryCode, countryName } или null.
 */
export async function detectLocalCurrency() {
  const signal = AbortSignal.timeout(6000)

  try {
    const result = await fetchFromIpapi(signal)
    if (result) return result
  } catch {
    /* fallback below */
  }

  try {
    const result = await fetchFromIpwho(AbortSignal.timeout(6000))
    if (result) return result
  } catch {
    /* ignore */
  }

  return null
}
