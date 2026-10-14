/**
 * Безопасный парсер арифметических выражений (+ - * / и скобки).
 * Без eval / Function.
 */

export function normalizeExpression(raw) {
  return String(raw ?? '')
    .replace(/[\u00A0\u202F]/g, ' ')
    .replace(/,/g, '.')
    // убираем разделители разрядов: "1 000" → "1000"
    .replace(/(\d)\s+(?=\d)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Есть ли операторы (не просто число / отрицательное число) */
export function looksLikeExpression(raw) {
  const s = normalizeExpression(raw)
  if (!s) return false
  if (/[+\*/()]/.test(s)) return true
  // минус не в начале: "100-20" или "100 - 20"
  return /^-?\d+(\.\d+)?\s*-\s*-?\d/.test(s)
}

function tokenize(expression) {
  const tokens = []
  let i = 0
  const s = expression

  while (i < s.length) {
    const ch = s[i]

    if (ch === ' ') {
      i += 1
      continue
    }

    if ('+-*/()'.includes(ch)) {
      tokens.push({ type: ch })
      i += 1
      continue
    }

    if (/\d/.test(ch) || ch === '.') {
      let start = i
      let dots = 0
      while (i < s.length && (/\d/.test(s[i]) || s[i] === '.')) {
        if (s[i] === '.') dots += 1
        if (dots > 1) throw new Error('Invalid number')
        i += 1
      }
      const num = Number(s.slice(start, i))
      if (!Number.isFinite(num)) throw new Error('Invalid number')
      tokens.push({ type: 'number', value: num })
      continue
    }

    throw new Error(`Unexpected character: ${ch}`)
  }

  return tokens
}

function createParser(tokens) {
  let pos = 0

  const peek = () => tokens[pos]
  const consume = (type) => {
    const token = tokens[pos]
    if (!token || (type && token.type !== type)) {
      throw new Error('Unexpected token')
    }
    pos += 1
    return token
  }

  function parsePrimary() {
    const token = peek()
    if (!token) throw new Error('Unexpected end')

    if (token.type === 'number') {
      consume()
      return token.value
    }

    if (token.type === '(') {
      consume('(')
      const value = parseExpression()
      consume(')')
      return value
    }

    if (token.type === '+' || token.type === '-') {
      const op = consume().type
      const value = parsePrimary()
      return op === '-' ? -value : value
    }

    throw new Error('Expected number')
  }

  function parseTerm() {
    let value = parsePrimary()
    while (peek()?.type === '*' || peek()?.type === '/') {
      const op = consume().type
      const right = parsePrimary()
      if (op === '*') value *= right
      else {
        if (right === 0) throw new Error('Division by zero')
        value /= right
      }
    }
    return value
  }

  function parseExpression() {
    let value = parseTerm()
    while (peek()?.type === '+' || peek()?.type === '-') {
      const op = consume().type
      const right = parseTerm()
      value = op === '+' ? value + right : value - right
    }
    return value
  }

  const value = parseExpression()
  if (pos < tokens.length) throw new Error('Unexpected trailing tokens')
  return value
}

/**
 * @returns {{ ok: true, value: number } | { ok: false, error?: string }}
 */
export function evaluateExpression(raw) {
  try {
    const normalized = normalizeExpression(raw)
    if (!normalized) return { ok: false, error: 'empty' }

    // незавершённое выражение вроде "100 +"
    if (/[+\-*/(]$/.test(normalized)) {
      return { ok: false, error: 'incomplete' }
    }

    const tokens = tokenize(normalized)
    if (!tokens.length) return { ok: false, error: 'empty' }

    const value = createParser(tokens)
    if (!Number.isFinite(value)) return { ok: false, error: 'invalid' }

    return { ok: true, value }
  } catch (err) {
    return { ok: false, error: err?.message || 'parse error' }
  }
}

/** Санитизация ввода: только цифры, операторы, скобки, точка/запятая, пробелы */
export function sanitizeExpressionInput(raw) {
  return String(raw ?? '')
    .replace(/[^\d+\-*/().,\s\u00A0\u202F]/g, '')
}
