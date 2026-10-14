import { useEffect, useState } from 'react'
import { calcWeekChange, loadRateHistory } from '../utils/rateHistory'

export function useRateHistory(from, to, currentRate) {
  const [points, setPoints] = useState([])
  const [source, setSource] = useState('mock')
  const [loading, setLoading] = useState(true)
  const [change, setChange] = useState({ percent: 0, direction: 'flat' })

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setLoading(true)
      try {
        const result = await loadRateHistory(from, to, currentRate)
        if (cancelled) return
        setPoints(result.points)
        setSource(result.source)
        setChange(calcWeekChange(result.points))
      } catch {
        if (cancelled) return
        setPoints([])
        setChange({ percent: 0, direction: 'flat' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [from, to, currentRate])

  return { points, source, loading, change }
}
