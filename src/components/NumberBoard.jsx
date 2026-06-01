import { COLUMNS_LIST } from '../utils/bingoUtils'

const COLUMN_COLORS = {
  B: 'text-blue-500',
  I: 'text-cyan-400',
  N: 'text-white',
  G: 'text-yellow-400',
  O: 'text-orange-400',
}

const COLUMNS_DATA = {
  B: Array.from({ length: 15 }, (_, i) => i + 1),
  I: Array.from({ length: 15 }, (_, i) => i + 16),
  N: Array.from({ length: 15 }, (_, i) => i + 31),
  G: Array.from({ length: 15 }, (_, i) => i + 46),
  O: Array.from({ length: 15 }, (_, i) => i + 61),
}

export default function NumberBoard({ calledNumbers }) {
  const calledSet = new Set(calledNumbers)

  return (
    <div className="p-2">
      <div className="grid grid-cols-5 gap-0.5">
        {COLUMNS_LIST.map(col => (
          <div key={col} className={`text-center font-bold text-xs py-1 ${COLUMN_COLORS[col]}`}>
            {col}
          </div>
        ))}
        {Array.from({ length: 15 }, (_, row) =>
          COLUMNS_LIST.map(col => {
            const num = COLUMNS_DATA[col][row]
            const isCalled = calledSet.has(num)
            return (
              <div
                key={`${col}-${num}`}
                className={`
                  flex items-center justify-center h-6 rounded text-xs font-semibold transition-all duration-300
                  ${isCalled ? 'bg-cyan-600 text-white pop-in' : 'bg-gray-900 text-gray-500'}
                `}
              >
                {num}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
