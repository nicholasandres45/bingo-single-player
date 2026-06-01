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

const COL_COLORS = {
  B: 'text-blue-400',
  I: 'text-cyan-400',
  N: 'text-white',
  G: 'text-yellow-400',
  O: 'text-orange-400',
}

export default function App() {
  const [activeTab, setActiveTab]     = useState(0)
  const [betAmount, setBetAmount]     = useState(10)
  const [cardCount, setCardCount]     = useState(3)
  const [cards, setCards]             = useState([])
  const [calledNumbers, setCalledNumbers] = useState([])
  const [currentNumber, setCurrentNumber] = useState(null)
  const [gameActive, setGameActive]   = useState(false)
  const [gameOver, setGameOver]       = useState(false)
  const [winInfo, setWinInfo]         = useState(null)
  const [betHistory, setBetHistory]   = useState([])
  const [roundId, setRoundId]         = useState(null)
  const [winPositions, setWinPositions] = useState([])
  const [animKey, setAnimKey]         = useState(0)
  const [sessionId] = useState(() => `BSP-${Date.now().toString(36).toUpperCase()}`)

  const intervalRef = useRef(null)
  const wonRef      = useRef(false)

  useEffect(() => {
    if (tg) { tg.ready(); tg.expand(); tg.setHeaderColor('#000000'); tg.setBackgroundColor('#000000') }
  }, [])

  useEffect(() => { if (currentNumber) setAnimKey(k => k + 1) }, [currentNumber])

  const checkForWin = useCallback((called, currentCards, currentBet) => {
    for (const card of currentCards) {
      const marked = getMarkedPositions(card, called)
      const wins   = checkWinPatterns(marked)
      if (wins.length > 0) {
        const order = ['One Line', 'Four Corners', 'Diagonal', 'Two Lines', 'Full House']
        const best  = wins.reduce((a, b) => order.indexOf(b.type) > order.indexOf(a.type) ? b : a)
        return { winType: best.type, payout: calculatePayout(currentBet, best.type, called.length), positions: best.positions }
      }
    }
    return null
  }, [])

  const handleBuyCards = useCallback(async () => {
    const newCards = generateMultipleCards(cardCount)
    const sequence = generateCallSequence()
    const id       = `BSP-${Date.now().toString(36).toUpperCase()}`

    wonRef.current = false
    setCards(newCards); setCalledNumbers([]); setCurrentNumber(null)
    setGameActive(true); setGameOver(false); setWinInfo(null)
    setWinPositions([]); setRoundId(id); setActiveTab(1)

    try {
      await supabase.from('game_sessions').insert({ round_id: id, bet_amount: betAmount, card_count: cardCount, status: 'active' })
    } catch (_) {}

    let index = 0
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      index++
      if (index > sequence.length) { clearInterval(intervalRef.current); setGameActive(false); setGameOver(true); return }

      const called = sequence.slice(0, index)
      setCurrentNumber(sequence[index - 1])
      setCalledNumbers([...called])

      if (!wonRef.current) {
        const win = checkForWin(called, newCards, betAmount)
        if (win) {
          wonRef.current = true
          clearInterval(intervalRef.current)
          setWinInfo({ ...win, callCount: index })
          setWinPositions(win.positions || [])
          setGameActive(false); setGameOver(true)
          supabase.from('game_sessions').update({ status: 'won', win_type: win.winType, payout: win.payout, call_count: index }).eq('round_id', id).then(() => {})
          setBetHistory(h => [{ roundId: id, betAmount, cardCount, status: 'won', winType: win.winType, payout: win.payout, callCount: index }, ...h])
          return
        }
      }

      if (index === sequence.length && !wonRef.current) {
        clearInterval(intervalRef.current); setGameActive(false); setGameOver(true)
        setBetHistory(h => [{ roundId: id, betAmount, cardCount, status: 'lost', winType: null, payout: 0, callCount: index }, ...h])
        supabase.from('game_sessions').update({ status: 'lost', call_count: index }).eq('round_id', id).then(() => {})
      }
    }, CALL_INTERVAL_MS)
  }, [cardCount, betAmount, checkForWin])

  const handlePlayAgain = () => {
    setWinInfo(null); setCards([]); setCalledNumbers([])
    setCurrentNumber(null); setGameOver(false); setActiveTab(0)
  }

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const col = currentNumber ? getColumnForNumber(currentNumber) : null

  return (
    <div className="h-screen bg-black text-white flex flex-col w-full overflow-hidden">

      {/* ── Header ── */}
      <div className="bg-gray-950 border-b border-gray-800 px-3 py-1.5 flex items-center justify-between shrink-0">
        <div className="flex items-baseline gap-2">
          <h1 className="font-display text-2xl text-cyan-400">BINGO</h1>
          <span className="text-gray-700 text-[10px] font-mono-nums">{roundId || sessionId}</span>
        </div>
        <span className={`
          px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border
          ${gameActive  ? 'bg-green-950 text-green-400 border-green-800'
          : gameOver    ? 'bg-gray-900  text-gray-500  border-gray-700'
          :               'bg-green-950 text-green-400 border-green-800'}
        `}>
          {gameActive ? 'In Progress' : gameOver ? 'Game Over' : 'Betting Open'}
        </span>
      </div>

      {/* ── Two-column body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT */}
        <div className="w-[44%] border-r border-gray-800 flex flex-col overflow-hidden">

          {/* Called number */}
          <div className="px-2 py-1.5 border-b border-gray-800 flex flex-col items-center gap-0.5 shrink-0">
            <span className="text-gray-600 text-[9px] uppercase tracking-widest font-medium">Called</span>
            {currentNumber ? (
              <div key={animKey} className="call-bounce flex items-end gap-0.5 leading-none">
                <span className={`font-display text-xl leading-none ${COL_COLORS[col] || 'text-white'}`}>{col}</span>
                <span className="font-display text-5xl leading-none text-cyan-400" style={{ textShadow: '0 0 20px rgba(6,182,212,0.6)' }}>
                  {currentNumber}
                </span>
              </div>
            ) : (
              <div className="flex items-end gap-0.5 leading-none opacity-20">
                <span className="font-display text-xl text-cyan-400">-</span>
                <span className="font-display text-5xl text-white">--</span>
              </div>
            )}
            <span className="text-[10px] font-mono-nums mt-0.5">
              <span className="text-cyan-400 font-bold">{calledNumbers.length}</span>
              <span className="text-gray-700"> / {MAX_CALLS}</span>
            </span>
          </div>

          {/* Number board */}
          <div className="shrink-0">
            <NumberBoard calledNumbers={calledNumbers} />
          </div>

          {/* Payout table */}
          <div className="mx-1.5 mt-1 bg-gray-900/80 rounded-lg border border-gray-800 shrink-0">
            <p className="text-gray-600 text-[9px] uppercase tracking-widest font-semibold text-center pt-1.5 pb-1">
              Payout Table
            </p>
            <div className="pb-1">
              {[
                ['One Line',    '10X'],
                ['Four Corners','10X'],
                ['Diagonal',    '15X'],
                ['Two Lines',   '25X'],
                ['Full House',  '100–500X', true],
              ].map(([label, mult, special]) => (
                <div key={label} className="flex justify-between items-center px-2 py-[3px]">
                  <span className="text-gray-500 text-[9px]">{label}</span>
                  <span className={`font-display text-xs tracking-wide ${special ? 'text-yellow-400' : 'text-cyan-400'}`}>{mult}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent rounds */}
          {betHistory.length > 0 && (
            <div className="mx-1.5 mt-1.5 shrink-0">
              <p className="text-gray-700 text-[9px] uppercase tracking-widest mb-1">Recent</p>
              {betHistory.slice(0, 3).map((b, i) => (
                <div key={i} className="flex justify-between items-center py-[3px] border-b border-gray-900">
                  <span className="text-gray-700 text-[9px] font-mono-nums truncate max-w-[80px]">{b.roundId}</span>
                  <span className={`text-[9px] font-semibold font-mono-nums ${b.status === 'won' ? 'text-green-400' : 'text-gray-700'}`}>
                    {b.status === 'won' ? `+${b.payout}` : 'Lost'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="w-[56%] flex flex-col overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-gray-800 shrink-0">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`
                  flex-1 py-1.5 text-[9px] font-semibold uppercase tracking-wider leading-tight transition-all
                  ${activeTab === i ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-gray-600 hover:text-gray-400'}
                `}
              >
                {tab.split(' ').map((w, j) => <span key={j} className="block">{w}</span>)}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 0 && (
              <BuyCards
                betAmount={betAmount} setBetAmount={setBetAmount}
                cardCount={cardCount} setCardCount={setCardCount}
                onBuyCards={handleBuyCards} gameActive={gameActive}
              />
            )}
            {activeTab === 1 && (
              <BingoTables cards={cards} calledNumbers={calledNumbers} winPositions={winInfo ? winPositions : []} />
            )}
            {activeTab === 2 && <MyBets betHistory={betHistory} />}
          </div>
        </div>
      </div>

      {winInfo && (
        <WinModal
          winType={winInfo.winType} payout={winInfo.payout}
          callCount={winInfo.callCount} onClose={() => setWinInfo(null)}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  )
}
