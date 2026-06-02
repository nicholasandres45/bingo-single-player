import { useEffect, useState } from 'react'

const DISMISS_SECS = 6

export default function LoseModal({ callCount, onClose, onPlayAgain, isMuted }) {
  const [visible, setVisible]   = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    setTimeout(() => setVisible(true), 50)

    // Speech
    if (!isMuted && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      const msg = callCount
        ? `No luck this time. All ${callCount} numbers were called.`
        : 'No luck this time. Another player won this round.'
      const utter = new SpeechSynthesisUtterance(msg)
      utter.rate = 0.95
      utter.pitch = 1.0
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
        bg-[#0d1117] border border-gray-800/60 rounded-3xl overflow-hidden max-w-[300px] w-full text-center
        shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all duration-300
        ${visible ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-4'}
      `}>

        {/* Progress bar */}
        <div className="h-0.5 bg-gray-800 w-full">
          <div
            className="h-full bg-red-600/60 transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-7">
          {/* Icon */}
          <div className="w-14 h-14 rounded-full bg-red-500/8 border border-red-900/40 flex items-center justify-center mx-auto mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-red-500">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>

          {/* Title */}
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-500/70 mb-2">
            Round Over
          </p>
          <h2 className="text-2xl font-bold text-white tracking-tight leading-tight mb-4">
            No Luck
          </h2>

          {/* Divider */}
          <div className="h-px bg-gray-800/80 mb-4" />

          {/* Message */}
          <p className="text-sm text-gray-400 leading-relaxed mb-7">
            {callCount
              ? <>All <span className="text-white font-semibold">{callCount}</span> numbers were called</>
              : 'Another player won this round'}
          </p>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onPlayAgain}
              className="flex-1 py-2.5 bg-gradient-to-r from-cyan-700 to-cyan-600 hover:from-cyan-600 hover:to-cyan-500 text-white text-sm font-bold tracking-wide rounded-xl transition-all active:scale-95"
            >
              Try Again
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
