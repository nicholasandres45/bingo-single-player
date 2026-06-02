import { useEffect, useState } from 'react'

export default function LoseModal({ callCount, onClose, onPlayAgain }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 50) }, [])

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-5">
      <div className={`
        bg-[#0d1117] border border-gray-800/60 rounded-3xl p-7 max-w-[300px] w-full text-center
        shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all duration-400
        ${visible ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-4'}
      `}>

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
        <h2 className="text-2xl font-bold text-white tracking-tight leading-tight mb-3">
          No Luck
        </h2>
        <p className="text-[12px] text-gray-500 mb-7 leading-relaxed">
          {callCount
            ? <>All <span className="text-gray-300 font-semibold">{callCount}</span> numbers were called</>
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
  )
}
