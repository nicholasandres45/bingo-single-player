import { useEffect, useState } from 'react'

export default function WinModal({ winType, payout, callCount, onClose, onPlayAgain }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
  }, [])

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className={`
        bg-gray-950 border-2 border-red-600 rounded-2xl p-8 max-w-sm w-full text-center
        transition-all duration-300
        ${visible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
      `}>
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-red-500 font-black text-2xl uppercase tracking-widest mb-2">
          {winType === 'Full House' ? 'FULL HOUSE!' : `${winType}!`}
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          Completed in <span className="text-white font-bold">{callCount}</span> calls
        </p>
        <div className="bg-black rounded-xl p-4 mb-6 border border-red-900">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Payout</p>
          <p className="text-green-400 font-black text-4xl">+{payout} ETB</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all"
          >
            Play Again
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
