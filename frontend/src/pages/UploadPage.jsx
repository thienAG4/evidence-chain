import React, { useState, useEffect } from 'react'
import { Link2, ShieldCheck, AlertTriangle, AlertCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react'
import FileDropzone from '../components/FileDropzone'
import Stepper from '../components/Stepper'
import ReceiptCard from '../components/ReceiptCard'
import { submitEvidence } from '../api/evidenceApi'
import usePollEvidence from '../hooks/usePollEvidence'
import { useToast } from '../components/Toast'

export default function UploadPage() {
  const { addToast } = useToast()

  const [file, setFile] = useState(null)
  const [caseCode, setCaseCode] = useState('')
  const [title, setTitle] = useState('')
  const [submittedBy, setSubmittedBy] = useState('')
  const [description, setDescription] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [submittedEvidenceId, setSubmittedEvidenceId] = useState(null)
  const [initialEvidenceData, setInitialEvidenceData] = useState(null)

  // Poll evidence until confirmed or failed
  const { data: polledEvidence, isPolling } = usePollEvidence(submittedEvidenceId)

  const activeEvidence = polledEvidence || initialEvidenceData

  // Calculate current stepper position
  let currentStep = 1
  let isFailed = false

  if (isSubmitting) {
    currentStep = 2 // Computing hash / sending
  } else if (activeEvidence) {
    if (activeEvidence.status === 'HASHED') currentStep = 2
    else if (activeEvidence.status === 'PENDING') currentStep = 3
    else if (activeEvidence.status === 'CONFIRMED') currentStep = 4
    else if (activeEvidence.status === 'FAILED') {
      currentStep = 3
      isFailed = true
    }
  }

  const handleFileSelect = (selectedFile) => {
    // Basic client validation
    const ext = selectedFile.name.split('.').pop().toLowerCase()
    const forbidden = ['exe', 'bat', 'cmd', 'sh', 'js', 'msi', 'dll']
    if (forbidden.includes(ext)) {
      addToast('Loại tệp không được hỗ trợ (chặn tệp thực thi vì lý do bảo mật).', 'error')
      return
    }
    if (selectedFile.size === 0) {
      addToast('Tệp rỗng (0 byte). Vui lòng chọn tệp hợp lệ.', 'error')
      return
    }
    if (selectedFile.size > 200 * 1024 * 1024) {
      addToast('Tệp vượt quá giới hạn 200 MB.', 'error')
      return
    }
    setFile(selectedFile)
    if (!title) {
      // Auto-populate title with readable filename
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
      setTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1))
    }
  }

  const handleClear = () => {
    setFile(null)
    setUploadProgress(null)
    setSubmittedEvidenceId(null)
    setInitialEvidenceData(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      addToast('Vui lòng chọn một tệp bằng chứng.', 'error')
      return
    }
    if (!caseCode.trim()) {
      addToast('Vui lòng nhập Mã vụ việc (ví dụ: TA-2026-0153).', 'error')
      return
    }
    if (!title.trim()) {
      addToast('Vui lòng nhập Tiêu đề chứng cứ.', 'error')
      return
    }
    if (!submittedBy.trim()) {
      addToast('Vui lòng nhập Tên người nộp hoặc Giám định viên.', 'error')
      return
    }

    try {
      setIsSubmitting(true)
      const data = await submitEvidence(
        {
          file,
          caseCode: caseCode.trim(),
          title: title.trim(),
          submittedBy: submittedBy.trim(),
          description: description.trim()
        },
        (progress) => setUploadProgress(progress)
      )

      setInitialEvidenceData(data)
      setSubmittedEvidenceId(data.evidence_id)

      if (data.duplicate) {
        addToast('Tệp này đã được ký gửi trước đó! Hiển thị biên nhận gốc.', 'info')
      } else {
        addToast('Đã tính mã băm và phát giao dịch lên Sepolia!', 'success')
      }
    } catch (err) {
      addToast(err.message || 'Không thể ký gửi bằng chứng.', 'error')
    } finally {
      setIsSubmitting(false)
      setUploadProgress(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-xs font-mono-code text-cyan-300 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          HỆ THỐNG ĐÓNG DẤU THỜI GIAN & MÃ BĂM PHÁP LÝ (SEPOLIA)
        </div>
        <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight">
          Ký gửi bằng chứng lên blockchain
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
          Tệp được tính mã băm SHA-256 theo luồng dữ liệu mật mã, chỉ mã băm được ghi vào giao dịch Sepolia để xác lập con dấu thời gian bất biến.
        </p>
      </div>

      {/* 4-Step Stepper */}
      <div className="mb-8">
        <Stepper currentStep={currentStep} isFailed={isFailed} />
      </div>

      {/* Main View: Form & Dropzone OR Completed Receipt */}
      {activeEvidence && (activeEvidence.status === 'CONFIRMED' || activeEvidence.duplicate) ? (
        <div className="animate-in fade-in duration-300">
          <ReceiptCard evidence={activeEvidence} onReset={handleClear} />
        </div>
      ) : (
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
            {/* Left Column: Dropzone (7 cols on lg ~ 58%) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="rounded-2xl border border-cyan-500/20 bg-[#111c3d]/80 p-5 sm:p-6 backdrop-blur-md shadow-xl">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-700/60 pb-3">
                  <div className="h-2 w-2 rounded-full bg-cyan-400" />
                  <h2 className="font-display font-semibold text-base text-white">
                    1. Tệp chứng cứ số
                  </h2>
                </div>

                <FileDropzone
                  file={file}
                  onFileSelect={handleFileSelect}
                  onFileClear={() => setFile(null)}
                  progress={uploadProgress}
                  disabled={isSubmitting || !!activeEvidence}
                />

                {/* Live upload info helper */}
                {file && (
                  <div className="mt-4 rounded-xl border border-slate-800 bg-[#0d152e] p-3 text-xs font-mono-code text-slate-300 flex items-center justify-between">
                    <span>Sẵn sàng tính hàm băm SHA-256:</span>
                    <span className="text-emerald-400 font-semibold">Ready</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Case Info Form (5 cols on lg ~ 42%) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="rounded-2xl border border-cyan-500/20 bg-[#111c3d]/80 p-5 sm:p-6 backdrop-blur-md shadow-xl flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-700/60 pb-3">
                  <div className="h-2 w-2 rounded-full bg-cyan-400" />
                  <h2 className="font-display font-semibold text-base text-white">
                    2. Thông tin hồ sơ vụ việc
                  </h2>
                </div>

                <div className="space-y-3.5 flex-1 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Mã vụ việc <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: TA-2026-0153"
                      value={caseCode}
                      onChange={(e) => setCaseCode(e.target.value)}
                      disabled={isSubmitting || !!activeEvidence}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-white font-mono-code placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Tiêu đề chứng cứ <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Ảnh hiện trường ngày 12/10"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={isSubmitting || !!activeEvidence}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Người nộp / Giám định viên <span className="text-cyan-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Nguyễn Văn A (Luật sư)"
                      value={submittedBy}
                      onChange={(e) => setSubmittedBy(e.target.value)}
                      disabled={isSubmitting || !!activeEvidence}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Mô tả bổ sung (tùy chọn)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ghi chú hoàn cảnh thu thập hoặc thông tin kỹ thuật..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={isSubmitting || !!activeEvidence}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Amber Alert Disclaimer (Full Width) */}
            <div className="lg:col-span-12 rounded-xl border border-amber-500/30 bg-amber-950/25 p-4 text-xs text-amber-200 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-300">
                  Nguyên lý bất biến & bảo mật tối đa:
                </p>
                <p className="text-[11px] text-amber-200/90 mt-0.5 leading-relaxed">
                  Chỉ mã băm SHA-256 được lưu trên blockchain. Nội dung tài liệu không bao giờ bị lộ ra ngoài. Hãy giữ tệp gốc nguyên vẹn; chỉ cần sửa 1 byte, việc xác minh sẽ thất bại.
                </p>
              </div>
            </div>

            {/* Primary Action Button Bar */}
            <div className="lg:col-span-12 flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="text-xs text-slate-400 font-mono-code">
                Mạng: <span className="text-cyan-400">Sepolia (11155111)</span> • Loại: <span className="text-slate-200">EIP-1559 Self-transfer</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !file || !caseCode || !title || !submittedBy}
                className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold shadow-lg transition-all cursor-pointer ${
                  isSubmitting || !file || !caseCode || !title || !submittedBy
                    ? 'border border-slate-700 bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-cyan-400 via-sky-500 to-emerald-400 text-slate-950 hover:shadow-cyan-500/30 hover:scale-[1.02]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang tính hash & gửi lên Sepolia...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
                    <span>Ký gửi lên blockchain</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Pending state progress banner if in progress */}
          {activeEvidence && activeEvidence.status === 'PENDING' && (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-950/30 p-5 text-left text-xs font-mono-code space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-amber-300 font-bold">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                  Giao dịch đang chờ xác nhận trên Sepolia (thường 15-30 giây)...
                </span>
                <span>PENDING</span>
              </div>
              <div className="text-slate-300">
                Tx Hash: <span className="text-cyan-300">{activeEvidence.tx_hash}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Giao diện đang tự động đồng bộ trạng thái trực tiếp với blockchain. Bạn không cần tải lại trang.
              </p>
            </div>
          )}

          {/* Failed state error banner if anchoring failed */}
          {activeEvidence && activeEvidence.status === 'FAILED' && (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-5 text-left text-xs font-mono-code space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-rose-300 font-bold">
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-400" />
                  Giao dịch neo bằng chứng lên Sepolia thất bại:
                </span>
                <span className="rounded bg-rose-500/20 px-2 py-0.5 text-rose-300">FAILED</span>
              </div>
              <div className="rounded-lg bg-rose-900/30 p-3 border border-rose-800/40 text-slate-200">
                {activeEvidence.error_message || 'Ví hệ thống không đủ ETH để trả phí gas trên mạng Sepolia.'}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Mẹo: Kiểm tra số dư Sepolia ETH của ví hệ thống hoặc nạp faucet miễn phí.
                </span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 transition-colors cursor-pointer"
                >
                  Nhập lại tệp khác
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
