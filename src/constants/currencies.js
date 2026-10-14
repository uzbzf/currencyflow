export const CURRENCIES = [
  { code: 'USD', name: 'Доллар США', symbol: '$', type: 'fiat', flag: '🇺🇸' },
  { code: 'EUR', name: 'Евро', symbol: '€', type: 'fiat', flag: '🇪🇺' },
  { code: 'CNY', name: 'Китайский юань', symbol: '¥', type: 'fiat', flag: '🇨🇳' },
  { code: 'RUB', name: 'Российский рубль', symbol: '₽', type: 'fiat', flag: '🇷🇺' },
  { code: 'UZS', name: 'Узбекский сум', symbol: "so'm", type: 'fiat', flag: '🇺🇿' },
  { code: 'KZT', name: 'Казахстанский тенге', symbol: '₸', type: 'fiat', flag: '🇰🇿' },
  { code: 'BTC', name: 'Bitcoin', symbol: '₿', type: 'crypto', flag: '₿' },
  { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', type: 'crypto', flag: 'Ξ' },
]

export const CURRENCY_MAP = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c]),
)

/** Курсы относительно 1 USD (fallback, если API недоступен) */
export const FALLBACK_RATES = {
  USD: 1,
  EUR: 0.92,
  CNY: 7.25,
  RUB: 92.5,
  UZS: 12750,
  KZT: 510,
  BTC: 1 / 95000,
  ETH: 1 / 3500,
}

export const POPULAR_PAIRS = [
  { from: 'USD', to: 'EUR' },
  { from: 'USD', to: 'CNY' },
  { from: 'USD', to: 'RUB' },
  { from: 'USD', to: 'UZS' },
  { from: 'USD', to: 'KZT' },
  { from: 'BTC', to: 'USD' },
  { from: 'ETH', to: 'USD' },
]

export const STORAGE_KEYS = {
  from: 'currencyflow:from',
  to: 'currencyflow:to',
  theme: 'currencyflow:theme',
  amount: 'currencyflow:amount',
  history: 'currencyflow:history',
  geoChecked: 'currencyflow:geo-checked',
  feeEnabled: 'currencyflow:fee-enabled',
  feePercent: 'currencyflow:fee-percent',
}

export const QUICK_AMOUNTS = [100, 1000, 10000, 100000]

export const FEE_PERCENTS = [1, 2, 3]

export const HISTORY_LIMIT = 8

/** Коды стран → базовая валюта из поддерживаемого списка */
export const COUNTRY_CURRENCY_MAP = {
  US: 'USD',
  EC: 'USD',
  SV: 'USD',
  PA: 'USD',
  PR: 'USD',
  RU: 'RUB',
  UZ: 'UZS',
  KZ: 'KZT',
  CN: 'CNY',
  // Еврозона и связанные
  AT: 'EUR',
  BE: 'EUR',
  CY: 'EUR',
  DE: 'EUR',
  EE: 'EUR',
  ES: 'EUR',
  FI: 'EUR',
  FR: 'EUR',
  GR: 'EUR',
  HR: 'EUR',
  IE: 'EUR',
  IT: 'EUR',
  LT: 'EUR',
  LU: 'EUR',
  LV: 'EUR',
  MT: 'EUR',
  NL: 'EUR',
  PT: 'EUR',
  SI: 'EUR',
  SK: 'EUR',
}

export const SUPPORTED_FIAT = ['USD', 'EUR', 'CNY', 'RUB', 'UZS', 'KZT']
