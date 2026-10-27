import { useEffect, useState } from 'react'
import { getEvidence } from '../api/evidenceApi'

export default function usePollEvidence(evidenceId, intervalMs = 2500, maxMs = 300000) {
  const [data, setData] = useState(null)
  const [isPolling, setIsPolling] = useState(false)

  useEffect(() => {
    if (!evidenceId) {
      setData(null)
      setIsPolling(false)
      return
    }

    let stop = false
    let timer
    const started = Date.now()
    setIsPolling(true)

    const tick = async () => {
      try {
        const d = await getEvidence(evidenceId)
        if (stop) return
        setData(d)
        if (['CONFIRMED', 'FAILED'].includes(d.status) || Date.now() - started > maxMs) {
          setIsPolling(false)
          return
        }
      } catch (e) {
        // Continue polling on transient errors
      }
      if (!stop) {
        timer = setTimeout(tick, intervalMs)
      }
    }

    tick()

    return () => {
      stop = true
      clearTimeout(timer)
      setIsPolling(false)
    }
  }, [evidenceId, intervalMs, maxMs])

  return { data, isPolling }
}
