import React from 'react'
import { Link } from 'react-router-dom'
import {
  FileCheck2,
  ExternalLink,
  Download,
  AlertTriangle,
  FileCode,
  ShieldAlert,
  ArrowRight,
  PlusCircle,
  Copy,
  Check
} from 'lucide-react'
import HashDisplay from './HashDisplay'
import StatusBadge from './StatusBadge'
import { formatBytes, formatDateTime } from '../utils/format'
import { downloadReceiptFile } from '../api/evidenceApi'
import { useCopy } from '../hooks/useCopy'

export default function ReceiptCard({ evidence, onReset, isDrawer = false }) {
  const { copied: idCopied, copy: copyId } = useCopy()

  if (!evidence) return null

  const { utc, local } = formatDateTime(evidence.confirmed_at || evidence.created_at)
  const isConfirmed = evidence.status === 'CONFIRMED'
  const isFailed = evidence.status === 'FAILED'
  const isPending = evidence.status === 'PENDING'

  return (
    <div className={`rounded-2xl border border-cyan-500/25 bg-[#111c3d]/90 p-5 sm:p-6 backdrop-blur-md shadow-2xl shadow-black/60 text-left ${isDrawer ? 'max-w-none' : 'max-w-3xl mx-auto'}`}>
      {/* Header status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-white">
              Biên nhận bằng chứng số
            </h3>
            <p className="text-xs text-slate-400">
              Chứng thực thời gian & mã băm mật mã trên Sepolia
            </p>
          </div>
        </div>
        <StatusBadge status={evidence.status} />
      </div>

      {/* Duplicate notice if applicable */}
      {evidence.duplicate && (
        <div className="mb-4 rounded-xl border border-cyan-500/40 bg-cyan-950/40 p-3 text-xs text-cyan-200 flex items-start gap-2.5">
          <FileCode className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-cyan-300">Tệp đã được ký gửi trước đó:</span>{' '}
            Hệ thống trả về biên nhận gốc đã lưu vết với mốc thời gian sớm nhất, không phát sinh giao dịch mới và không tốn gas.
          </div>
        </div>
      )}

      {/* Error notice if failed */}
      {isFailed && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-200 flex items-start gap-2.5">
          <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-red-300">Neo hash thất bại:</span>{' '}
            {evidence.error_message || 'Không thể phát giao dịch lên Sepolia. Bạn có thể thử lại sau.'}
          </div>
        </div>
      )}

      {/* Grid of metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono-code mb-5">
        <div className="space-y-2.5 rounded-xl border border-slate-800 bg-[#0d152e] p-3.5">
          <div className="flex justify-between items-center text-slate-400">
            <span>Evidence ID:</span>
            <div className="flex items-center gap-1.5 font-bold text-white">
              <span>{evidence.evidence_id}</span>
              <button
                type="button"
                onClick={() => copyId(evidence.evidence_id)}
                className="text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                title="Sao chép Evidence ID"
              >
                {idCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Mã vụ việc:</span>
            <span className="text-cyan-300 font-semibold">{evidence.case_code}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Người nộp:</span>
            <span className="text-slate-200 font-sans">{evidence.submitted_by}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Tiêu đề:</span>
            <span className="text-slate-200 font-sans truncate max-w-[170px]" title={evidence.title}>
              {evidence.title}
            </span>
          </div>
        </div>

        <div className="space-y-2.5 rounded-xl border border-slate-800 bg-[#0d152e] p-3.5">
          <div className="flex justify-between text-slate-400">
            <span>Tên tệp gốc:</span>
            <span className="text-slate-200 truncate max-w-[170px]" title={evidence.original_filename}>
              {evidence.original_filename}
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Dung lượng:</span>
            <span className="text-slate-300">{formatBytes(evidence.size_bytes)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Định dạng:</span>
            <span className="text-slate-400 truncate max-w-[170px]">{evidence.mime_type}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Mạng:</span>
            <span className="text-cyan-400 font-semibold">Sepolia Testnet (11155111)</span>
          </div>
        </div>
      </div>

      {/* Cryptographic Details Card */}
      <div className="rounded-xl border border-cyan-500/20 bg-[#0a122a]/80 p-4 space-y-3 mb-5 font-mono-code text-xs">
        <div>
          <span className="text-slate-400 block mb-1">Mã băm SHA-256 (Dấu vân tay số):</span>
          <HashDisplay hash={evidence.sha256} className="w-full" />
        </div>

        <div>
          <span className="text-slate-400 block mb-1">Mã giao dịch Blockchain (Tx Hash):</span>
          <HashDisplay hash={evidence.tx_hash} className="w-full" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-[11px]">
          <div className="text-slate-400">
            Khối Sepolia:{' '}
            <span className="text-emerald-400 font-bold">
              {evidence.block_number ? `#${evidence.block_number}` : '(Đang chờ)'}
            </span>
          </div>
          <div className="text-slate-400">
            Xác nhận:{' '}
            <span className="text-slate-200">{utc}</span>
            <span className="text-slate-400 block sm:inline sm:ml-2">({local})</span>
          </div>
        </div>
      </div>

      {/* Amber Mandatory Warning Banner */}
      <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-950/30 p-3.5 text-xs text-amber-200 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-300">
            Lưu ý bảo quản bằng chứng:
          </p>
          <p className="text-[11px] text-amber-200/90 mt-0.5 leading-relaxed">
            Hệ thống chỉ lưu mã băm lên blockchain để bảo mật thông tin. Hãy lưu giữ tệp gốc cẩn thận; chỉ cần thay đổi 1 byte (chỉnh sửa, cắt ghép, đổi metadata), việc đối chiếu xác minh sau này sẽ thất bại.
          </p>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2">
        {evidence.explorer_url && (
          <a
            href={evidence.explorer_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/30 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/50 hover:text-white transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Xem trên Sepolia Etherscan ↗
          </a>
        )}

        {isConfirmed && (
          <button
            type="button"
            onClick={() => downloadReceiptFile(evidence.evidence_id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
          >
            <Download className="h-3.5 w-3.5 stroke-[2.5]" />
            Tải biên nhận JSON
          </button>
        )}

        <Link
          to={`/verify?evidence_id=${evidence.evidence_id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <span>Đi tới Xác minh</span>
          <ArrowRight className="h-3.5 w-3.5 text-cyan-400" />
        </Link>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="ml-auto inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer py-2 px-1"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Ký gửi tệp khác
          </button>
        )}
      </div>
    </div>
  )
}
