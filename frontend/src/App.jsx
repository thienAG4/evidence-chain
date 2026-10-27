import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import { ToastProvider } from './components/Toast'
import UploadPage from './pages/UploadPage'
import VerifyPage from './pages/VerifyPage'
import EvidenceListPage from './pages/EvidenceListPage'
import AuditLogPage from './pages/AuditLogPage'
import { ShieldCheck, Lock, ExternalLink } from 'lucide-react'

export default function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-[#0a122a] text-[#dbe1ff]">
        <Navbar />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/evidence" element={<EvidenceListPage />} />
            <Route path="/logs" element={<AuditLogPage />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <footer className="mt-auto border-t border-slate-800/80 bg-[#070d1e] py-8 text-center text-xs text-slate-500 font-mono-code">
          <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-400 font-sans">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span>Evidence Chain v1.0 • Neo bằng chứng trên Ethereum Sepolia (Chain ID 11155111)</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <Lock className="h-3 w-3" />
                Zero-Knowledge Privacy: Chỉ lưu mã băm SHA-256
              </span>
              <span>•</span>
              <a
                href="https://sepolia.etherscan.io"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-300 transition-colors inline-flex items-center gap-1"
              >
                <span>Sepolia Explorer</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <p className="mt-4 text-[10px] text-slate-600 font-sans max-w-2xl mx-auto px-4">
            Chứng thực kỹ thuật mốc thời gian và tính toàn vẹn của tệp số. Hãy bảo quản tệp gốc nguyên vẹn để phục vụ quá trình giám định và đối chiếu độc lập.
          </p>
        </footer>
      </div>
    </ToastProvider>
  )
}
