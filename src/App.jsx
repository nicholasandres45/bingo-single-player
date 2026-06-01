import { useState, useEffect, useRef, useCallback } from 'react'
import NumberBoard from './components/NumberBoard'
import WinModal from './components/WinModal'
import BuyCards from './pages/BuyCards'
import BingoTables from './pages/BingoTables'
import MyBets from './pages/MyBets'
import {
  generateMultipleCards,
  generateCallSequence,
  getMarkedPositions,
  checkWinPatterns,
  calculatePayout,
  getColumnForNumber,
  MAX_CALLS,
} from './utils/bingoUtils'
import { supabase } from './lib/supabase'

const tg = window.Telegram?.WebApp

const TABS = ['BUY CARDS', 'BINGO TABLES', 'MY BETS']
const CALL_INTERVAL_MS = 2000

const COLUMN_COLORS = {
  B: 'text-blue-500',
  I: 'text-cyan-400',
  N: 'text-white',
  G: 'text-yellow-400',
  O: 'text-orange-400',
}

export default function App() {
  const [activeTab, setActiveTab] = useState(0)
  const [betAmount, setBetAmount] = useState(10)
  const [cardCount, setCardCount] = useState(3)
  const [cards, setCards] = useState([])
  const [calledNumbers, setCalledNumbers] = useState([])
  const [currentNumber, setCurrentNumber] = useState(null)
  const [gameActive, setGameActive] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [winInfo, setWinInfo] = useState(null)
  const [betHistory, setBetHistory] = useState([])
  const [roundId, setRoundId] = useState(null)
  const [winPositions, setWinPositions] = useState([])
  const [animKey, setAnimKey] = useState(0)
  const [sessionId] = useState(() => `BSP-${Date.now().toString(36).toUpperCase()}`)

  const intervalRef = useRef(null)
  const wonRef = useRef(false)

  useEffect(() => {
    if (tg) {
      tg.ready()
      tg.expand()
      tg.setHeaderColor('#000000')
      tg.setBackgroundColor('#000000')
    }
  }, [])

  useEffect(() => {
    if (currentNumber) setAnimKey(k => k + 1)
  }, [currentNumber])

  const checkForWin = useCallback((called, currentCards, currentBet) => {
    for (const card of currentCards) {
      const marked = getMarkedPositions(card, called)
      const wins = checkWinPatterns(marked)
      if (wins.length > 0) {
        const order = ['One Line', 'Four Corners', 'Diagonal', 'Two Lines', 'Full House']
        const best = wins.reduce((a, b) =>
          order.indexOf(b.type) > order.indexOf(a.type) ? b : a
        )
        const payout = calculatePayout(currentBet, best.type, called.length)
        return { winType: best.type, payout, positions: best.positions }
      }
    }
    return null
  }, [])

  const handleBuyCards = useCallback(async () => {
    const newCards = generateMultipleCards(cardCount)
    const sequence = generateCallSequence()
    const id = `BSP-${Date.now().toString(36).toUpperCase()}`

    wonRef.current = false

    setCards(newCards)
    setCalledNumbers([])
    setCurrentNumber(null)
    setGameActive(true)
    setGameOver(false)
    setWinInfo(null)
    setWinPositions([])
    setRoundId(id)
    setActiveTab(1)

    try {
      await supabase.from('game_sessions').insert({
        round_id: id,
        bet_amount: betAmount,
        card_count: cardCount,
        status: 'active',
      })
    } catch (_) {}

    let index = 0
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      index++
      if (index > sequence.length) {
        clearInterval(intervalRef.current)
        setGameActive(false)
        setGameOver(true)
        return
      }

      const called = sequence.slice(0, index)
      const num = sequence[index - 1]
      setCurrentNumber(num)
      setCalledNumbers([...called])

      if (!wonRef.current) {
        const win = checkForWin(called, newCards, betAmount)
        if (win) {
          wonRef.current = true
          clearInterval(intervalRef.current)
          setWinInfo({ ...win, callCount: index })
          setWinPositions(win.positions || [])
          setGameActive(false)
          setGameOver(true)

          supabase.from('game_sessions').update({
            status: 'won',
            win_type: win.winType,
            payout: win.payout,
            call_count: index,
          }).eq('round_id', id).then(() => {})

          setBetHistory(h => [{
            roundId: id, betAmount, cardCount,
            status: 'won', winType: win.winType,
            payout: win.payout, callCount: index,
          }, ...h])
          return
        }
      }

      if (index === sequence.length && !wonRef.current) {
        clearInterval(intervalRef.current)
        setGameActive(false)
        setGameOver(true)
        setBetHistory(h => [{
          roundId: id, betAmount, cardCount,
          status: 'lost', winType: null,
          payout: 0, callCount: index,
        }, ...h])
        supabase.from('game_sessions')
          .update({ status: 'lost', call_count: index })
          .eq('round_id', id).then(() => {})
      }
    }, CALL_INTERVAL_MS)
  }, [cardCount, betAmount, checkForWin])

  const handlePlayAgain = () => {
    setWinInfo(null)
    setCards([])
    setCalledNumbers([])
    setCurrentNumber(null)
    setGameOver(false)
    setActiveTab(0)
  }

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const col = currentNumber ? getColumnForNumber(currentNumber) : null

  return (
    <div className="h-screen bg-black text-white flex flex-col w-full overflow-hidden">

      {/* Header */}
      <div className="bg-gray-950 border-b border-gray-800 px-3 py-2 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-cyan-400 font-black text-xl tracking-widest">BINGO</h1>
          <p className="text-gray-600 text-xs">{roundId || sessionId}</p>
        </div>
        <div className={`
          px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide border
          ${gameActive
            ? 'bg-green-950 text-green-400 border-green-700'
            : gameOver
            ? 'bg-gray-900 text-gray-500 border-gray-700'
            : 'bg-green-950 text-green-400 border-green-700'}
        `}>
          {gameActive ? 'IN PROGRESS' : gameOver ? 'GAME OVER' : 'BETTING OPEN'}
        </div>
      </div>

      {/* Two-column body */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Number caller + board */}
        <div className="w-[45%] border-r border-gray-800 flex flex-col overflow-y-auto">

          {/* Compact number caller */}
          <div className="p-3 border-b border-gray-800 flex flex-col items-center gap-1">
            <span className="text-gray-500 text-xs uppercase tracking-widest">Called</span>
            {currentNumber ? (
              <div key={animKey} className="call-bounce flex items-end gap-1">
                <span className={`text-2xl font-bold leading-none ${COLUMN_COLORS[col] || 'text-white'}`}>
                  {col}
                </span>
                <span className="text-5xl font-black text-cyan-400 leading-none">
                  {currentNumber}
                </span>
              </div>
            ) : (
              <div className="flex items-end gap-1 opacity-30">
                <span className="text-2xl font-bold text-cyan-400 leading-none">-</span>
                <span className="text-5xl font-black text-white leading-none">--</span>
              </div>
            )}
            <span className="text-gray-600 text-xs mt-1">
              <span className="text-cyan-400 font-bold">{calledNumbers.length}</span>
              {' / '}{MAX_CALLS}
            </span>
          </div>

          {/* Number board */}
          <NumberBoard calledNumbers={calledNumbers} />

          {/* Payout table */}
          <div className="mx-2 mb-2 bg-gray-900 rounded-lg p-2 border border-gray-800">
            <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-2 text-center">
              Payout Table
            </p>
            <div className="flex flex-col gap-1">
              {[
                { label: 'One Line', mult: '10X' },
                { label: 'Four Corners', mult: '10X' },
                { label: 'Diagonal', mult: '15X' },
                { label: 'Two Lines', mult: '25X' },
                { label: 'Full House', mult: '100–500X', special: true },
              ].map(({ label, mult, special }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs">{label}</span>
                  <span className={`font-bold text-xs ${special ? 'text-yellow-400' : 'text-cyan-400'}`}>
                    {mult}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent rounds */}
          {betHistory.length > 0 && (
            <div className="mx-2 mb-2">
              <p className="text-gray-600 text-xs uppercase tracking-widest mb-1">Recent</p>
              {betHistory.slice(0, 3).map((b, i) => (
                <div key={i} className="flex justify-between items-center py-1 border-b border-gray-900">
                  <span className="text-gray-600 text-xs truncate">{b.roundId}</span>
                  <span className={`text-xs font-bold ${b.status === 'won' ? 'text-green-400' : 'text-gray-600'}`}>
                    {b.status === 'won' ? `+${b.payout}` : 'Lost'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Tabs + content */}
        <div className="w-[55%] flex flex-col overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-gray-800 shrink-0">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`
                  flex-1 py-2 text-xs font-bold uppercase tracking-wide transition-all
                  ${activeTab === i
                    ? 'text-cyan-400 border-b-2 border-cyan-500'
                    : 'text-gray-600 hover:text-gray-400'}
                `}
              >
                {tab.replace(' ', '\n')}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 0 && (
              <BuyCards
                betAmount={betAmount}
                setBetAmount={setBetAmount}
                cardCount={cardCount}
                setCardCount={setCardCount}
                onBuyCards={handleBuyCards}
                gameActive={gameActive}
              />
            )}
            {activeTab === 1 && (
              <BingoTables
                cards={cards}
                calledNumbers={calledNumbers}
                winPositions={winInfo ? winPositions : []}
              />
            )}
            {activeTab === 2 && (
              <MyBets betHistory={betHistory} />
            )}
          </div>
        </div>
      </div>

      {/* Win Modal */}
      {winInfo && (
        <WinModal
          winType={winInfo.winType}
          payout={winInfo.payout}
          callCount={winInfo.callCount}
          onClose={() => setWinInfo(null)}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  )
}
