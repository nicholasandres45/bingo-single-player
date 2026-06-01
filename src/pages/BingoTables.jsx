import BingoCard from '../components/BingoCard'

export default function BingoTables({ cards, calledNumbers, winPositions }) {
  if (!cards || cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-gray-600">
        <div className="text-4xl mb-3">🎴</div>
        <p className="text-xs uppercase tracking-widest">No cards yet</p>
        <p className="text-xs mt-1">Buy cards to start playing</p>
      </div>
    )
  }

  return (
    <div className="px-3 py-3 flex flex-col gap-3">
      {cards.map((card, i) => (
        <BingoCard
          key={i}
          card={card}
          calledNumbers={calledNumbers}
          winPositions={winPositions || []}
        />
      ))}
    </div>
  )
}
