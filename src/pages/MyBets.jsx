export default function MyBets({ betHistory }) {
  if (!betHistory || betHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-gray-700">
        <div className="text-4xl mb-2">🎴</div>
        <p className="text-[10px] uppercase tracking-widest font-medium">No bets yet</p>
        <p className="text-[10px] mt-1 text-gray-800">Buy cards to start playing</p>
      </div>
    )
  }

  return (
    <div className="px-3 py-3 flex flex-col gap-2">
      {betHistory.map((bet, i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-2.5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-gray-600 text-[9px] font-mono-nums uppercase tracking-wide truncate max-w-[100px]">
              {bet.roundId}
            </span>
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
              bet.status === 'won'  ? 'bg-green-950 text-green-400' :
              bet.status === 'lost' ? 'bg-gray-950  text-gray-600'  :
              'bg-gray-800 text-gray-500'
            }`}>
              {bet.status?.toUpperCase()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-[10px]">Bet</span>
            <span className="font-mono-nums text-[10px] text-gray-300 font-medium">
              {bet.betAmount} ETB × {bet.cardCount}
            </span>
          </div>

          {bet.winType && (
            <div className="flex justify-between items-center mt-1">
              <span className="text-gray-500 text-[10px]">Win Type</span>
              <span className="font-display text-xs text-cyan-400 tracking-wide">{bet.winType}</span>
            </div>
          )}

          {bet.payout > 0 && (
            <div className="flex justify-between items-center mt-1 pt-1 border-t border-gray-800">
              <span className="text-gray-500 text-[10px]">Payout</span>
              <span className="font-display text-sm text-green-400 tracking-wide">+{bet.payout} ETB</span>
            </div>
          )}

          {bet.callCount > 0 && (
            <div className="flex justify-between items-center mt-0.5">
              <span className="text-gray-500 text-[10px]">Calls</span>
              <span className="font-mono-nums text-[10px] text-gray-500">{bet.callCount} / 25</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
