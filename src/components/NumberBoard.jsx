import { COLUMNS_LIST } from '../utils/bingoUtils'

const COLUMN_COLORS = {
  B: 'text-blue-400',
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
    <div className="py-1">
      <div className="grid grid-cols-5 gap-[2px]">
        {COLUMNS_LIST.map(col => (
          <div key={col} className={`text-center font-bold text-[10px] pb-0.5 font-display tracking-widest ${COLUMN_COLORS[col]}`}>
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
                  flex items-center justify-center h-[18px] rounded-[3px]
                  font-mono-nums text-[9px] font-medium transition-all duration-300
                  ${isCalled
                    ? 'bg-cyan-600 text-white shadow-[0_0_6px_rgba(6,182,212,0.6)]'
                    : 'bg-gray-900 text-gray-600'}
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
