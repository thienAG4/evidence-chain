import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  ShieldCheck, 
  Link2, 
  Activity, 
  Layers, 
  FileCheck, 
  History, 
  Settings, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ExternalLink,
  RefreshCw 
} from 'lucide-react'
import { getHealth } from '../api/logsApi'
import { getApiBaseUrl, setApiBaseUrl } from '../api/client'
import { truncateHash } from '../utils/format'

export default function Navbar() {
  const location = useLocation()
  const [health, setHealth] = useState(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  
  // Backend URL configuration state
  const [customUrl, setCustomUrl] = useState('')
  const [testStatus, setTestStatus] = useState(null) // null | 'testing' | 'success' | 'failed'
  const [testError, setTestError] = useState('')

  const fetchHealth = () => {
    getHealth()
      .then((data) => setHealth(data))
      .catch(() => setHealth({ status: 'down' }))
  }

  useEffect(() => {
    setCustomUrl(getApiBaseUrl())
    fetchHealth()
    const timer = setInterval(fetchHealth, 25000)
    return () => clearInterval(timer)
  }, [])

  const handleTestConnection = async (urlToTest) => {
    const target = (urlToTest || '').trim().replace(/\/+$/, '')
    const testEndpoint = target ? `${target}/api/health` : '/api/health'
    setTestStatus('testing')
    setTestError('')
    try {
      const res = await fetch(testEndpoint, { signal: AbortSignal.timeout(6000) })
      if (!res.ok) {
        throw new Error(`Máy chủ trả về mã HTTP ${res.status}`)
      }
      const data = await res.json()
      if (data && data.status) {
        setTestStatus('success')
        return true
      } else {
        throw new Error('Dữ liệu trả về không đúng định dạng Health API.')
      }
    } catch (err) {
      setTestStatus('failed')
      setTestError(err.message || 'Không thể kết nối đến máy chủ này.')
      return false
    }
  }

  const handleSaveConfig = async (e) => {
    e.preventDefault()
    setApiBaseUrl(customUrl)
    setShowConfigModal(false)
    fetchHealth()
  }

  const handleResetConfig = () => {
    setCustomUrl('')
    setApiBaseUrl('')
    setTestStatus(null)
    setTestError('')
    fetchHealth()
  }

  const navLinks = [
    { to: '/', label: 'Ký gửi', icon: Link2 },
    { to: '/verify', label: 'Xác minh', icon: FileCheck },
    { to: '/evidence', label: 'Danh sách', icon: Layers },
    { to: '/logs', label: 'Nhật ký', icon: History }
  ]

  const isConnected = health && health.status !== 'down'
  const isDegraded = health && health.status === 'degraded'
  const isVercelProduction = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
  const showDisconnectedBanner = !isConnected && isVercelProduction

  return (
    <>
      {/* Top Banner when Backend is offline on Vercel */}
      {showDisconnectedBanner && (
        <div className="bg-rose-950/80 border-b border-rose-500/30 px-4 py-2 text-xs text-rose-200 flex flex-wrap items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>
              <strong>Chưa kết nối Backend (Render):</strong> Thao tác ký gửi sẽ bị lỗi 405 nếu chưa cài đặt địa chỉ máy chủ API.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white px-2.5 py-1 text-xs font-semibold border border-rose-500/40 transition-colors cursor-pointer"
          >
            ⚙️ Cấu hình Backend ngay
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 w-full border-b border-cyan-500/15 bg-[#0a122a]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-[#0a122a]">
                <ShieldCheck className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-lg tracking-tight text-white">
                  Evidence<span className="text-cyan-400">Chain</span>
                </span>
                <span className="rounded bg-cyan-950/80 px-1.5 py-0.5 text-[10px] font-mono-code font-semibold text-cyan-300 border border-cyan-500/30">
                  SEP
                </span>
              </div>
              <p className="hidden sm:block text-[10px] text-slate-400 -mt-0.5 font-medium">
                Blockchain Legal Evidence Anchoring
              </p>
            </div>
          </Link>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Network & Backend Config */}
          <div className="flex items-center gap-2">
            {/* Backend Config Gear Button */}
            <button
              type="button"
              onClick={() => {
                setCustomUrl(getApiBaseUrl())
                setShowConfigModal(true)
              }}
              title="Cấu hình URL máy chủ Backend (Render / API)"
              className="flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/80 p-2 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Network & Node Pill */}
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
                className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-xs text-slate-300 hover:border-cyan-500/40 transition-colors cursor-pointer"
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      !isConnected
                        ? 'bg-red-400'
                        : isDegraded
                        ? 'animate-ping bg-amber-400'
                        : 'animate-ping bg-emerald-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      !isConnected
                        ? 'bg-red-500'
                        : isDegraded
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                </span>
                <span className="font-mono-code text-[11px] font-medium hidden sm:inline">
                  Sepolia
                </span>
                {health?.latest_block ? (
                  <span className="font-mono-code text-[11px] text-cyan-400 font-semibold">
                    #{health.latest_block}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    {isConnected ? 'Sẵn sàng' : 'Mất kết nối'}
                  </span>
                )}
              </button>

              {/* Tooltip with Wallet & Gas Balance */}
              {showTooltip && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-cyan-500/30 bg-[#131a33] p-3 text-xs shadow-xl shadow-black/60 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-2 mb-2">
                    <span className="font-medium text-slate-200 flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-cyan-400" />
                      Mạng Ethereum Sepolia
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        !isConnected
                          ? 'bg-red-500/20 text-red-400'
                          : isDegraded
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {health?.status?.toUpperCase() || 'OFFLINE'}
                    </span>
                  </div>
                  <div className="space-y-1.5 font-mono-code text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Chain ID:</span>
                      <span className="text-slate-200">11155111</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Ví hệ thống:</span>
                      <span className="text-cyan-300">
                        {health?.wallet_address ? truncateHash(health.wallet_address, 6, 4) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Số dư gas:</span>
                      <span className={`font-semibold ${isDegraded ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {health?.wallet_balance_eth ? `${health.wallet_balance_eth} ETH` : '0 ETH'}
                      </span>
                    </div>
                  </div>
                  {isDegraded && (
                    <p className="mt-2 text-[10px] text-amber-400 border-t border-amber-500/20 pt-1.5">
                      Số dư ví thấp (&lt; 0.05 ETH). Cần bổ sung ETH testnet.
                    </p>
                  )}
                  {!isConnected && (
                    <div className="mt-2.5 border-t border-slate-700/60 pt-2 text-[10px] text-slate-300">
                      <p className="text-rose-400 font-semibold mb-1">Chưa kết nối Backend API</p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowTooltip(false)
                          setShowConfigModal(true)
                        }}
                        className="text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Settings className="h-3 w-3" /> Cấu hình URL Backend (Render)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Backend Server Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-[#0f172e] p-6 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-cyan-400" />
                <h3 className="font-display font-bold text-base text-white">
                  Cấu hình Máy chủ Backend (Render / API)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Địa chỉ URL Backend (API Base URL):
                </label>
                <input
                  type="url"
                  placeholder="VD: https://evidence-chain-backend.onrender.com"
                  value={customUrl}
                  onChange={(e) => {
                    setCustomUrl(e.target.value)
                    setTestStatus(null)
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 text-white font-mono-code placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors"
                />
                <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
                  Để trống nếu dùng cùng tên miền (proxy nội bộ). Khi chạy trên Vercel, hãy điền URL dịch vụ Render của bạn.
                </p>
              </div>

              {/* Connection Test Output */}
              {testStatus === 'testing' && (
                <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/30 p-2.5 text-cyan-300 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
                  <span>Đang kiểm tra kết nối tới máy chủ...</span>
                </div>
              )}
              {testStatus === 'success' && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-2.5 text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Kết nối thành công! Máy chủ Backend đang hoạt động tốt.</span>
                </div>
              )}
              {testStatus === 'failed' && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-2.5 text-rose-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>{testError || 'Không thể kết nối tới URL này. Hãy kiểm tra lại máy chủ.'}</span>
                </div>
              )}

              {/* Instructions Box */}
              <div className="rounded-xl border border-slate-800 bg-[#0a1024] p-3 text-[11px] text-slate-300 space-y-1.5">
                <p className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Bạn chưa có máy chủ Backend trên Render?
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Truy cập <a href="https://dashboard.render.com/blueprints" target="_blank" rel="noreferrer" className="text-cyan-400 underline">dashboard.render.com/blueprints</a>.</li>
                  <li>Chọn <strong>New Blueprint Instance</strong> và liên kết repo <strong>thienAG4/evidence-chain</strong>.</li>
                  <li>Nhập khóa riêng <code>PRIVATE_KEY</code> và bấm <strong>Apply</strong> để nhận URL Render.</li>
                </ol>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleResetConfig}
                  className="text-slate-400 hover:text-slate-200 text-xs underline cursor-pointer"
                >
                  Xóa cấu hình
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTestConnection(customUrl)}
                    disabled={testStatus === 'testing'}
                    className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 transition-colors cursor-pointer"
                  >
                    Kiểm tra kết nối
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold px-4 py-2 hover:opacity-90 transition-opacity cursor-pointer shadow-md shadow-cyan-500/20"
                  >
                    Lưu & Kết nối
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
