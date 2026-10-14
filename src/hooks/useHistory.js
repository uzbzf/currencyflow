import { useCallback, useEffect, useState } from 'react'
import { HISTORY_LIMIT, STORAGE_KEYS } from '../constants/currencies'

function readHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.history)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function useHistory() {
  const [history, setHistory] = useState(readHistory)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history))
    } catch {
      /* ignore */
    }
  }, [history])

  const addEntry = useCallback((entry) => {
    const amount = Number(entry.amount)
    const result = Number(entry.result)
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(result)) return

    setHistory((prev) => {
      const next = {
        id: `${Date.now()}-${entry.from}-${entry.to}`,
        amount: String(entry.amount),
        from: entry.from,
        to: entry.to,
        result,
        rate: entry.rate,
        at: Date.now(),
      }

      const sameAsLatest =
        prev[0] &&
        prev[0].amount === next.amount &&
        prev[0].from === next.from &&
        prev[0].to === next.to &&
        Math.abs(prev[0].result - next.result) < 1e-10

      if (sameAsLatest) return prev
      return [next, ...prev].slice(0, HISTORY_LIMIT)
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const removeEntry = useCallback((id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id))
  }, [])

  return { history, addEntry, clearHistory, removeEntry }
}
