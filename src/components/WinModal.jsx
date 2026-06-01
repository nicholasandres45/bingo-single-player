import { useEffect, useState } from 'react'

export default function WinModal({
  winType, payout, payoutPerCard, winCount,
  stakeReturn, totalReturn, callCount,
  onClose, onPlayAgain,
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 50) }, [])

  const multiCard  = winCount > 1
  const displayTotal = totalReturn ?? payout

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
      <div className={`
        bg-gray-950 border border-cyan-500/50 rounded-2xl p-6 max-w-[280px] w-full text-center
        shadow-[0_0_40px_rgba(6,182,212,0.2)] transition-all duration-300
        ${visible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
      `}>
        <div className="text-5xl mb-2">🎉</div>
        <h2 className="font-display text-3xl text-cyan-400 tracking-widest mb-0.5">
          {winType === 'Full House' ? 'FULL HOUSE!' : `${winType}!`}
        </h2>
        <p className="text-gray-500 text-xs mb-3">
          {multiCard && <span className="text-cyan-400 font-semibold">{winCount} cards</span>}
          {multiCard && ' · '}
          completed in <span className="text-white font-semibold">{callCount}</span> calls
        </p>

        <div className="bg-black/60 rounded-xl p-3 mb-4 border border-cyan-900/50 flex flex-col gap-2 text-left">

          {/* Per-card win (show if multi-card) */}
          {multiCard && payoutPerCard > 0 && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 text-[10px] uppercase tracking-wider">Per Card</span>
              <span className="font-mono-nums text-[10px] font-semibold text-cyan-400">
                {payoutPerCard.toLocaleString()} ETB × {winCount}
              </span>
            </div>
          )}

          {/* Win payout */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500 text-[10px] uppercase tracking-wider">Win Payout</span>
            <span className="font-mono-nums text-sm font-bold text-green-400">
              +{payout.toLocaleString()} ETB
            </span>
          </div>

          {/* Stake return */}
          {stakeReturn > 0 && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 text-[10px] uppercase tracking-wider">Stake Return</span>
              <span className="font-mono-nums text-sm font-bold text-cyan-400">
                +{stakeReturn.toLocaleString()} ETB
              </span>
            </div>
          )}

          {/* Total */}
          {stakeReturn > 0 && (
            <>
              <div className="h-px bg-gray-800/60" />
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-300 text-[10px] uppercase tracking-wider font-semibold">Total</span>
                <span className="font-display text-2xl text-green-400 tracking-wider">
                  +{displayTotal.toLocaleString()} ETB
                </span>
              </div>
            </>
          )}

          {/* Fallback single line */}
          {!stakeReturn && (
            <div className="text-center">
              <p className="font-display text-4xl text-green-400 tracking-wider">
                +{payout.toLocaleString()} ETB
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-display text-xl tracking-wider rounded-xl transition-all active:scale-95"
          >
            PLAY AGAIN
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
