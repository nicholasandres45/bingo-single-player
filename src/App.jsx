import { useState, useEffect, useRef, useCallback } from 'react'

const tg = window.Telegram?.WebApp
import BingoCard from './components/BingoCard'
import NumberCaller from './components/NumberCaller'
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
} from './utils/bingoUtils'
import { supabase } from './lib/supabase'

const TABS = ['BUY CARDS', 'BINGO TABLES', 'MY BETS']
const CALL_INTERVAL_MS = 2000

export default function App() {
  const [activeTab, setActiveTab] = useState(0)
  const [betAmount, setBetAmount] = useState(10)
  const [cardCount, setCardCount] = useState(3)
  const [cards, setCards] = useState([])
  const [calledNumbers, setCalledNumbers] = useState([])
  const [currentNumber, setCurrentNumber] = useState(null)
  const [callSequence, setCallSequence] = useState([])
  const [gameActive, setGameActive] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [winInfo, setWinInfo] = useState(null)
  const [betHistory, setBetHistory] = useState([])
  const [roundId, setRoundId] = useState(null)
  const [winPositions, setWinPositions] = useState([])
  const [sessionId] = useState(() => `BSP-${Date.now().toString(36).toUpperCase()}`)

  // Initialize Telegram Mini App
  useEffect(() => {
    if (tg) {
      tg.ready()
      tg.expand()
      tg.setHeaderColor('#000000')
      tg.setBackgroundColor('#000000')
    }
  }, [])

  const intervalRef = useRef(null)
  const wonRef = useRef(false)
  const callIndexRef = useRef(0)
  const cardsRef = useRef([])
  const roundIdRef = useRef(null)

  const stopGame = useCallback(() => {
    clearInterval(intervalRef.current)
    setGameActive(false)
    setGameOver(true)
  }, [])

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

    cardsRef.current = newCards
    roundIdRef.current = id
    callIndexRef.current = 0
    wonRef.current = false

    setCards(newCards)
    setCallSequence(sequence)
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

    // Start calling after a short delay
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
            roundId: id,
            betAmount,
            cardCount,
            status: 'won',
            winType: win.winType,
            payout: win.payout,
            callCount: index,
          }, ...h])
          return
        }
      }

      if (index === sequence.length && !wonRef.current) {
        clearInterval(intervalRef.current)
        setGameActive(false)
        setGameOver(true)
        setBetHistory(h => [{
          roundId: id,
          betAmount,
          cardCount,
          status: 'lost',
          winType: null,
          payout: 0,
          callCount: index,
        }, ...h])
        supabase.from('game_sessions').update({ status: 'lost', call_count: index })
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

  // Cleanup on unmount
  useEffect(() => () => clearInterval(intervalRef.current), [])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col w-full">
      {/* Header */}
      <div className="bg-gray-950 border-b border-red-900 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-red-500 font-black text-2xl tracking-widest">BINGO</h1>
          <p className="text-gray-600 text-xs">{roundId || sessionId}</p>
        </div>
        <div className={`
          px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border
          ${gameActive
            ? 'bg-green-950 text-green-400 border-green-700'
            : gameOver
            ? 'bg-red-950 text-red-400 border-red-700'
            : 'bg-gray-900 text-gray-500 border-gray-700'}
        `}>
          {gameActive ? 'IN PROGRESS' : gameOver ? 'GAME OVER' : 'BETTING OPEN'}
        </div>
      </div>

      {/* Number Caller */}
      <div className="px-4 pt-4">
        <NumberCaller
          calledNumbers={calledNumbers}
          currentNumber={currentNumber}
          isPlaying={gameActive}
        />
      </div>

      {/* Player Cards */}
      {cards.length > 0 && (
        <div className="px-4 pt-4">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Your Cards</p>
          <div className="flex flex-col gap-3">
            {cards.map((card, i) => (
              <BingoCard
                key={i}
                card={card}
                calledNumbers={calledNumbers}
                winPositions={winInfo ? winPositions : []}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-black border-b border-gray-800 mt-4">
        <div className="flex">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`
                flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all
                ${activeTab === i
                  ? 'text-red-400 border-b-2 border-red-500'
                  : 'text-gray-600 hover:text-gray-400'}
              `}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
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
          <BingoTables calledNumbers={calledNumbers} />
        )}
        {activeTab === 2 && (
          <MyBets betHistory={betHistory} />
        )}
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
