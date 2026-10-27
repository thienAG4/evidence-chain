import React from 'react'
import {
  ShieldCheck,
  ShieldX,
  HelpCircle,
  Clock,
  AlertOctagon,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react'
import HashDisplay from './HashDisplay'
import { formatDateTime } from '../utils/format'
import { useCopy } from '../hooks/useCopy'

export default function VerifyResultBanner({ result }) {
  const { copied, copy } = useCopy()

  if (!result) return null

  const { status, message, computed_sha256, onchain_sha256, match, evidence } = result

  const renderStateBanner = () => {
    switch (status) {
      case 'VERIFIED':
        return {
          bg: 'border-emerald-500/40 bg-emerald-950/40',
          icon: <ShieldCheck className="h-9 w-9 text-emerald-400 shrink-0" />,
          title: 'KHỚP – TỆP NGUYÊN VẸN, ĐÃ ĐƯỢC NEO TRÊN BLOCKCHAIN',
          color: 'text-emerald-300',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        }
      case 'MISMATCH':
        return {
          bg: 'border-red-500/40 bg-red-950/40',
          icon: <ShieldX className="h-9 w-9 text-red-400 shrink-0" />,
          title: 'KHÔNG KHỚP – MÃ BĂM TỆP KHÁC VỚI DỮ LIỆU TRÊN BLOCKCHAIN',
          color: 'text-red-300',
          badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40'
        }
      case 'PENDING':
        return {
          bg: 'border-amber-500/40 bg-amber-950/40',
          icon: <Clock className="h-9 w-9 text-amber-400 shrink-0" />,
          title: 'ĐANG CHỜ – GIAO DỊCH NEO BẰNG CHỨNG ĐANG CHỜ XÁC NHẬN',
          color: 'text-amber-300',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        }
      case 'INVALID_ANCHOR':
        return {
          bg: 'border-orange-500/40 bg-orange-950/40',
          icon: <AlertOctagon className="h-9 w-9 text-orange-400 shrink-0" />,
          title: 'GIAO DỊCH KHÔNG HỢP LỆ – SAI ĐỊNH DẠNG HOẶC SAI VÍ HỆ THỐNG',
          color: 'text-orange-300',
          badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40'
        }
      case 'NOT_FOUND':
      default:
        return {
          bg: 'border-slate-700/80 bg-slate-900/60',
          icon: <HelpCircle className="h-9 w-9 text-slate-400 shrink-0" />,
          title: 'KHÔNG TÌM THẤY – HASH CHƯA TỪNG ĐƯỢC KÝ GỬI TRONG HỆ THỐNG',
          color: 'text-slate-300',
          badgeBg: 'bg-slate-800 text-slate-300 border-slate-700'
        }
    }
  }

  const stateCfg = renderStateBanner()

  // Character comparison for visual mismatch inspection
  const renderComparedHashes = () => {
    if (!onchain_sha256) {
      return (
        <div className="rounded-xl border border-slate-800 bg-[#0c142c] p-4 text-xs font-mono-code">
          <p className="text-slate-400 mb-1">Mã băm SHA-256 tính từ tệp bạn tải lên:</p>
          <p className="text-cyan-300 select-all break-all">{computed_sha256}</p>
        </div>
      )
    }

    const cArr = computed_sha256.split('')
    const oArr = onchain_sha256.split('')

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono-code">
        {/* Local Hash */}
        <div className="rounded-xl border border-slate-800 bg-[#0c142c] p-4 text-left">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
            <span className="font-semibold text-slate-300">Mã băm tệp vừa tải lên:</span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">Local SHA-256</span>
          </div>
          <div className="leading-relaxed break-all select-all font-medium">
            {cArr.map((ch, idx) => {
              const diff = ch !== oArr[idx]
              return (
                <span
                  key={idx}
                  className={diff ? 'bg-red-500/30 text-red-300 font-bold px-0.5 rounded' : 'text-slate-200'}
                >
                  {ch}
                </span>
              )
            })}
          </div>
        </div>

        {/* On-chain Hash */}
        <div className="rounded-xl border border-slate-800 bg-[#0c142c] p-4 text-left">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
            <span className="font-semibold text-slate-300">Mã băm neo trên Sepolia:</span>
            <span className="text-[10px] bg-cyan-950 px-2 py-0.5 rounded text-cyan-300 border border-cyan-500/30">
              Input Data EVD1:
            </span>
          </div>
          <div className="leading-relaxed break-all select-all font-medium">
            {oArr.map((ch, idx) => {
              const diff = ch !== cArr[idx]
              return (
                <span
                  key={idx}
                  className={diff ? 'bg-red-500/30 text-red-300 font-bold px-0.5 rounded' : 'text-cyan-300'}
                >
                  {ch}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const { utc, local } = formatDateTime(evidence?.block_timestamp)

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-300">
      {/* Primary Alert Banner */}
      <div className={`rounded-2xl border p-5 sm:p-6 backdrop-blur-md shadow-2xl ${stateCfg.bg}`}>
        <div className="flex items-start gap-4 text-left">
          {stateCfg.icon}
          <div>
            <span className={`inline-block text-[11px] font-mono-code font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border mb-1.5 ${stateCfg.badgeBg}`}>
              {status}
            </span>
            <h3 className={`font-display font-bold text-base sm:text-lg leading-snug ${stateCfg.color}`}>
              {stateCfg.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>
      </div>

      {/* Comparison table */}
      {renderComparedHashes()}

      {/* On-chain Evidence Details if found */}
      {evidence && (
        <div className="rounded-xl border border-cyan-500/20 bg-[#111c3d]/90 p-4 text-left text-xs font-mono-code space-y-3">
          <div className="font-display font-bold text-sm text-white border-b border-slate-700/60 pb-2 flex items-center justify-between">
            <span>Chi tiết bằng chứng trên sổ cái Sepolia:</span>
            {evidence.explorer_url && (
              <a
                href={evidence.explorer_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-sans"
              >
                <span>Xem trên Etherscan</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
            {evidence.evidence_id && (
              <div>
                <span className="text-slate-400 block">Evidence ID:</span>
                <span className="text-white font-semibold">{evidence.evidence_id}</span>
              </div>
            )}
            {evidence.case_code && (
              <div>
                <span className="text-slate-400 block">Mã vụ việc:</span>
                <span className="text-cyan-300 font-semibold">{evidence.case_code}</span>
              </div>
            )}
            <div>
              <span className="text-slate-400 block">Khối Sepolia:</span>
              <span className="text-emerald-400 font-bold">
                {evidence.block_number ? `#${evidence.block_number}` : '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Mốc thời gian tồn tại (Tồn tại muộn nhất vào):</span>
              <span className="text-white">{utc}</span>
              <span className="text-slate-400 block text-[11px]">({local})</span>
            </div>
            {evidence.issuer_address && (
              <div className="sm:col-span-2">
                <span className="text-slate-400 block">Ví phát hành (Hệ thống tòa án):</span>
                <span className="text-cyan-300 break-all">{evidence.issuer_address}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
