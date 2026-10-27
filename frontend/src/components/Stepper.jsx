import React from 'react'
import { Check, Loader2, AlertCircle } from 'lucide-react'

export default function Stepper({ currentStep = 1, isFailed = false }) {
  const steps = [
    { number: 1, label: 'Tải tệp' },
    { number: 2, label: 'Tính hash' },
    { number: 3, label: 'Gửi Sepolia' },
    { number: 4, label: 'Xác nhận' }
  ]

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between max-w-2xl mx-auto relative">
        {/* Continuous Connecting Line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-800 -z-0">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 100))}%`
            }}
          />
        </div>

        {steps.map((s) => {
          const isDone = currentStep > s.number
          const isCurrent = currentStep === s.number
          const isError = isCurrent && isFailed

          return (
            <div key={s.number} className="flex flex-col items-center relative z-10">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                  isDone
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                    : isError
                    ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                    : isCurrent
                    ? 'border-2 border-cyan-400 bg-cyan-950 text-cyan-300 shadow-md shadow-cyan-500/30 animate-pulse'
                    : 'border border-slate-700 bg-slate-900 text-slate-500'
                }`}
              >
                {isDone ? (
                  <Check className="h-4 w-4 stroke-[3]" />
                ) : isError ? (
                  <AlertCircle className="h-4 w-4" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  s.number
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium text-center ${
                  isDone
                    ? 'text-emerald-400'
                    : isError
                    ? 'text-red-400'
                    : isCurrent
                    ? 'text-cyan-300 font-semibold'
                    : 'text-slate-500'
                }`}
              >
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
