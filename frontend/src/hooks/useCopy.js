import { useState, useCallback } from 'react'

export function useCopy(timeout = 2000) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback((text) => {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), timeout)
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), timeout)
    })
  }, [timeout])

  return { copied, copy }
}
