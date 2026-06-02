import { useEffect, useState } from 'react'

export default function WinModal({ winType, payout, callCount, onClose, onPlayAgain }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 50) }, [])

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-5">
      <div className={`
        bg-[#0d1117] border border-emerald-500/25 rounded-3xl p-6 max-w-[300px] w-full text-center
        shadow-[0_0_60px_rgba(16,185,129,0.15)] transition-all duration-400
        ${visible ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-4'}
      `}>

        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-emerald-400">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Win type */}
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-500 mb-1">
          {winType}
        </p>
        <h2 className="text-2xl font-bold text-white tracking-tight leading-tight mb-1">
          You Won!
        </h2>
        <p className="text-[11px] text-gray-500 mb-5">
          Completed in <span className="text-gray-300 font-semibold">{callCount}</span> calls
        </p>

        {/* Payout */}
        <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-2xl px-4 py-4 mb-5">
          <p className="text-[9px] uppercase tracking-[0.18em] text-gray-500 mb-1.5">Prize</p>
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="font-mono-nums text-3xl font-bold text-emerald-400 tracking-tight">
              +{payout.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-emerald-600">ETB</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-sm font-bold tracking-wide rounded-xl transition-all active:scale-95"
          >
            Play Again
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-gray-300 text-sm font-medium rounded-xl transition-all active:scale-95"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}
