import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Filter,
  ExternalLink,
  Eye,
  Download,
  X,
  FileQuestion,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FolderOpen
} from 'lucide-react'
import { listEvidence, downloadReceiptFile } from '../api/evidenceApi'
import StatusBadge from '../components/StatusBadge'
import ReceiptCard from '../components/ReceiptCard'
import { truncateHash, formatDateTime, formatBytes } from '../utils/format'
import { useToast } from '../components/Toast'

export default function EvidenceListPage() {
  const { addToast } = useToast()

  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(true)

  // Filters
  const [q, setQ] = useState('')
  const [caseCode, setCaseCode] = useState('')
  const [status, setStatus] = useState('')

  // Drawer
  const [selectedEvidence, setSelectedEvidence] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await listEvidence({
        page,
        page_size: pageSize,
        q: q.trim() || undefined,
        case_code: caseCode.trim() || undefined,
        status: status || undefined
      })
      setItems(data.items || [])
      setTotal(data.total || 0)
    } catch (err) {
      addToast('Không thể tải danh sách bằng chứng.', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, q, caseCode, status, addToast])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData()
    }, 400)
    return () => clearTimeout(timer)
  }, [fetchData])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-left">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
            Danh mục bằng chứng đã ký gửi
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Toàn bộ dấu vân tay số và hồ sơ giám định đã neo trên mạng Sepolia
          </p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:border-cyan-500/40 transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-cyan-500/20 bg-[#111c3d]/80 p-4 mb-6 backdrop-blur-md shadow-lg grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
        {/* Search */}
        <div className="sm:col-span-6 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo Evidence ID, SHA-256, Tiêu đề hoặc Tên tệp..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/90 pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors font-mono-code"
          />
        </div>

        {/* Case Code */}
        <div className="sm:col-span-3">
          <input
            type="text"
            placeholder="Lọc mã vụ việc (TA-...)"
            value={caseCode}
            onChange={(e) => {
              setCaseCode(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors font-mono-code"
          />
        </div>

        {/* Status Dropdown */}
        <div className="sm:col-span-3">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="CONFIRMED">CONFIRMED (Đã xác nhận)</option>
            <option value="PENDING">PENDING (Đang chờ)</option>
            <option value="FAILED">FAILED (Thất bại)</option>
            <option value="HASHED">HASHED (Đã tính hash)</option>
          </select>
        </div>
      </div>

      {/* Main Table (Desktop) / Cards (Mobile) */}
      <div className="rounded-2xl border border-cyan-500/20 bg-[#111c3d]/90 backdrop-blur-md shadow-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin text-cyan-400 mx-auto" />
            <p className="text-xs font-mono-code">Đang tải danh sách hồ sơ chứng cứ...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 mx-auto text-slate-500">
              <FolderOpen className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">Chưa có bản ghi bằng chứng nào</p>
            <p className="text-xs text-slate-500">Hãy thực hiện ký gửi bằng chứng đầu tiên ở tab Ký gửi.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-code">
              <thead className="bg-[#0b132b]/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3.5">Evidence ID</th>
                  <th className="px-4 py-3.5">Mã vụ việc</th>
                  <th className="px-4 py-3.5 font-sans">Tiêu đề / Tệp</th>
                  <th className="px-4 py-3.5">SHA-256</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-4 py-3.5">Xác nhận</th>
                  <th className="px-4 py-3.5 text-right font-sans">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {items.map((item) => {
                  const { local } = formatDateTime(item.confirmed_at || item.created_at)
                  return (
                    <tr
                      key={item.evidence_id}
                      onClick={() => setSelectedEvidence(item)}
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3.5 font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {item.evidence_id}
                      </td>
                      <td className="px-4 py-3.5 text-cyan-300 font-semibold">
                        {item.case_code}
                      </td>
                      <td className="px-4 py-3.5 max-w-[200px] truncate font-sans text-slate-200" title={item.title}>
                        <div className="truncate font-medium">{item.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono-code truncate">
                          {item.original_filename} ({formatBytes(item.size_bytes)})
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300">
                        {truncateHash(item.sha256, 6, 6)}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                        {local}
                      </td>
                      <td
                        className="px-4 py-3.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedEvidence(item)}
                            title="Xem biên nhận chi tiết"
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-cyan-300 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {item.status === 'CONFIRMED' && (
                            <button
                              type="button"
                              onClick={() => downloadReceiptFile(item.evidence_id)}
                              title="Tải biên nhận JSON"
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-emerald-400 transition-colors"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          )}
                          {item.explorer_url && (
                            <a
                              href={item.explorer_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Xem giao dịch trên Etherscan"
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-cyan-300 transition-colors"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-800 px-4 py-3 text-xs text-slate-400 font-mono-code">
          <div>
            Hiển thị <span className="text-white font-semibold">{items.length}</span> / <span className="text-white font-semibold">{total}</span> hồ sơ
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 rounded-lg border border-slate-800 px-2.5 py-1 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Trước
            </button>
            <span className="text-slate-300 font-semibold px-1">
              Trang {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 rounded-lg border border-slate-800 px-2.5 py-1 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Sau
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Side Drawer Modal for Detailed Receipt Card */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="h-full w-full max-w-xl bg-[#0a122a] border-l border-cyan-500/30 p-6 overflow-y-auto shadow-2xl relative animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <span className="font-display font-bold text-sm text-cyan-400">
                Chi tiết hồ sơ chứng cứ
              </span>
              <button
                type="button"
                onClick={() => setSelectedEvidence(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ReceiptCard
              evidence={selectedEvidence}
              onReset={() => setSelectedEvidence(null)}
              isDrawer={true}
            />
          </div>
        </div>
      )}
    </div>
  )
}
