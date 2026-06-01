import { getMarkedPositions, COLUMNS_LIST } from '../utils/bingoUtils'

const COLUMN_COLORS = {
  B: 'text-blue-400',
  I: 'text-cyan-400',
  N: 'text-white',
  G: 'text-yellow-400',
  O: 'text-orange-400',
}

export default function BingoCard({ card, calledNumbers, winPositions = [] }) {
  const marked = getMarkedPositions(card, calledNumbers)
  const winSet = new Set(winPositions)

  return (
    <div className="bg-gray-900 border border-gray-700/60 rounded-lg overflow-hidden select-none">
      <div className="grid grid-cols-5 border-b border-gray-700/60">
        {COLUMNS_LIST.map(col => (
          <div key={col} className={`text-center py-1 font-display text-sm ${COLUMN_COLORS[col]} bg-gray-950`}>
            {col}
          </div>
        ))}
      </div>

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
                  relative flex items-center justify-center h-8
                  border border-gray-800/60 transition-all duration-200
                  ${isWin ? 'bg-cyan-500' : ''}
                  ${isMarked && !isWin && !isFree ? 'bg-cyan-950' : ''}
                  ${!isMarked && !isFree ? 'bg-gray-900' : ''}
                  ${isFree && !isWin ? 'bg-cyan-800/70' : ''}
                `}
              >
                {isMarked && !isFree && (
                  <div className={`
                    absolute inset-[3px] rounded-full flex items-center justify-center pop-in
                    ${isWin ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]' : 'bg-cyan-700'}
                  `}>
                    <span className="font-mono-nums text-[9px] font-bold text-white">{val}</span>
                  </div>
                )}
                {!isMarked && !isFree && (
                  <span className="font-mono-nums text-[10px] font-medium text-gray-400">{val}</span>
                )}
                {isFree && (
                  <span className="font-display text-[10px] text-white tracking-wide">FREE</span>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
