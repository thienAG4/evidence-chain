import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShieldCheck, Link2, Activity, Wallet, Layers, FileCheck, History } from 'lucide-react'
import { getHealth } from '../api/logsApi'
import { truncateHash } from '../utils/format'

export default function Navbar() {
  const location = useLocation()
  const [health, setHealth] = useState(null)
  const [showTooltip, setShowTooltip] = useState(false)

  const fetchHealth = () => {
    getHealth()
      .then((data) => setHealth(data))
      .catch(() => setHealth({ status: 'down' }))
  }

  useEffect(() => {
    fetchHealth()
    const timer = setInterval(fetchHealth, 30000)
    return () => clearInterval(timer)
  }, [])

  const navLinks = [
    { to: '/', label: 'Ký gửi', icon: Link2 },
    { to: '/verify', label: 'Xác minh', icon: FileCheck },
    { to: '/evidence', label: 'Danh sách', icon: Layers },
    { to: '/logs', label: 'Nhật ký', icon: History }
  ]

  const isConnected = health && health.status !== 'down'
  const isDegraded = health && health.status === 'degraded'

  return (
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
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
