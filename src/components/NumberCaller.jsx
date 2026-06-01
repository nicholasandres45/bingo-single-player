import { useEffect, useState } from 'react'
import { getColumnForNumber } from '../utils/bingoUtils'

const COLUMN_COLORS = {
  B: 'text-red-500',
  I: 'text-red-400',
  N: 'text-white',
  G: 'text-red-400',
  O: 'text-red-500',
}

export default function NumberCaller({ calledNumbers, currentNumber, isPlaying }) {
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    if (currentNumber) setAnimKey(k => k + 1)
  }, [currentNumber])

  const col = currentNumber ? getColumnForNumber(currentNumber) : null
  const recent = [...calledNumbers].slice(-10).reverse()

  return (
    <div className="bg-black border border-red-900 rounded-xl p-4 flex flex-col items-center gap-4">
      {/* Current called number */}
      <div className="flex flex-col items-center">
        <span className="text-gray-500 text-xs uppercase tracking-widest mb-1">Called Number</span>
        {currentNumber ? (
          <div key={animKey} className="call-bounce flex flex-col items-center">
            <span className={`text-4xl font-bold ${COLUMN_COLORS[col] || 'text-white'}`}>
              {col}
            </span>
            <span className="text-7xl font-black text-white leading-none">{currentNumber}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center opacity-30">
            <span className="text-4xl font-bold text-red-500">-</span>
            <span className="text-7xl font-black text-white leading-none">--</span>
          </div>
        )}
      </div>

      {/* Call count */}
      <div className="text-gray-500 text-sm">
        {calledNumbers.length > 0 ? (
          <span><span className="text-red-400 font-bold">{calledNumbers.length}</span> / 75 called</span>
        ) : (
          <span>No numbers called yet</span>
        )}
      </div>

      {/* Recent numbers */}
      {recent.length > 0 && (
        <div className="w-full">
          <p className="text-gray-600 text-xs uppercase tracking-widest mb-2 text-center">Recent</p>
          <div className="flex flex-wrap gap-1 justify-center">
            {recent.map((num, i) => {
              const c = getColumnForNumber(num)
              return (
                <span
                  key={num}
                  className={`
                    text-xs font-bold px-2 py-1 rounded border
                    ${i === 0
                      ? 'bg-red-700 border-red-500 text-white'
                      : 'bg-gray-900 border-gray-700 text-gray-400'}
                  `}
                >
                  {c}{num}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Status indicator */}
      <div className={`flex items-center gap-2 text-sm ${isPlaying ? 'text-green-400' : 'text-gray-500'}`}>
        <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400 pulse-red' : 'bg-gray-600'}`} />
        {isPlaying ? 'Game in progress' : 'Waiting to start'}
      </div>
    </div>
  )
}
