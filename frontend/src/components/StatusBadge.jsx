import React from 'react'
import { CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react'

export default function StatusBadge({ status }) {
  const s = (status || '').toUpperCase()

  switch (s) {
    case 'CONFIRMED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          CONFIRMED
        </span>
      )
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-950/40 px-2.5 py-0.5 text-xs font-medium text-amber-300">
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-400" />
          PENDING
        </span>
      )
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-950/40 px-2.5 py-0.5 text-xs font-medium text-red-300">
          <AlertCircle className="h-3.5 w-3.5 text-red-400" />
          FAILED
        </span>
      )
    case 'HASHED':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
          <Clock className="h-3.5 w-3.5 text-cyan-400" />
          {s || 'HASHED'}
        </span>
      )
  }
}
