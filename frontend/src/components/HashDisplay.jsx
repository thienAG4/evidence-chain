import React from 'react'
import { Copy, Check } from 'lucide-react'
import { useCopy } from '../hooks/useCopy'
import { truncateHash, groupHash } from '../utils/format'

export default function HashDisplay({
  hash,
  label = '',
  truncate = false,
  grouped = false,
  className = ''
}) {
  const { copied, copy } = useCopy()

  if (!hash) return <span className="text-slate-500 font-mono-code text-xs">-</span>

  const displayText = truncate
    ? truncateHash(hash, 8, 8)
    : grouped
    ? groupHash(hash, 8)
    : hash

  return (
    <div className={`inline-flex items-center gap-2 max-w-full ${className}`}>
      {label && <span className="text-xs text-slate-400 font-medium">{label}:</span>}
      <div className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/90 px-2.5 py-1 text-xs font-mono-code text-cyan-300 max-w-full overflow-hidden">
        <span className="truncate select-all" title={hash}>
          {displayText}
        </span>
        <button
          type="button"
          onClick={() => copy(hash)}
          title="Sao chép toàn bộ mã"
          className="ml-1 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer shrink-0"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      {copied && (
        <span className="text-[11px] font-medium text-emerald-400 animate-in fade-in shrink-0">
          Đã chép!
        </span>
      )}
    </div>
  )
}
