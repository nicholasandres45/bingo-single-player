import { useMemo } from 'react'
import { TOTAL_CARDS } from '../utils/bingoUtils'

export default function BuyCards({
  selectedCardIds, onToggleCard,
  possibleWin, totalCost,
  onBet, phase, countdown, balance, cardCount,
  takenCardIds = new Set(), myCardIds = new Set(),
  betMsg = null,
}) {
  const cardNumbers = useMemo(() => Array.from({ length: TOTAL_CARDS }, (_, i) => i), [])

  const bettingOpen  = phase === 'betting' || phase === 'countdown'
  const hasSelection = selectedCardIds.size > 0
  // If balance failed to load, still allow the attempt — wallet API validates on debit
  const canAfford    = balance === null || (balance >= totalCost && totalCost > 0)
  const canBet       = bettingOpen && hasSelection && totalCost > 0 && canAfford

  const btnLabel = !bettingOpen ? 'Betting Closed'
    : !hasSelection              ? 'Select a Card'
    : !canAfford                 ? 'Insufficient Balance'
    : `Place Bet · ${totalCost} ETB`

  return (
    <div className="flex flex-col gap-2 px-3 py-2 h-full">

      {/* Balance */}
      <div className="flex items-center justify-between bg-gray-900/60 rounded-lg px-3 py-1 border border-gray-800/60 shrink-0">
        <span className="text-gray-500 text-[9px] font-medium">Balance</span>
        <span className="font-mono-nums text-[10px] font-bold text-yellow-400">
          {balance !== null ? `${balance.toLocaleString()} ETB` : '— tap header to refresh'}
        </span>
      </div>

      {/* Phase status strip */}
      {phase === 'countdown' && countdown !== null && (
        <div className="flex items-center justify-between bg-yellow-950/40 rounded-lg px-3 py-1 border border-yellow-800/40 shrink-0">
          <span className="text-yellow-600 text-[9px] font-medium flex-1 min-w-0">
            Closes in · {cardCount} card{cardCount !== 1 ? 's' : ''} placed
          </span>
          <span className="font-mono-nums text-[10px] font-bold text-yellow-400 shrink-0">{countdown}s</span>
        </div>
      )}
      {phase === 'betting' && cardCount > 0 && (
        <div className="bg-cyan-950/30 rounded-lg px-3 py-1 border border-cyan-900/40 shrink-0">
          <span className="text-cyan-700 text-[9px] font-medium">
            {cardCount} card{cardCount !== 1 ? 's' : ''} placed · bet to start countdown
          </span>
        </div>
      )}
      {(phase === 'calling' || phase === 'finished') && (
        <div className="flex items-center justify-center bg-gray-900/60 rounded-lg px-3 py-1.5 border border-gray-800/60 shrink-0">
          <span className="text-gray-500 text-[9px] text-center">
            {phase === 'calling' ? 'Game in progress · wait for next round' : 'Round finished · new round starting…'}
          </span>
        </div>
      )}

      {/* Fixed stake notice */}
      <div className="flex items-center justify-between bg-gray-900/60 rounded-lg px-3 py-1 border border-gray-800/60 shrink-0">
        <span className="text-gray-500 text-[9px] font-medium">Stake per card</span>
        <span className="font-mono-nums text-[10px] font-bold text-cyan-400">10 ETB</span>
      </div>

      {/* Card selection header */}
      <div className="flex items-center justify-between shrink-0">
        <p className="text-gray-500 text-[9px] uppercase tracking-[0.12em] font-semibold">
          Select Cards (1–{TOTAL_CARDS})
        </p>
        {hasSelection && bettingOpen && (
          <button
            onClick={() => cardNumbers.forEach(i => onToggleCard(i, true))}
            className="text-gray-600 text-[9px] underline hover:text-gray-400 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Selected count */}
      {hasSelection && (
        <div className="flex items-center justify-between bg-gray-900/60 rounded-lg px-3 py-1 border border-gray-800/60 shrink-0">
          <span className="text-gray-500 text-[9px] font-medium flex-1 min-w-0">
            {selectedCardIds.size} card{selectedCardIds.size > 1 ? 's' : ''} selected
          </span>
          <span className={`font-mono-nums text-[9px] font-bold shrink-0 ${canAfford ? 'text-yellow-400' : 'text-red-400'}`}>
            {totalCost} ETB
          </span>
        </div>
      )}

      {/* Card number grid — scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-6 gap-1">
          {cardNumbers.map(i => {
            const sel    = selectedCardIds.has(i)
            const mine   = myCardIds.has(i)
            const taken  = takenCardIds.has(i)
            const locked = !bettingOpen || taken
            return (
              <button
                key={i}
                onClick={() => onToggleCard(i)}
                disabled={locked}
                className={`
                  h-5 rounded font-mono-nums text-[8px] font-semibold transition-all
                  ${mine
                    ? 'bg-cyan-900/50 text-cyan-700 border border-cyan-900/50 cursor-not-allowed'
                    : sel
                      ? 'bg-cyan-600 text-white shadow-[0_0_5px_rgba(6,182,212,0.35)] border border-cyan-400/40'
                      : taken
                        ? 'bg-gray-900/30 text-gray-700 border border-gray-800/20 opacity-30 cursor-not-allowed'
                        : 'bg-gray-900/80 text-gray-500 border border-gray-800/50 hover:border-cyan-800/60'}
                  ${!locked && !mine ? 'cursor-pointer active:scale-95' : ''}
                `}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
      </div>

      {/* Error message */}
      {betMsg && (
        <div className="bg-red-950/60 border border-red-800/50 rounded-lg px-3 py-1.5 shrink-0">
          <p className="text-red-400 text-[9px] font-medium text-center">{betMsg}</p>
        </div>
      )}

      {/* Place Bet button */}
      <button
        onClick={onBet}
        disabled={!canBet}
        className={`
          w-full py-2 rounded-xl font-display text-sm tracking-[0.1em] transition-all shrink-0
          ${canBet
            ? 'bg-gradient-to-r from-cyan-700 to-cyan-500 text-white cursor-pointer active:scale-95 shadow-[0_4px_14px_rgba(6,182,212,0.3)]'
            : 'bg-gray-800/80 text-gray-600 cursor-not-allowed'}
        `}
      >
        {btnLabel}
      </button>
    </div>
  )
}
