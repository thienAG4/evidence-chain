import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchCheck, FileCheck, RefreshCw, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import FileDropzone from '../components/FileDropzone'
import VerifyResultBanner from '../components/VerifyResultBanner'
import { verifyEvidence } from '../api/verifyApi'
import { useToast } from '../components/Toast'

export default function VerifyPage() {
  const [searchParams] = useSearchParams()
  const { addToast } = useToast()

  const [file, setFile] = useState(null)
  const [evidenceId, setEvidenceId] = useState('')
  const [txHash, setTxHash] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState(null)

  // Read ?evidence_id= from query params if redirected from receipt or list
  useEffect(() => {
    const qId = searchParams.get('evidence_id')
    if (qId) {
      setEvidenceId(qId)
    }
  }, [searchParams])

  const handleFileSelect = (selectedFile) => {
    if (selectedFile.size === 0) {
      addToast('Tệp rỗng (0 byte). Vui lòng chọn tệp hợp lệ.', 'error')
      return
    }
    setFile(selectedFile)
    setVerifyResult(null)
  }

  const handleReset = () => {
    setFile(null)
    setVerifyResult(null)
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!file) {
      addToast('Vui lòng chọn tệp chứng cứ cần kiểm tra.', 'error')
      return
    }

    if (txHash.trim()) {
      const cleanTx = txHash.trim().toLowerCase()
      if (!/^0x[a-f0-9]{64}$/.test(cleanTx)) {
        addToast('Mã giao dịch (Tx Hash) phải có định dạng 0x + 64 ký tự hex.', 'error')
        return
      }
    }

    try {
      setIsVerifying(true)
      const res = await verifyEvidence({
        file,
        evidenceId: evidenceId.trim() || undefined,
        txHash: txHash.trim() || undefined
      })
      setVerifyResult(res)

      if (res.status === 'VERIFIED') {
        addToast('Xác minh thành công: Tệp nguyên vẹn trùng khớp 100%!', 'success')
      } else if (res.status === 'MISMATCH') {
        addToast('Cảnh báo: Mã băm của tệp không khớp với dữ liệu trên blockchain!', 'error')
      } else if (res.status === 'NOT_FOUND') {
        addToast('Không tìm thấy bản ghi neo bằng chứng nào khớp với tệp.', 'info')
      }
    } catch (err) {
      addToast(err.message || 'Lỗi trong quá trình đối chiếu blockchain.', 'error')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-xs font-mono-code text-cyan-300 mb-3">
          <SearchCheck className="h-3.5 w-3.5 text-cyan-400" />
          HỆ THỐNG ĐỐI CHIẾU MẬT MÃ & KIỂM CHỨNG TÒA ÁN
        </div>
        <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight">
          Xác minh tính toàn vẹn của bằng chứng
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
          Tải lại tệp bất kỳ lúc nào để đối chiếu mã băm SHA-256 trực tiếp với dữ liệu đã khắc vĩnh viễn trên mạng Sepolia.
        </p>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleVerify} className="space-y-6 text-left">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* File Dropzone (Left ~ 58%) */}
          <div className="md:col-span-7">
            <div className="rounded-2xl border border-cyan-500/20 bg-[#111c3d]/80 p-5 sm:p-6 backdrop-blur-md shadow-xl">
              <div className="flex items-center justify-between mb-4 border-b border-slate-700/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-cyan-400" />
                  <h2 className="font-display font-semibold text-base text-white">
                    Tệp chứng cứ cần kiểm tra
                  </h2>
                </div>
                <span className="text-[11px] font-mono-code text-cyan-400">
                  Zero Server Storage
                </span>
              </div>

              <FileDropzone
                file={file}
                onFileSelect={handleFileSelect}
                onFileClear={handleReset}
                disabled={isVerifying}
              />

              <p className="mt-3 text-[11px] text-slate-400 font-mono-code">
                * Tệp này KHÔNG được lưu trên máy chủ, chỉ được đọc để tính hàm băm SHA-256 rồi giải phóng khỏi bộ nhớ.
              </p>
            </div>
          </div>

          {/* Optional Matching Keys (Right ~ 42%) */}
          <div className="md:col-span-5">
            <div className="rounded-2xl border border-cyan-500/20 bg-[#111c3d]/80 p-5 sm:p-6 backdrop-blur-md shadow-xl h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4 border-b border-slate-700/60 pb-3">
                  <div className="h-2 w-2 rounded-full bg-slate-400" />
                  <h2 className="font-display font-semibold text-base text-white">
                    Tham số đối chiếu (Tùy chọn)
                  </h2>
                </div>

                <div className="space-y-3.5 text-xs font-mono-code">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1 font-sans">
                      Evidence ID (Mã biên nhận):
                    </label>
                    <input
                      type="text"
                      placeholder="VD: EV-20261027-K3F9QZ"
                      value={evidenceId}
                      onChange={(e) => setEvidenceId(e.target.value)}
                      disabled={isVerifying}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1 font-sans">
                      Transaction Hash (Mã giao dịch):
                    </label>
                    <input
                      type="text"
                      placeholder="0x5c1d...e9a2"
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      disabled={isVerifying}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-800 bg-[#0c142c] p-3 text-[11px] text-slate-400 leading-relaxed font-sans">
                  💡 Nếu bạn để trống, hệ thống sẽ tự động tra cứu mã băm của tệp trong sổ cái và đối chiếu trực tiếp từ mạng Sepolia.
                </div>
              </div>

              <div className="pt-4 mt-auto">
                <button
                  type="submit"
                  disabled={isVerifying || !file}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-lg transition-all cursor-pointer ${
                    isVerifying || !file
                      ? 'border border-slate-700 bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-cyan-400 via-sky-500 to-emerald-400 text-slate-950 hover:shadow-cyan-500/30 hover:scale-[1.01]'
                  }`}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang băm tệp & truy vấn Sepolia...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="h-4 w-4 stroke-[2.5]" />
                      <span>Kiểm tra tệp & Đối chiếu On-chain</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Verification Result Showcase */}
      {verifyResult && (
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-white">
              Kết quả kiểm tra đối chiếu
            </h2>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Kiểm tra tệp khác
            </button>
          </div>
          <VerifyResultBanner result={verifyResult} />
        </div>
      )}
    </div>
  )
}
