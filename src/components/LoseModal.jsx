import { useEffect, useState } from 'react'

export default function LoseModal({ callCount, onClose, onPlayAgain }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 50) }, [])

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
      <div className={`
        bg-gray-950 border border-red-900/50 rounded-2xl p-6 max-w-[280px] w-full text-center
        shadow-[0_0_30px_rgba(220,38,38,0.12)] transition-all duration-300
        ${visible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
      `}>
        <div className="text-5xl mb-2">😔</div>
        <h2 className="font-display text-3xl text-red-400 tracking-widest mb-1">
          NO LUCK
        </h2>
        <p className="text-gray-500 text-xs mb-6">
          {callCount
            ? <>All <span className="text-white font-semibold">{callCount}</span> numbers called</>
            : 'Another player won this round'}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-display text-xl tracking-wider rounded-xl transition-all active:scale-95"
          >
            TRY AGAIN
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 font-display text-xl tracking-wider rounded-xl transition-all"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  )
}
