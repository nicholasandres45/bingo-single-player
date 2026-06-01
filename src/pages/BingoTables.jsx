import BingoCard from '../components/BingoCard'

export default function BingoTables({ allCards, selectedCardIds, calledNumbers, winPositions }) {
  const selected = [...selectedCardIds].sort((a, b) => a - b)

  if (selected.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-700">
        <div className="text-4xl mb-2">🎴</div>
        <p className="text-[10px] uppercase tracking-widest font-semibold">No cards selected</p>
        <p className="text-[10px] mt-1 text-gray-800">Pick cards from Buy Cards tab</p>
      </div>
    )
  }

  return (
    <div className="px-3 py-3 flex flex-col gap-3">
      {selected.map(id => (
        <div key={id}>
          <p className="text-gray-600 text-[9px] font-semibold uppercase tracking-widest mb-1">
            Card #{id + 1}
          </p>
          <BingoCard
            card={allCards[id]}
            calledNumbers={calledNumbers}
            winPositions={winPositions || []}
          />
        </div>
      ))}
    </div>
  )
}
