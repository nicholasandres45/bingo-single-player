export default function MyBets({ betHistory }) {
  if (!betHistory || betHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-700">
        <div className="text-4xl mb-2">🎴</div>
        <p className="text-[10px] uppercase tracking-widest font-semibold">No bets yet</p>
        <p className="text-[10px] mt-1 text-gray-800">Buy cards to start playing</p>
      </div>
    )
  }

  return (
    <div className="px-3 py-3 flex flex-col gap-2">
      {betHistory.map((bet, i) => (
        <div key={i} className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-3 flex flex-col gap-1.5">

          {/* Round ID + status */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-600 text-[9px] font-mono-nums uppercase truncate flex-1 min-w-0">
              {bet.roundId}
            </span>
            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
              bet.status === 'won'  ? 'bg-green-950 text-green-400' :
              bet.status === 'lost' ? 'bg-gray-900  text-gray-600'  :
              'bg-gray-800 text-gray-500'
            }`}>
              {bet.status?.toUpperCase()}
            </span>
          </div>

          <div className="h-px bg-gray-800/60" />

          {/* Bet amount */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500 text-[10px] font-medium flex-1 min-w-0">Bet</span>
            <span className="font-mono-nums text-[10px] text-gray-300 font-semibold shrink-0">
              {bet.betAmount} ETB × {bet.cardCount} card{bet.cardCount > 1 ? 's' : ''}
            </span>
          </div>

          {/* Possible win */}
          {bet.possibleWin > 0 && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 text-[10px] font-medium flex-1 min-w-0">Possible Win</span>
              <span className="font-mono-nums text-[10px] text-yellow-400 font-semibold shrink-0">
                {bet.possibleWin.toLocaleString()} ETB
              </span>
            </div>
          )}

          {/* Win type */}
          {bet.winType && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 text-[10px] font-medium flex-1 min-w-0">Win</span>
              <span className="font-display text-[10px] text-cyan-400 shrink-0">{bet.winType}</span>
            </div>
          )}

          {/* Payout + stake return */}
          {bet.status === 'won' && (
            <div className="pt-1 border-t border-gray-800/60 flex flex-col gap-1">
              {bet.winCount > 1 && bet.payoutPerCard > 0 && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500 text-[10px] font-medium flex-1 min-w-0">Per Card</span>
                  <span className="font-mono-nums text-[10px] font-semibold text-cyan-400 shrink-0">
                    {bet.payoutPerCard.toLocaleString()} × {bet.winCount}
                  </span>
                </div>
              )}
              {bet.payout > 0 && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500 text-[10px] font-medium flex-1 min-w-0">Win Payout</span>
                  <span className="font-mono-nums text-[10px] font-semibold text-green-400 shrink-0">+{bet.payout.toLocaleString()} ETB</span>
                </div>
              )}
              {bet.stakeReturn > 0 && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500 text-[10px] font-medium flex-1 min-w-0">Stake Return</span>
                  <span className="font-mono-nums text-[10px] font-semibold text-cyan-400 shrink-0">+{bet.stakeReturn.toLocaleString()} ETB</span>
                </div>
              )}
              {bet.totalReturn > 0 && (
                <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-gray-800/40">
                  <span className="text-gray-400 text-[10px] font-semibold flex-1 min-w-0">Total Return</span>
                  <span className="font-mono-nums text-[11px] font-bold text-green-400 shrink-0">+{bet.totalReturn.toLocaleString()} ETB</span>
                </div>
              )}
            </div>
          )}

          {/* Calls */}
          {bet.callCount > 0 && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-gray-500 text-[10px] font-medium flex-1 min-w-0">Calls</span>
              <span className="font-mono-nums text-[9px] text-gray-600 shrink-0">{bet.callCount} / 25</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
