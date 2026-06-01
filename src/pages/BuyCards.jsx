const BET_AMOUNTS = [10, 20, 50, 100]
const CARD_COUNTS = [1, 2, 3, 4, 5]

const POTENTIAL_WINS = (bet) => [
  { label: 'One Line', payout: bet * 10 },
  { label: 'Four Corners', payout: bet * 10 },
  { label: 'Diagonal', payout: bet * 15 },
  { label: 'Two Lines', payout: bet * 25 },
  { label: 'Full House', payout: `${bet * 100}–${bet * 500}` },
]

export default function BuyCards({ betAmount, setBetAmount, cardCount, setCardCount, onBuyCards, gameActive }) {
  const totalCost = betAmount * cardCount

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Bet Amount */}
      <div>
        <p className="text-cyan-400 text-xs uppercase tracking-widest font-semibold mb-3">Bet Amount (ETB)</p>
        <div className="grid grid-cols-2 gap-2">
          {BET_AMOUNTS.map(amt => (
            <button
              key={amt}
              onClick={() => setBetAmount(amt)}
              disabled={gameActive}
              className={`
                py-3 rounded-lg font-bold text-lg transition-all
                ${betAmount === amt
                  ? 'bg-cyan-500 text-white border-2 border-cyan-300'
                  : 'bg-gray-900 text-gray-300 border-2 border-gray-700 hover:border-cyan-700'}
                ${gameActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {amt}
            </button>
          ))}
        </div>
      </div>

      {/* Number of Cards */}
      <div>
        <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">Number of Cards</p>
        <div className="flex gap-2">
          {CARD_COUNTS.map(n => (
            <button
              key={n}
              onClick={() => setCardCount(n)}
              disabled={gameActive}
              className={`
                flex-1 py-2 rounded-lg font-bold transition-all
                ${cardCount === n
                  ? 'bg-cyan-500 text-white border-2 border-cyan-300'
                  : 'bg-gray-900 text-gray-300 border-2 border-gray-700 hover:border-cyan-700'}
                ${gameActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Total Cost */}
      <div className="flex justify-between items-center border-t border-gray-800 pt-4">
        <span className="text-gray-400">Total Cost</span>
        <span className="text-yellow-400 font-bold text-xl">{totalCost} ETB</span>
      </div>

      {/* Buy Cards Button */}
      <button
        onClick={onBuyCards}
        disabled={gameActive}
        className={`
          w-full py-4 rounded-xl font-bold text-lg tracking-wide transition-all
          ${gameActive
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-cyan-500 hover:bg-cyan-400 text-white cursor-pointer active:scale-95'}
        `}
      >
        {gameActive ? 'GAME IN PROGRESS' : 'BUY CARDS'}
      </button>

      {/* Potential Wins */}
      <div>
        <p className="text-cyan-400 text-xs uppercase tracking-widest font-bold mb-3">Potential Wins</p>
        <div className="flex flex-col gap-2">
          {POTENTIAL_WINS(betAmount).map(({ label, payout }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">{label}</span>
              <span className="text-green-400 font-bold text-sm">{payout} ETB</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payout Table */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-3 text-center">Payout Table</p>
        <div className="flex flex-col gap-2">
          {[
            { label: 'One Line', mult: '10X' },
            { label: 'Four Corners', mult: '10X' },
            { label: 'Diagonal', mult: '15X' },
            { label: 'Two Lines', mult: '25X' },
            { label: 'Full House', mult: '100–500X', special: true },
          ].map(({ label, mult, special }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">{label}</span>
              <span className={`font-bold text-sm ${special ? 'text-yellow-400' : 'text-cyan-400'}`}>{mult}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
