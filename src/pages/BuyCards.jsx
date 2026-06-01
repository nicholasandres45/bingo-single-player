const BET_AMOUNTS = [10, 20, 50, 100]
const CARD_COUNTS = [1, 2, 3, 4, 5]

const WINS = (bet) => [
  { label: 'One Line',     val: `${bet * 10} ETB` },
  { label: 'Four Corners', val: `${bet * 10} ETB` },
  { label: 'Diagonal',     val: `${bet * 15} ETB` },
  { label: 'Two Lines',    val: `${bet * 25} ETB` },
  { label: 'Full House',   val: `${bet * 100}–${bet * 500} ETB`, special: true },
]

export default function BuyCards({ betAmount, setBetAmount, cardCount, setCardCount, onBuyCards, gameActive }) {
  const totalCost = betAmount * cardCount

  return (
    <div className="flex flex-col gap-3 p-2.5">

      {/* Bet Amount */}
      <div>
        <p className="text-cyan-400 text-[10px] uppercase tracking-widest font-semibold mb-1.5">
          Bet Amount (ETB)
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {BET_AMOUNTS.map(amt => (
            <button
              key={amt}
              onClick={() => setBetAmount(amt)}
              disabled={gameActive}
              className={`
                py-2 rounded-lg font-display text-xl tracking-wider transition-all
                ${betAmount === amt
                  ? 'bg-cyan-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-gray-900 text-gray-400 border border-gray-700 hover:border-cyan-800'}
                ${gameActive ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
              `}
            >
              {amt}
            </button>
          ))}
        </div>
      </div>

      {/* Number of Cards */}
      <div>
        <p className="text-gray-500 text-[10px] uppercase tracking-widest font-medium mb-1.5">
          Number of Cards
        </p>
        <div className="flex gap-1.5">
          {CARD_COUNTS.map(n => (
            <button
              key={n}
              onClick={() => setCardCount(n)}
              disabled={gameActive}
              className={`
                flex-1 py-1.5 rounded-lg font-display text-lg tracking-wider transition-all
                ${cardCount === n
                  ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.35)]'
                  : 'bg-gray-900 text-gray-400 border border-gray-700 hover:border-cyan-800'}
                ${gameActive ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
              `}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Total Cost */}
      <div className="flex justify-between items-center bg-gray-900 rounded-lg px-3 py-2 border border-gray-800">
        <span className="text-gray-500 text-xs font-medium">Total Cost</span>
        <span className="font-display text-lg text-yellow-400 tracking-wider">{totalCost} ETB</span>
      </div>

      {/* Buy Button */}
      <button
        onClick={onBuyCards}
        disabled={gameActive}
        className={`
          w-full py-3 rounded-xl font-display text-2xl tracking-[0.12em] transition-all
          ${gameActive
            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white cursor-pointer active:scale-95 shadow-[0_4px_20px_rgba(6,182,212,0.35)]'}
        `}
      >
        {gameActive ? 'IN PROGRESS' : 'BUY CARDS'}
      </button>

      {/* Potential Wins */}
      <div>
        <p className="text-cyan-400 text-[10px] uppercase tracking-widest font-semibold mb-1.5">
          Potential Wins
        </p>
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          {WINS(betAmount).map(({ label, val, special }, i) => (
            <div
              key={label}
              className={`flex justify-between items-center px-2.5 py-1.5 ${i < 4 ? 'border-b border-gray-800' : ''}`}
            >
              <span className="text-gray-400 text-[11px] font-medium">{label}</span>
              <span className={`font-display text-sm tracking-wide ${special ? 'text-yellow-400' : 'text-green-400'}`}>
                {val}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
