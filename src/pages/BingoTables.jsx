import { COLUMNS_LIST, MAX_CALLS } from '../utils/bingoUtils'

const COLUMN_COLORS = {
  B: 'text-blue-500',
  I: 'text-cyan-400',
  N: 'text-white',
  G: 'text-yellow-400',
  O: 'text-orange-400',
}

export default function BingoTables({ calledNumbers }) {
  const calledSet = new Set(calledNumbers)

  const columns = {
    B: Array.from({ length: 15 }, (_, i) => i + 1),
    I: Array.from({ length: 15 }, (_, i) => i + 16),
    N: Array.from({ length: 15 }, (_, i) => i + 31),
    G: Array.from({ length: 15 }, (_, i) => i + 46),
    O: Array.from({ length: 15 }, (_, i) => i + 61),
  }

  return (
    <div className="p-4">
      <p className="text-gray-500 text-xs uppercase tracking-widest mb-4 text-center">Number Board</p>
      <div className="grid grid-cols-5 gap-1">
        {COLUMNS_LIST.map(col => (
          <div key={col} className={`text-center font-bold text-lg py-2 ${COLUMN_COLORS[col]}`}>
            {col}
          </div>
        ))}
        {Array.from({ length: 15 }, (_, row) =>
          COLUMNS_LIST.map(col => {
            const num = columns[col][row]
            const isCalled = calledSet.has(num)
            return (
              <div
                key={`${col}-${num}`}
                className={`
                  flex items-center justify-center h-9 rounded text-sm font-semibold transition-all duration-300
                  ${isCalled
                    ? 'bg-cyan-600 text-white pop-in'
                    : 'bg-gray-900 text-gray-500 border border-gray-800'}
                `}
              >
                {num}
              </div>
            )
          })
        )}
      </div>

      <div className="mt-4 flex justify-between text-sm text-gray-500">
        <span>Called: <span className="text-cyan-400 font-bold">{calledNumbers.length}</span></span>
        <span>Remaining: <span className="text-gray-300 font-bold">{MAX_CALLS - calledNumbers.length}</span></span>
      </div>
    </div>
  )
}
