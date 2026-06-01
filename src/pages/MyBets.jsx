export default function MyBets({ betHistory }) {
  if (!betHistory || betHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-600">
        <div className="text-5xl mb-4">🎱</div>
        <p className="text-sm uppercase tracking-widest">No bets yet</p>
        <p className="text-xs mt-2">Buy cards to start playing</p>
      </div>
    )
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Bet History</p>
      {betHistory.map((bet, i) => (
        <div
          key={i}
          className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-2"
        >
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs uppercase tracking-widest">Round {bet.roundId}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              bet.status === 'won' ? 'bg-green-900 text-green-400' :
              bet.status === 'lost' ? 'bg-red-950 text-red-400' :
              'bg-gray-800 text-gray-400'
            }`}>
              {bet.status?.toUpperCase() || 'PENDING'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Bet</span>
            <span className="text-white font-semibold">{bet.betAmount} ETB × {bet.cardCount} cards</span>
          </div>

          {bet.winType && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Win Type</span>
              <span className="text-red-400 font-bold text-sm">{bet.winType}</span>
            </div>
          )}

          {bet.payout > 0 && (
            <div className="flex justify-between items-center border-t border-gray-800 pt-2">
              <span className="text-gray-400 text-sm">Payout</span>
              <span className="text-green-400 font-bold">+{bet.payout} ETB</span>
            </div>
          )}

          {bet.callCount > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Calls</span>
              <span className="text-gray-300 text-sm">{bet.callCount} numbers</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
