import { useMemo } from 'react'
import { TOTAL_CARDS } from '../utils/bingoUtils'

const BET_AMOUNTS = [10, 20, 50, 100]

export default function BuyCards({
  betAmount, setBetAmount,
  selectedCardIds, onToggleCard,
  possibleWin, totalCost,
  onBet, phase, countdown, balance, playerCount,
}) {
  const cardNumbers = useMemo(() => Array.from({ length: TOTAL_CARDS }, (_, i) => i), [])

  const bettingOpen = phase === 'betting' || phase === 'countdown'
  const hasSelection = selectedCardIds.size > 0
  const canAfford = balance !== null && balance >= totalCost && totalCost > 0
  const canBet = bettingOpen && hasSelection && canAfford

  const btnLabel = !bettingOpen      ? 'Betting Closed'
    : !hasSelection                  ? 'Select a Card'
    : !canAfford                     ? 'Insufficient Balance'
    : `Place Bet · ${totalCost} ETB`

  return (
    <div className="flex flex-col gap-3 px-3 py-3 h-full">

      {/* Balance */}
      <div className="flex items-center justify-between bg-gray-900/60 rounded-lg px-3 py-1.5 border border-gray-800/60">
        <span className="text-gray-500 text-[9px] font-medium">Balance</span>
        <span className="font-mono-nums text-[10px] font-bold text-yellow-400">
          {balance !== null ? `${balance.toLocaleString()} ETB` : '...'}
        </span>
      </div>

      {/* Phase status strip */}
      {phase === 'countdown' && countdown !== null && (
        <div className="flex items-center justify-between bg-yellow-950/40 rounded-lg px-3 py-1.5 border border-yellow-800/40">
          <span className="text-yellow-600 text-[9px] font-medium flex-1 min-w-0">
            Betting closes in · {playerCount} player{playerCount !== 1 ? 's' : ''}
          </span>
          <span className="font-mono-nums text-[10px] font-bold text-yellow-400 shrink-0">{countdown}s</span>
        </div>
      )}
      {phase === 'betting' && playerCount > 0 && (
        <div className="flex items-center justify-between bg-cyan-950/30 rounded-lg px-3 py-1.5 border border-cyan-900/40">
          <span className="text-cyan-700 text-[9px] font-medium flex-1 min-w-0">
            {playerCount} player{playerCount !== 1 ? 's' : ''} joined · bet to start countdown
          </span>
        </div>
      )}
      {phase === 'calling' && (
        <div className="flex items-center justify-center bg-gray-900/60 rounded-lg px-3 py-2 border border-gray-800/60">
          <span className="text-gray-500 text-[9px] text-center">Game in progress · wait for next round</span>
        </div>
      )}
      {phase === 'finished' && (
        <div className="flex items-center justify-center bg-gray-900/60 rounded-lg px-3 py-2 border border-gray-800/60">
          <span className="text-gray-500 text-[9px] text-center">Round finished · new round starting…</span>
        </div>
      )}

      {/* Bet Amount */}
      <div>
        <p className="text-cyan-400 text-[9px] uppercase tracking-[0.15em] font-semibold mb-2">
          Bet Amount (ETB)
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {BET_AMOUNTS.map(amt => (
            <button
              key={amt}
              onClick={() => setBetAmount(amt)}
              disabled={!bettingOpen}
              className={`
                py-1.5 rounded-lg font-mono-nums text-base font-semibold transition-all
                ${betAmount === amt
                  ? 'bg-cyan-600/90 text-white shadow-[0_0_12px_rgba(6,182,212,0.35)] border border-cyan-500/50'
                  : 'bg-gray-900 text-gray-400 border border-gray-700/50 hover:border-cyan-700/60'}
                ${!bettingOpen ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
              `}
            >
              {amt}
            </button>
          ))}
        </div>
      </div>

      {/* Card selection header */}
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-[9px] uppercase tracking-[0.15em] font-semibold">
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
        <div className="flex items-center justify-between bg-gray-900/60 rounded-lg px-3 py-1.5 border border-gray-800/60">
          <span className="text-gray-500 text-[9px] font-medium flex-1 min-w-0">
            {selectedCardIds.size} card{selectedCardIds.size > 1 ? 's' : ''} selected
          </span>
          <span className={`font-mono-nums text-[10px] font-bold shrink-0 ${canAfford ? 'text-yellow-400' : 'text-red-400'}`}>
            {totalCost} ETB
          </span>
        </div>
      )}

      {/* Card number grid */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-6 gap-1">
          {cardNumbers.map(i => {
            const sel = selectedCardIds.has(i)
            return (
              <button
                key={i}
                onClick={() => onToggleCard(i)}
                disabled={!bettingOpen}
                className={`
                  h-7 rounded-md font-mono-nums text-[9px] font-semibold transition-all
                  ${sel
                    ? 'bg-cyan-600 text-white shadow-[0_0_6px_rgba(6,182,212,0.4)] border border-cyan-400/40'
                    : 'bg-gray-900/80 text-gray-500 border border-gray-800/50 hover:border-cyan-800/60'}
                  ${!bettingOpen ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
                `}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
      </div>

      {/* Place Bet button */}
      <button
        onClick={onBet}
        disabled={!canBet}
        className={`
          w-full py-2.5 rounded-xl font-display text-base tracking-[0.1em] transition-all shrink-0
          ${canBet
            ? 'bg-gradient-to-r from-cyan-700 to-cyan-500 text-white cursor-pointer active:scale-95 shadow-[0_4px_16px_rgba(6,182,212,0.3)]'
            : 'bg-gray-800/80 text-gray-600 cursor-not-allowed'}
        `}
      >
        {btnLabel}
      </button>
    </div>
  )
}
