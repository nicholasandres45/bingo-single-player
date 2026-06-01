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
    <div className="flex flex-col gap-3 px-3 py-3">

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
              disabled={gameActive}
              className={`
                py-1.5 rounded-lg font-mono-nums text-base font-semibold transition-all
                ${betAmount === amt
                  ? 'bg-cyan-600/90 text-white shadow-[0_0_14px_rgba(6,182,212,0.35)] border border-cyan-500/50'
                  : 'bg-gray-900 text-gray-400 border border-gray-700/60 hover:border-cyan-700/60'}
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
        <p className="text-gray-500 text-[9px] uppercase tracking-[0.15em] font-semibold mb-2">
          Number of Cards
        </p>
        <div className="flex gap-1.5">
          {CARD_COUNTS.map(n => (
            <button
              key={n}
              onClick={() => setCardCount(n)}
              disabled={gameActive}
              className={`
                flex-1 py-1.5 rounded-lg font-mono-nums text-sm font-semibold transition-all
                ${cardCount === n
                  ? 'bg-cyan-600/90 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)] border border-cyan-500/50'
                  : 'bg-gray-900 text-gray-400 border border-gray-700/60 hover:border-cyan-700/60'}
                ${gameActive ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
              `}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Total Cost */}
      <div className="flex items-center justify-between gap-2 bg-gray-900/60 rounded-xl px-3 py-2 border border-gray-800/60">
        <span className="text-gray-500 text-[10px] font-semibold tracking-wide flex-1 min-w-0">Total Cost</span>
        <span className="font-mono-nums text-sm font-bold text-yellow-400 shrink-0">{totalCost} ETB</span>
      </div>

      {/* Buy Button */}
      <button
        onClick={onBuyCards}
        disabled={gameActive}
        className={`
          w-full py-2.5 rounded-xl font-display text-base tracking-[0.12em] transition-all
          ${gameActive
            ? 'bg-gray-800/80 text-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-cyan-700 to-cyan-500 text-white cursor-pointer active:scale-95 shadow-[0_4px_18px_rgba(6,182,212,0.3)]'}
        `}
      >
        {gameActive ? 'In Progress' : 'Buy Cards'}
      </button>

      {/* Potential Wins */}
      <div>
        <p className="text-cyan-400 text-[9px] uppercase tracking-[0.15em] font-semibold mb-2">
          Potential Wins
        </p>
        <div className="bg-gray-900/60 rounded-xl border border-gray-800/60 overflow-hidden">
          {WINS(betAmount).map(({ label, val, special }, i) => (
            <div
              key={label}
              className={`flex items-center justify-between gap-2 px-3 py-2 ${i < 4 ? 'border-b border-gray-800/50' : ''}`}
            >
              <span className="text-gray-400 text-[10px] font-medium flex-1 min-w-0 truncate">{label}</span>
              <span className={`font-mono-nums text-[9px] font-semibold shrink-0 ${special ? 'text-yellow-400' : 'text-green-400'}`}>
                {val}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
