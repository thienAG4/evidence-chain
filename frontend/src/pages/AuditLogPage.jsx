import React, { useState, useEffect, useCallback } from 'react'
import {
  Activity,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Clock,
  Terminal,
  FileCode2
} from 'lucide-react'
import { getAuditLogs } from '../api/logsApi'
import { formatDateTime, truncateHash } from '../utils/format'
import { useToast } from '../components/Toast'

export default function AuditLogPage() {
  const { addToast } = useToast()

  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  // Filters
  const [eventFilter, setEventFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [evidenceIdFilter, setEvidenceIdFilter] = useState('')
  const [limit, setLimit] = useState(100)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getAuditLogs({
        limit,
        event: eventFilter || undefined,
        level: levelFilter || undefined,
        evidence_id: evidenceIdFilter.trim() || undefined
      })
      setLogs(data.items || [])
    } catch (err) {
      addToast('Không thể tải nhật ký kiểm toán.', 'error')
    } finally {
      setLoading(false)
    }
  }, [limit, eventFilter, levelFilter, evidenceIdFilter, addToast])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return
    const timer = setInterval(() => {
      fetchLogs()
    }, 10000)
    return () => clearInterval(timer)
  }, [autoRefresh, fetchLogs])

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const getLevelBadge = (level) => {
    const l = (level || '').toUpperCase()
    if (l === 'ERROR') {
      return (
        <span className="rounded bg-red-950/60 border border-red-500/40 px-1.5 py-0.5 text-[10px] font-bold text-red-300">
          ERROR
        </span>
      )
    }
    if (l === 'WARNING' || l === 'WARN') {
      return (
        <span className="rounded bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
          WARN
        </span>
      )
    }
    return (
      <span className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
        INFO
      </span>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-left">
      {/* Page Title & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight flex items-center gap-2.5">
            <Terminal className="h-7 w-7 text-cyan-400" />
            Nhật ký kiểm toán hệ thống
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Ghi vết bất biến (Append-Only) mọi sự kiện ký gửi, tính hash, neo Sepolia và đối chiếu bằng chứng
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
            />
            <span>Tự làm mới (10s)</span>
          </label>

          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:border-cyan-500/40 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-cyan-500/20 bg-[#111c3d]/80 p-4 mb-6 backdrop-blur-md shadow-lg grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs font-mono-code">
        {/* Event filter */}
        <div className="sm:col-span-4">
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors cursor-pointer"
          >
            <option value="">Tất cả sự kiện (All Events)</option>
            <option value="UPLOAD_RECEIVED">UPLOAD_RECEIVED</option>
            <option value="HASH_COMPUTED">HASH_COMPUTED</option>
            <option value="DUPLICATE_DETECTED">DUPLICATE_DETECTED</option>
            <option value="TX_SENT">TX_SENT</option>
            <option value="TX_CONFIRMED">TX_CONFIRMED</option>
            <option value="TX_FAILED">TX_FAILED</option>
            <option value="VERIFY_REQUESTED">VERIFY_REQUESTED</option>
            <option value="VERIFY_RESULT">VERIFY_RESULT</option>
            <option value="RECEIPT_DOWNLOADED">RECEIPT_DOWNLOADED</option>
            <option value="APP_STARTED">APP_STARTED</option>
          </select>
        </div>

        {/* Level filter */}
        <div className="sm:col-span-3">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors cursor-pointer"
          >
            <option value="">Tất cả mức độ</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
          </select>
        </div>

        {/* Evidence ID filter */}
        <div className="sm:col-span-3">
          <input
            type="text"
            placeholder="Evidence ID (EV-...)"
            value={evidenceIdFilter}
            onChange={(e) => setEvidenceIdFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors"
          />
        </div>

        {/* Limit */}
        <div className="sm:col-span-2">
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors cursor-pointer"
          >
            <option value={50}>50 dòng</option>
            <option value={100}>100 dòng</option>
            <option value={200}>200 dòng</option>
            <option value={500}>500 dòng</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-cyan-500/20 bg-[#111c3d]/90 backdrop-blur-md shadow-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin text-cyan-400 mx-auto" />
            <p className="text-xs font-mono-code">Đang nạp audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <FileCode2 className="h-8 w-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">Không có bản ghi nhật ký phù hợp</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-code">
              <thead className="bg-[#0b132b]/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5 w-10"></th>
                  <th className="px-4 py-3.5">Thời gian (UTC)</th>
                  <th className="px-4 py-3.5">Mức</th>
                  <th className="px-4 py-3.5">Sự kiện</th>
                  <th className="px-4 py-3.5">Evidence ID</th>
                  <th className="px-4 py-3.5">Request ID</th>
                  <th className="px-4 py-3.5 text-right font-sans">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {logs.map((log) => {
                  const isExpanded = expandedId === log.id
                  const { utc } = formatDateTime(log.ts)
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => toggleExpand(log.id)}
                        className={`hover:bg-slate-800/50 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-slate-800/40' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-slate-500">
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-cyan-400" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                          {utc}
                        </td>
                        <td className="px-4 py-3">
                          {getLevelBadge(log.level)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-cyan-300">
                          {log.event}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {log.evidence_id || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {truncateHash(log.request_id, 6, 6)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-400 font-sans">
                          {log.details ? (
                            <span className="text-[11px] text-cyan-400 underline">
                              {isExpanded ? 'Đóng' : 'Xem JSON'}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>

                      {/* Expandable JSON detail row */}
                      {isExpanded && log.details && (
                        <tr className="bg-[#090f22] border-t border-b border-cyan-500/10">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="rounded-xl border border-slate-800 bg-[#060a17] p-3.5 text-[11px] text-emerald-300 font-mono-code overflow-x-auto shadow-inner">
                              <pre className="whitespace-pre-wrap select-all">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
