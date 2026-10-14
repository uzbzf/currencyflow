/** Обычный пробел для разделения разрядов (как в примере: 1 000 000) */
const GROUP_SEP = ' '

/**
 * Форматирует число с разделением разрядов пробелами.
 * Сохраняет дробную часть без лишних нулей (если не задан minFractionDigits).
 */
export function formatGroupedNumber(value, options = {}) {
  const {
    maximumFractionDigits = 2,
    minimumFractionDigits = 0,
  } = options

  const num = typeof value === 'number' ? value : Number(String(value).replace(/\s/g, '').replace(',', '.'))
  if (!Number.isFinite(num)) return '—'

  const formatted = new Intl.NumberFormat('ru-RU', {
    useGrouping: true,
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(num)

  // ru-RU может ставить NBSP / тонкий пробел — приводим к обычному пробелу
  return formatted.replace(/[\u00A0\u202F]/g, GROUP_SEP)
}

/** Парсит строку с пробелами и запятой в «сырую» числовую строку для state */
export function parseFormattedNumber(raw) {
  if (raw == null) return ''

  let value = String(raw)
    .replace(/[\u00A0\u202F\s]/g, '')
    .replace(/[^\d.,-]/g, '')

  // Одна десятичная точка: запятую или точку
  const comma = value.lastIndexOf(',')
  const dot = value.lastIndexOf('.')
  if (comma !== -1 && dot !== -1) {
    const decimalAt = Math.max(comma, dot)
    const intPart = value.slice(0, decimalAt).replace(/[.,]/g, '')
    const fracPart = value.slice(decimalAt + 1).replace(/[.,]/g, '')
    value = `${intPart}.${fracPart}`
  } else {
    value = value.replace(',', '.')
  }

  // Разрешаем промежуточные состояния ввода: "", ".", "0.", "-."
  if (value === '' || value === '-' || value === '.' || value === '-.') return value

  // Не больше одной точки
  const parts = value.split('.')
  if (parts.length > 2) {
    value = `${parts[0]}.${parts.slice(1).join('')}`
  }

  return value
}

/** Форматирование суммы в поле ввода с сохранением незавершённой дробной части */
export function formatInputAmount(raw) {
  if (raw === '' || raw == null) return ''

  const value = String(raw)
  const negative = value.startsWith('-')
  const body = negative ? value.slice(1) : value

  // Пользователь только что ввёл точку/запятую
  if (body === '.' || body === '') {
    return `${negative ? '-' : ''}${body === '.' ? '0.' : ''}`
  }

  const [intPart = '0', ...rest] = body.split('.')
  const hasDecimal = body.includes('.')
  const fracPart = rest.join('')

  const intFormatted = formatGroupedNumber(Number(intPart || '0'), {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })

  let result = `${negative ? '-' : ''}${intFormatted}`
  if (hasDecimal) {
    result += `.${fracPart}`
  }
  return result
}

export function formatAmount(value, code) {
  const num = Number(value)
  if (!Number.isFinite(num)) return '—'

  const isCrypto = code === 'BTC' || code === 'ETH'
  const abs = Math.abs(num)

  let maximumFractionDigits = 2
  if (isCrypto) {
    maximumFractionDigits = abs >= 1 ? 6 : 8
  } else if (code === 'UZS' || code === 'KZT') {
    maximumFractionDigits = abs >= 100 ? 0 : 2
  } else if (abs > 0 && abs < 0.01) {
    maximumFractionDigits = 8
  }

  return formatGroupedNumber(num, { maximumFractionDigits, minimumFractionDigits: 0 })
}

export function formatRate(value, from, to) {
  const num = Number(value)
  if (!Number.isFinite(num) || num === 0) return '—'

  const isCryptoPair = from === 'BTC' || from === 'ETH' || to === 'BTC' || to === 'ETH'
  const digits = isCryptoPair ? (num >= 1 ? 2 : 8) : num >= 100 ? 2 : 4

  return formatGroupedNumber(num, { maximumFractionDigits: digits, minimumFractionDigits: 0 })
}

export function formatTime(date) {
  if (!date) return ''
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
