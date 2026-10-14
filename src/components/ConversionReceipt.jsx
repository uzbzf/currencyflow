import { forwardRef } from 'react'
import { formatAmount, formatRate } from '../utils/format'

function formatReceiptDate(date) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Чек для html2canvas — инлайн-стили и hex-цвета для стабильного рендера.
 */
export const ConversionReceipt = forwardRef(function ConversionReceipt(
  {
    amount,
    from,
    to,
    fromName,
    toName,
    unitRate,
    result,
    netResult,
    feeEnabled,
    feePercent,
    feeAmount,
  },
  ref,
) {
  const now = new Date()
  const receiptId = `CF-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`

  const row = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '10px',
    fontSize: '13px',
    lineHeight: 1.4,
  }

  const label = { color: '#5a6f68', flexShrink: 0 }
  const value = {
    color: '#10231e',
    fontWeight: 600,
    textAlign: 'right',
    wordBreak: 'break-word',
  }

  return (
    <div
      ref={ref}
      style={{
        width: '420px',
        padding: '28px',
        background: 'linear-gradient(180deg, #ffffff 0%, #f3f7f6 100%)',
        color: '#10231e',
        fontFamily: 'Outfit, Arial, sans-serif',
        borderRadius: '20px',
        border: '1px solid #d0e0db',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '22px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '22px',
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            +
          </div>
          <div>
            <div
              style={{
                fontFamily: 'Sora, Outfit, Arial, sans-serif',
                fontSize: '18px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              CurrencyFlow
            </div>
            <div style={{ fontSize: '11px', color: '#5a6f68', marginTop: '2px' }}>
              Чек конвертации
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '11px', color: '#5a6f68' }}>
          <div>{receiptId}</div>
        </div>
      </div>

      <div
        style={{
          height: '1px',
          background: 'repeating-linear-gradient(90deg, #d0e0db 0 8px, transparent 8px 14px)',
          marginBottom: '18px',
        }}
      />

      <div style={row}>
        <span style={label}>Дата и время</span>
        <span style={value}>{formatReceiptDate(now)}</span>
      </div>
      <div style={row}>
        <span style={label}>Исходная валюта</span>
        <span style={value}>
          {from}
          {fromName ? ` · ${fromName}` : ''}
        </span>
      </div>
      <div style={row}>
        <span style={label}>Целевая валюта</span>
        <span style={value}>
          {to}
          {toName ? ` · ${toName}` : ''}
        </span>
      </div>
      <div style={row}>
        <span style={label}>Сумма</span>
        <span style={value}>
          {formatAmount(amount, from)} {from}
        </span>
      </div>
      <div style={row}>
        <span style={label}>Курс</span>
        <span style={value}>
          1 {from} = {formatRate(unitRate, from, to)} {to}
        </span>
      </div>

      {feeEnabled && (
        <>
          <div style={row}>
            <span style={label}>Без комиссии</span>
            <span style={value}>
              {formatAmount(result, to)} {to}
            </span>
          </div>
          <div style={row}>
            <span style={label}>Комиссия ({feePercent}%)</span>
            <span style={{ ...value, color: '#b45309' }}>
              −{formatAmount(feeAmount, to)} {to}
            </span>
          </div>
        </>
      )}

      <div
        style={{
          marginTop: '8px',
          marginBottom: '8px',
          padding: '16px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #ccfbf1 0%, #e7efec 100%)',
          border: '1px solid rgba(13, 148, 136, 0.25)',
        }}
      >
        <div style={{ fontSize: '11px', color: '#5a6f68', marginBottom: '6px', fontWeight: 600 }}>
          ИТОГО К ПОЛУЧЕНИЮ
        </div>
        <div
          style={{
            fontFamily: 'Sora, Outfit, Arial, sans-serif',
            fontSize: '28px',
            fontWeight: 700,
            color: '#0f766e',
            letterSpacing: '-0.03em',
            wordBreak: 'break-word',
          }}
        >
          {formatAmount(netResult, to)} {to}
        </div>
      </div>

      <div
        style={{
          marginTop: '18px',
          textAlign: 'center',
          fontSize: '10px',
          color: '#8aa39a',
          lineHeight: 1.5,
        }}
      >
        Спасибо, что пользуетесь CurrencyFlow
        <br />
        Курсы ориентировочные и могут отличаться у обменников
      </div>
    </div>
  )
})
