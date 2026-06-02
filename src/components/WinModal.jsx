import { useEffect, useState } from 'react'

const DISMISS_SECS = 8

export default function WinModal({ winType, payout, callCount, onClose, onPlayAgain, isMuted }) {
  const [visible, setVisible]   = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    setTimeout(() => setVisible(true), 50)

    // Speech
    if (!isMuted && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(
        `Congratulations! ${winType}! You won ${payout.toLocaleString()} ETB in ${callCount} calls.`
      )
      utter.rate = 0.95
      utter.pitch = 1.1
      utter.volume = 1
      setTimeout(() => window.speechSynthesis.speak(utter), 300)
    }

    // Auto-dismiss progress bar
    const step  = 100 / (DISMISS_SECS * 20)
    const timer = setInterval(() => {
      setProgress(p => {
        if (p - step <= 0) { clearInterval(timer); onClose(); return 0 }
        return p - step
      })
    }, 50)

    return () => { clearInterval(timer); window.speechSynthesis?.cancel() }
  }, []) // eslint-disable-line

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-5">
      <div className={`
        bg-[#0d1117] border border-emerald-500/25 rounded-3xl overflow-hidden max-w-[300px] w-full text-center
        shadow-[0_0_60px_rgba(16,185,129,0.15)] transition-all duration-300
        ${visible ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-4'}
      `}>

        {/* Progress bar */}
        <div className="h-0.5 bg-gray-800 w-full">
          <div
            className="h-full bg-emerald-500/70 transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6">
          {/* Icon */}
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-emerald-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          {/* Win type */}
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-500 mb-2">
            {winType}
          </p>
          <h2 className="text-2xl font-bold text-white tracking-tight leading-tight mb-4">
            You Won!
          </h2>

          {/* Divider */}
          <div className="h-px bg-gray-800/80 mb-4" />

          {/* Calls */}
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">
            Completed in <span className="text-white font-semibold">{callCount}</span> calls
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
    </div>
  )
}
