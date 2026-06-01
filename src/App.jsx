import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
  calculatePossibleWin,
  getColumnForNumber,
  MAX_CALLS,
  TOTAL_CARDS,
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
  const [activeTab, setActiveTab]         = useState(0)
  const [betAmount, setBetAmount]         = useState(10)
  const [selectedCardIds, setSelectedCardIds] = useState(new Set())
  const [calledNumbers, setCalledNumbers] = useState([])
  const [currentNumber, setCurrentNumber] = useState(null)
  const [gameActive, setGameActive]       = useState(false)
  const [gameOver, setGameOver]           = useState(false)
  const [winInfo, setWinInfo]             = useState(null)
  const [betHistory, setBetHistory]       = useState([])
  const [roundId, setRoundId]             = useState(null)
  const [winPositions, setWinPositions]   = useState([])
  const [animKey, setAnimKey]             = useState(0)
  const [sessionId] = useState(() => `BSP-${Date.now().toString(36).toUpperCase()}`)

  // Generate 450 cards once — never regenerated
  const allCards = useMemo(() => generateMultipleCards(TOTAL_CARDS), [])

  const possibleWin = calculatePossibleWin(betAmount)
  const totalCost   = betAmount * selectedCardIds.size

  const intervalRef = useRef(null)
  const wonRef      = useRef(false)

  useEffect(() => {
    if (tg) { tg.ready(); tg.expand(); tg.setHeaderColor('#000000'); tg.setBackgroundColor('#000000') }
  }, [])

  useEffect(() => { if (currentNumber) setAnimKey(k => k + 1) }, [currentNumber])

  const toggleCard = useCallback((id, forceRemove = false) => {
    if (gameActive) return
    setSelectedCardIds(prev => {
      const next = new Set(prev)
      if (forceRemove || next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [gameActive])

  const clearCards = useCallback(() => {
    if (gameActive) return
    setSelectedCardIds(new Set())
  }, [gameActive])

  const checkForWin = useCallback((called, playerCards, pw) => {
    for (const { id, card } of playerCards) {
      const marked = getMarkedPositions(card, called)
      const wins   = checkWinPatterns(marked)
      if (wins.length > 0) {
        const order = ['One Line', 'Four Corners', 'Diagonal', 'Two Lines', 'Full House']
        const best  = wins.reduce((a, b) => order.indexOf(b.type) > order.indexOf(a.type) ? b : a)
        return { cardId: id, winType: best.type, payout: calculatePayout(pw, best.type), positions: best.positions }
      }
    }
    return null
  }, [])

  const handleStartGame = useCallback(async () => {
    if (selectedCardIds.size === 0 || gameActive) return

    const playerCards = [...selectedCardIds].map(id => ({ id, card: allCards[id] }))
    const sequence    = generateCallSequence()
    const id          = `BSP-${Date.now().toString(36).toUpperCase()}`
    const pw          = calculatePossibleWin(betAmount)

    wonRef.current = false
    setCalledNumbers([]); setCurrentNumber(null)
    setGameActive(true); setGameOver(false)
    setWinInfo(null); setWinPositions([])
    setRoundId(id); setActiveTab(1)

    try {
      await supabase.from('game_sessions').insert({
        round_id: id, bet_amount: betAmount,
        card_count: selectedCardIds.size, possible_win: pw, status: 'active',
      })
    } catch (_) {}

    let index = 0
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      index++
      if (index > sequence.length) {
        clearInterval(intervalRef.current); setGameActive(false); setGameOver(true); return
      }

      const called = sequence.slice(0, index)
      setCurrentNumber(sequence[index - 1])
      setCalledNumbers([...called])

      if (!wonRef.current) {
        const win = checkForWin(called, playerCards, pw)
        if (win) {
          wonRef.current = true
          clearInterval(intervalRef.current)
          setWinInfo({ ...win, callCount: index })
          setWinPositions(win.positions || [])
          setGameActive(false); setGameOver(true)
          supabase.from('game_sessions').update({
            status: 'won', win_type: win.winType, payout: win.payout, call_count: index,
          }).eq('round_id', id).then(() => {})
          setBetHistory(h => [{
            roundId: id, betAmount, cardCount: selectedCardIds.size,
            possibleWin: pw, status: 'won',
            winType: win.winType, payout: win.payout, callCount: index,
          }, ...h])
          return
        }
      }

      if (index === sequence.length && !wonRef.current) {
        clearInterval(intervalRef.current); setGameActive(false); setGameOver(true)
        setBetHistory(h => [{
          roundId: id, betAmount, cardCount: selectedCardIds.size,
          possibleWin: pw, status: 'lost', winType: null, payout: 0, callCount: index,
        }, ...h])
        supabase.from('game_sessions')
          .update({ status: 'lost', call_count: index })
          .eq('round_id', id).then(() => {})
      }
    }, CALL_INTERVAL_MS)
  }, [selectedCardIds, betAmount, allCards, gameActive, checkForWin])

  const handlePlayAgain = () => {
    setWinInfo(null); setCalledNumbers([])
    setCurrentNumber(null); setGameOver(false)
    setSelectedCardIds(new Set()); setActiveTab(0)
  }

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const col = currentNumber ? getColumnForNumber(currentNumber) : null

  return (
    <div className="h-screen bg-black text-white flex flex-col w-full overflow-hidden">

      {/* ── Header ── */}
      <div className="bg-gray-950 border-b border-gray-800/60 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-baseline gap-2">
          <h1 className="font-display text-xl text-cyan-400">BINGO</h1>
          <span className="text-gray-700 text-[9px] font-mono-nums">{roundId || sessionId}</span>
        </div>
        <span className={`
          px-2.5 py-0.5 rounded-full text-[9px] font-semibold tracking-wider border
          ${gameActive  ? 'bg-green-950/80 text-green-400 border-green-800'
          : gameOver    ? 'bg-gray-900    text-gray-500  border-gray-700'
          :               'bg-green-950/80 text-green-400 border-green-800'}
        `}>
          {gameActive ? 'In Progress' : gameOver ? 'Game Over' : 'Betting Open'}
        </span>
      </div>

      {/* ── Possible Win Banner ── */}
      <div className="bg-gray-950/80 border-b border-gray-800/40 px-4 py-1.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-600 text-[9px] uppercase tracking-widest font-semibold">Possible Win</span>
          <span className="text-gray-700 text-[9px]">·</span>
          <span className="text-gray-600 text-[9px]">Platform 10%</span>
        </div>
        <span className="font-mono-nums text-base font-bold text-yellow-400"
          style={{ textShadow: '0 0 12px rgba(250,204,21,0.4)' }}>
          {possibleWin.toLocaleString()} ETB
        </span>
      </div>

      {/* ── Two-column body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT ── */}
        <div className="w-[44%] flex flex-col overflow-hidden pr-2">

          {/* Called number */}
          <div className="px-3 py-2 border-b border-gray-800/60 flex flex-col items-center gap-1 shrink-0">
            <span className="text-gray-600 text-[9px] uppercase tracking-widest font-semibold">Called</span>
            {currentNumber ? (
              <div key={animKey} className="call-bounce flex items-end gap-1 leading-none">
                <span className={`font-display text-lg leading-none ${COL_COLORS[col] || 'text-white'}`}>{col}</span>
                <span className="font-mono-nums text-4xl font-black leading-none text-cyan-400"
                  style={{ textShadow: '0 0 18px rgba(6,182,212,0.55)' }}>
                  {currentNumber}
                </span>
              </div>
            ) : (
              <div className="flex items-end gap-1 leading-none opacity-20">
                <span className="font-display text-lg text-cyan-400">—</span>
                <span className="font-mono-nums text-4xl font-black text-white">--</span>
              </div>
            )}
            <span className="text-[9px] font-mono-nums mt-0.5">
              <span className="text-cyan-400 font-bold">{calledNumbers.length}</span>
              <span className="text-gray-700"> / {MAX_CALLS}</span>
            </span>
          </div>

          {/* Number board */}
          <div className="shrink-0 px-2 pt-1.5">
            <NumberBoard calledNumbers={calledNumbers} />
          </div>

          {/* Payout table */}
          <div className="mx-2 mt-2 bg-gray-900/60 rounded-xl border border-gray-800/60 shrink-0">
            <p className="font-display text-[9px] text-gray-500 tracking-widest text-center pt-2 pb-1">
              Payout Table
            </p>
            <div className="pb-1.5">
              {[
                ['One Line',     '10%'],
                ['Four Corners', '15%'],
                ['Diagonal',     '20%'],
                ['Two Lines',    '35%'],
                ['Full House',   '100%', true],
              ].map(([label, pct, special]) => (
                <div key={label} className="flex items-center justify-between gap-1 px-3 py-[3px]">
                  <span className="text-gray-500 text-[9px] font-medium flex-1 min-w-0">{label}</span>
                  <span className={`font-mono-nums text-[9px] font-semibold shrink-0 ${special ? 'text-yellow-400' : 'text-cyan-400'}`}>
                    {pct}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent rounds */}
          {betHistory.length > 0 && (
            <div className="mx-2 mt-2 shrink-0">
              <p className="text-gray-700 text-[9px] uppercase tracking-widest font-semibold mb-1">Recent</p>
              {betHistory.slice(0, 3).map((b, i) => (
                <div key={i} className="flex items-center justify-between gap-1 py-1 border-b border-gray-900">
                  <span className="text-gray-700 text-[9px] font-mono-nums truncate flex-1 min-w-0">{b.roundId}</span>
                  <span className={`text-[9px] font-bold font-mono-nums shrink-0 ${b.status === 'won' ? 'text-green-400' : 'text-gray-700'}`}>
                    {b.status === 'won' ? `+${b.payout}` : 'Lost'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px shrink-0 bg-gray-800/50 self-stretch mx-1" />

        {/* ── RIGHT ── */}
        <div className="flex-1 flex flex-col overflow-hidden pl-1">

          {/* Tab bar */}
          <div className="flex border-b border-gray-800/60 shrink-0">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`
                  flex-1 px-1 py-2 text-[9px] font-semibold uppercase tracking-wider leading-tight transition-all
                  ${activeTab === i ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-gray-600 hover:text-gray-400'}
                `}
              >
                {tab.split(' ').map((w, j) => <span key={j} className="block text-center">{w}</span>)}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {activeTab === 0 && (
              <BuyCards
                betAmount={betAmount}       setBetAmount={setBetAmount}
                selectedCardIds={selectedCardIds} onToggleCard={toggleCard}
                possibleWin={possibleWin}   totalCost={totalCost}
                onStartGame={handleStartGame}    gameActive={gameActive}
              />
            )}
            {activeTab === 1 && (
              <BingoTables
                allCards={allCards}
                selectedCardIds={selectedCardIds}
                calledNumbers={calledNumbers}
                winPositions={winInfo ? winPositions : []}
              />
            )}
            {activeTab === 2 && <MyBets betHistory={betHistory} />}
          </div>
        </div>
      </div>

      {winInfo && (
        <WinModal
          winType={winInfo.winType}     payout={winInfo.payout}
          callCount={winInfo.callCount} onClose={() => setWinInfo(null)}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  )
}
