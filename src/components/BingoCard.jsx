import { getMarkedPositions, COLUMNS_LIST } from '../utils/bingoUtils'

const COLUMN_COLORS = {
  B: 'text-red-500',
  I: 'text-red-400',
  N: 'text-white',
  G: 'text-red-400',
  O: 'text-red-500',
}

export default function BingoCard({ card, calledNumbers, winPositions = [] }) {
  const marked = getMarkedPositions(card, calledNumbers)
  const winSet = new Set(winPositions)

  return (
    <div className="bg-gray-900 border border-red-900 rounded-xl overflow-hidden select-none">
      {/* Column headers */}
      <div className="grid grid-cols-5 border-b border-red-900">
        {COLUMNS_LIST.map(col => (
          <div
            key={col}
            className={`text-center py-2 font-bold text-lg ${COLUMN_COLORS[col]} bg-black`}
          >
            {col}
          </div>
        ))}
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-5">
        {Array.from({ length: 5 }, (_, row) =>
          COLUMNS_LIST.map((col, colIndex) => {
            const val = card[col][row]
            const pos = `${row},${colIndex}`
            const isMarked = marked.has(pos)
            const isFree = val === 'FREE'
            const isWin = winSet.has(pos)

            return (
              <div
                key={pos}
                className={`
                  relative flex items-center justify-center
                  h-12 text-sm font-semibold border border-gray-800
                  transition-all duration-200
                  ${isWin ? 'bg-red-600 text-white' : ''}
                  ${isMarked && !isWin && !isFree ? 'bg-red-950' : ''}
                  ${!isMarked && !isFree ? 'bg-gray-900 text-gray-300' : ''}
                  ${isFree && !isWin ? 'bg-red-800 text-white' : ''}
                `}
              >
                {isMarked && !isFree && (
                  <div className={`
                    absolute inset-1 rounded-full flex items-center justify-center
                    ${isWin ? 'bg-red-500' : 'bg-red-700'}
                    pop-in
                  `}>
                    <span className="text-white text-xs font-bold">{val}</span>
                  </div>
                )}
                {!isMarked && !isFree && (
                  <span>{val}</span>
                )}
                {isFree && (
                  <span className="text-xs font-bold text-white">FREE</span>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
