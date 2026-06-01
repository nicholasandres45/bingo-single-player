import BingoCard from '../components/BingoCard'

export default function BingoTables({ allCards, selectedCardIds, calledNumbers, winPositions }) {
  const selected = [...selectedCardIds].sort((a, b) => a - b)

  if (selected.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-700">
        <div className="text-4xl mb-2">🎴</div>
        <p className="text-[10px] uppercase tracking-widest font-semibold">No cards selected</p>
        <p className="text-[10px] mt-1 text-gray-800">Bet on cards to see them here</p>
      </div>
    )
  }

  // 1 card → single column full width; 2+ → two columns
  const twoCol = selected.length > 1

  return (
    <div className={`px-2 py-2 ${twoCol ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-2'}`}>
      {selected.map(id => (
        <div key={id}>
          <p className="text-gray-600 text-[8px] font-semibold uppercase tracking-widest mb-0.5">
            #{id + 1}
          </p>
          <BingoCard
            card={allCards[id]}
            calledNumbers={calledNumbers}
            winPositions={winPositions || []}
            compact
          />
        </div>
      ))}
    </div>
  )
}
