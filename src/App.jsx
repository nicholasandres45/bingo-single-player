import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import NumberBoard from './components/NumberBoard'
import WinModal from './components/WinModal'
import LoseModal from './components/LoseModal'
import BuyCards from './pages/BuyCards'
import BingoTables from './pages/BingoTables'
import MyBets from './pages/MyBets'
import {
  generate450CardsForRound,
  generateMultipleCards,
  generateCallSequenceForRound,
  getMarkedPositions,
  checkWinPatterns,
  calculatePayout,
  getColumnForNumber,
  MAX_CALLS,
  TOTAL_CARDS,
} from './utils/bingoUtils'
import { supabase } from './lib/supabase'
import { walletGetUser, walletDebit, walletCredit, walletRollback } from './lib/walletApi'

const tg = window.Telegram?.WebApp
const TABS = ['BUY CARDS', 'BINGO TABLES', 'MY BETS']
const CALL_INTERVAL_MS = 2000
const COUNTDOWN_SECS = 30
const PLAYER_ID_KEY = 'bingo_pid'

const COL_COLORS = {
  B: 'text-blue-400', I: 'text-cyan-400', N: 'text-white',
  G: 'text-yellow-400', O: 'text-orange-400',
}

function decodeJwt(token) {
  try { return JSON.parse(atob(token.split('.')[1])) } catch { return null }
}

function getPlayerInfo() {
  const params = new URLSearchParams(window.location.search)
  const token  = params.get('token')
  const chatId = params.get('chatId')
  if (token && chatId) {
    const payload = decodeJwt(token)
    const username = payload?.username || payload?.first_name || payload?.name || `user_${chatId}`
    return { token, chatId, username }
  }
  // Fallback for local dev (no bot URL params)
  let id = localStorage.getItem(PLAYER_ID_KEY)
  if (!id) { id = `TEST${Date.now().toString(36).toUpperCase()}`; localStorage.setItem(PLAYER_ID_KEY, id) }
  return { token: null, chatId: id, username: 'tester' }
}

export default function App() {
  const [playerInfo]        = useState(getPlayerInfo)
  const [balance, setBalance] = useState(null)
  const [round, setRound]   = useState(null)
  const [myBets, setMyBets] = useState([])
  const [betHistory, setBetHistory]     = useState([])
  const [globalHistory, setGlobalHistory] = useState([])

  const [activeTab, setActiveTab]   = useState(0)
  const betAmount = 10
  const [selectedCardIds, setSelectedCardIds] = useState(new Set())

  const [countdown, setCountdown]         = useState(null)
  const [calledNumbers, setCalledNumbers] = useState([])
  const [currentNumber, setCurrentNumber] = useState(null)
  const [animKey, setAnimKey]             = useState(0)
  const [winInfo, setWinInfo]             = useState(null)
  const [loseInfo, setLoseInfo]           = useState(null)
  const [winPositions, setWinPositions]   = useState([])
  const [takenCardIds, setTakenCardIds]   = useState(new Set())

  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('bingo_muted') === 'true')

  const wonRef         = useRef(false)
  const intervalRef    = useRef(null)
  const ctdwnRef       = useRef(null)
  const roundRef       = useRef(null)
  const myBetsRef      = useRef([])
  const allCardsRef    = useRef(null)
  const recordedRef    = useRef(new Set())
  const isMutedRef     = useRef(isMuted)
  const playerInfoRef  = useRef(playerInfo)

  useEffect(() => { roundRef.current = round }, [round])
  useEffect(() => { myBetsRef.current = myBets }, [myBets])
  useEffect(() => {
    isMutedRef.current = isMuted
    localStorage.setItem('bingo_muted', isMuted)
  }, [isMuted])

  function speakNumber(number) {
    if (isMutedRef.current || !number || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const col = getColumnForNumber(number)
    const utter = new SpeechSynthesisUtterance(`${col}. ${number}`)
    utter.rate = 0.95
    utter.pitch = 1.1
    utter.volume = 1
    window.speechSynthesis.speak(utter)
  }

  // Animate + speak on new number
  useEffect(() => {
    if (currentNumber) {
      setAnimKey(k => k + 1)
      speakNumber(currentNumber)
    }
  }, [currentNumber]) // eslint-disable-line

  // ── Derived ──────────────────────────────────────────────────
  const allCards = useMemo(() => {
    if (!round?.round_id) return generateMultipleCards(TOTAL_CARDS)
    const cards = generate450CardsForRound(round.round_id)
    allCardsRef.current = cards
    return cards
  }, [round?.round_id])

  const callSequence = useMemo(() => {
    if (!round?.round_id) return []
    return generateCallSequenceForRound(round.round_id)
  }, [round?.round_id])

  const myCardIds = useMemo(
    () => new Set(myBets.flatMap(b => b.card_ids)),
    [myBets]
  )

  const phase = useMemo(() => {
    if (!round) return 'loading'
    if (round.status === 'finished') return 'finished'
    // For both waiting and active: honour the local clock for countdown display
    // so clock-drift between clients doesn't cause the timer to vanish early
    if (round.status === 'waiting' || round.status === 'active') {
      if (!round.start_time) return 'betting'
      const elapsed = Date.now() - new Date(round.start_time).getTime()
      if (elapsed < COUNTDOWN_SECS * 1000) return 'countdown'
      if (round.status === 'waiting') return round.player_count >= 2 ? 'calling' : 'betting'
      return 'calling'
    }
    return 'betting'
  }, [round, countdown]) // countdown dep so phase refreshes every 500ms tick

  const possibleWin  = round?.possible_win ?? 0
  const totalCost    = betAmount * selectedCardIds.size
  const bettingOpen  = phase === 'betting' || phase === 'countdown'
  const col          = currentNumber ? getColumnForNumber(currentNumber) : null

  // ── Init ─────────────────────────────────────────────────────
  useEffect(() => {
    if (tg) { tg.ready(); tg.expand(); tg.setHeaderColor('#000000'); tg.setBackgroundColor('#000000') }
    initWallet()
    fetchCurrentRound()
    fetchGlobalHistory()
    const ch = subscribeToUpdates()
    return () => { supabase.removeChannel(ch) }
  }, []) // eslint-disable-line

  async function initWallet() {
    const { token, chatId } = playerInfoRef.current
    if (token) {
      // Live: fetch balance from external wallet API
      const user = await walletGetUser(chatId, token)
      if (user) {
        setBalance(user.balance)
        const apiUsername = user.username || user.first_name || user.name
        if (apiUsername) playerInfoRef.current = { ...playerInfoRef.current, username: apiUsername }
      }
    } else {
      // Dev fallback: use Supabase wallets table
      await supabase.from('wallets').upsert(
        { player_id: chatId, balance: 500 },
        { onConflict: 'player_id', ignoreDuplicates: true }
      )
      const { data } = await supabase.from('wallets').select('balance').eq('player_id', chatId).single()
      if (data) setBalance(data.balance)
    }
  }

  // ── Shared reset helper ──────────────────────────────────────
  function resetForNewRound(newRound) {
    setRound(newRound)
    setMyBets([])
    setCalledNumbers([])
    setCurrentNumber(null)
    setWinInfo(null)
    setLoseInfo(null)
    setWinPositions([])
    setTakenCardIds(new Set())
    setSelectedCardIds(new Set())
    wonRef.current = false
    fetchTakenCards(newRound.round_id)
    fetchMyBets(newRound.round_id)
  }

  async function fetchCurrentRound() {
    const { data } = await supabase
      .from('game_rounds')
      .select('*')
      .in('status', ['waiting', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      // If all numbers have already been called but the round was never closed
      // (e.g. the tab was closed mid-game), finalize it and start fresh
      if (data.start_time) {
        const callStart = new Date(data.start_time).getTime() + COUNTDOWN_SECS * 1000
        const maxGameMs = MAX_CALLS * CALL_INTERVAL_MS + 3000 // small buffer
        if (Date.now() > callStart + maxGameMs) {
          await supabase.from('game_rounds')
            .update({ status: 'finished' })
            .eq('round_id', data.round_id)
            .in('status', ['waiting', 'active'])
          createNewRound()
          return
        }
      }

      const prev = roundRef.current
      if (!prev || prev.round_id !== data.round_id) {
        resetForNewRound(data)
      } else {
        setRound(data)
        fetchMyBets(data.round_id)
        fetchTakenCards(data.round_id)
      }
    } else {
      createNewRound()
    }
  }

  async function fetchMyBets(roundId) {
    const { data } = await supabase
      .from('round_bets')
      .select('id, card_ids, bet_amount, total_cost')
      .eq('round_id', roundId)
      .eq('player_id', playerInfo.chatId)
    setMyBets(data || [])
  }

  async function fetchGlobalHistory() {
    const { data } = await supabase
      .from('game_rounds')
      .select('round_id, winner_player_id, winner_username, winner_payout, winner_type')
      .eq('status', 'finished')
      .not('winner_player_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)
    if (data) setGlobalHistory(data.map(r => ({
      roundId: r.round_id, winnerId: r.winner_player_id,
      username: r.winner_username, payout: r.winner_payout, winType: r.winner_type,
    })))
  }

  async function fetchTakenCards(roundId) {
    const { data } = await supabase
      .from('round_bets')
      .select('card_ids')
      .eq('round_id', roundId)
    if (data) {
      setTakenCardIds(new Set(data.flatMap(b => b.card_ids)))
    }
  }

  function subscribeToUpdates() {
    return supabase
      .channel('bingo-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rounds' }, payload => {
        const updated = payload.new
        if (!updated) return
        const prev = roundRef.current

        if (updated.status === 'finished' && updated.winner_player_id) {
          setGlobalHistory(prev => {
            if (prev.some(g => g.roundId === updated.round_id)) return prev
            return [{
              roundId: updated.round_id, winnerId: updated.winner_player_id,
              username: updated.winner_username, payout: updated.winner_payout, winType: updated.winner_type,
            }, ...prev].slice(0, 10)
          })
        }

        if (!prev || prev.round_id === updated.round_id) {
          // Same round — just update status/fields
          setRound(updated)
          // If new bets came in (pot or count changed), re-sync taken cards
          // so card count stays in step with possible_win
          if (prev && (updated.player_count !== prev.player_count || updated.total_pot !== prev.total_pot)) {
            fetchTakenCards(updated.round_id)
          }
        } else if (
          updated.status === 'waiting' &&
          new Date(updated.created_at) > new Date(prev.created_at ?? 0)
        ) {
          // A newer waiting round appeared — switch to it regardless of prev status
          resetForNewRound(updated)
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'round_bets' }, payload => {
        const bet = payload.new
        if (!bet) return
        const r = roundRef.current
        if (!r || r.round_id !== bet.round_id) return
        setTakenCardIds(prev => {
          const next = new Set(prev)
          bet.card_ids.forEach(id => next.add(id))
          return next
        })
      })
      .subscribe()
  }

  async function createNewRound() {
    // Check for an existing waiting round first — another client may have just created one
    const { data: existing } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existing) {
      resetForNewRound(existing)
      return
    }

    const newId = `BNG${Date.now().toString(36).toUpperCase()}`
    const { data, error } = await supabase
      .from('game_rounds')
      .insert({ round_id: newId, status: 'waiting' })
      .select()
      .single()
    if (data) {
      resetForNewRound(data)
    } else if (error) {
      // Another client may have created one concurrently — fetch it
      setTimeout(fetchCurrentRound, 500)
    }
  }

  // ── Countdown ────────────────────────────────────────────────
  useEffect(() => {
    clearInterval(ctdwnRef.current)

    if (round?.start_time && (round.status === 'waiting' || round.status === 'active')) {
      const tick = () => {
        const elapsed = Date.now() - new Date(round.start_time).getTime()
        const rem = Math.max(0, COUNTDOWN_SECS - Math.floor(elapsed / 1000))
        setCountdown(rem)
        if (rem === 0) {
          clearInterval(ctdwnRef.current)
          const r = roundRef.current
          if (!r || r.status !== 'waiting') return
          if (r.player_count >= 2) {
            supabase.from('game_rounds')
              .update({ status: 'active' })
              .eq('round_id', r.round_id)
              .eq('status', 'waiting')
              .then(() => {})
          } else {
            // Not enough players — reset countdown so betting re-opens
            supabase.from('game_rounds')
              .update({ start_time: null })
              .eq('round_id', r.round_id)
              .eq('status', 'waiting')
              .then(() => {})
            // Refund any bet this player placed for the cancelled round
            const bets = myBetsRef.current
            const { token, chatId, username } = playerInfoRef.current
            if (token && bets.length > 0) {
              const totalBet = bets.reduce((s, b) => s + b.total_cost, 0)
              walletRollback({ token, chatId, username, amount: totalBet, roundId: r.round_id })
                .then(result => { if (result?.new_balance != null) setBalance(result.new_balance) })
            }
          }
        }
      }
      tick()
      ctdwnRef.current = setInterval(tick, 500)
    } else {
      setCountdown(null)
    }

    return () => clearInterval(ctdwnRef.current)
  }, [round?.start_time, round?.status, round?.round_id]) // eslint-disable-line

  // ── Number calling ───────────────────────────────────────────
  useEffect(() => {
    clearInterval(intervalRef.current)
    wonRef.current = false

    if (phase !== 'calling' || !round?.start_time || !round.round_id) return

    const seq = callSequence.length ? callSequence : generateCallSequenceForRound(round.round_id)
    allCardsRef.current = allCards
    const callStart = new Date(round.start_time).getTime() + COUNTDOWN_SECS * 1000

    const tick = () => {
      const elapsed = Date.now() - callStart
      if (elapsed < 0) return

      const callIdx = Math.floor(elapsed / CALL_INTERVAL_MS)
      if (callIdx < 0) return

      const clamped = Math.min(callIdx, seq.length - 1)
      const called  = seq.slice(0, clamped + 1)

      setCalledNumbers([...called])
      setCurrentNumber(seq[clamped] ?? null)

      // Win check — first card to complete any pattern wins the full prize pool
      if (!wonRef.current && roundRef.current?.status !== 'finished') {
        const cards   = allCardsRef.current
        const cardIds = [...new Set(myBetsRef.current.flatMap(b => b.card_ids))]
        const order   = ['One Line', 'Four Corners', 'Diagonal', 'Two Lines', 'Full House']

        for (const cid of cardIds) {
          if (!cards?.[cid]) continue
          const marked = getMarkedPositions(cards[cid], called)
          const wins   = checkWinPatterns(marked)
          if (wins.length > 0) {
            const best   = wins.reduce((a, b) => order.indexOf(b.type) > order.indexOf(a.type) ? b : a)
            const payout = roundRef.current?.possible_win ?? 0 // full prize pool

            wonRef.current = true
            clearInterval(intervalRef.current)
            doWin({
              cardId: cid, winType: best.type,
              payout, positions: best.positions, callCount: clamped + 1,
            })
            return
          }
        }
      }

      // All numbers called — no winner
      if (clamped >= seq.length - 1 && !wonRef.current) {
        clearInterval(intervalRef.current)
        const r = roundRef.current
        if (r && !recordedRef.current.has(r.round_id)) {
          recordedRef.current.add(r.round_id)
          const bets = myBetsRef.current
          if (bets.length > 0) {
            setBetHistory(h => [{
              roundId: r.round_id, status: 'lost',
              betAmount: bets[0].bet_amount,
              cardCount: bets.reduce((s, b) => s + b.card_ids.length, 0),
              possibleWin: r.possible_win, winType: null, payout: 0, callCount: seq.length,
            }, ...h])
            setLoseInfo({ callCount: seq.length })
          }
          supabase.from('game_rounds').update({ status: 'finished' })
            .eq('round_id', r.round_id).in('status', ['waiting', 'active']).then(() => {})
        }
        setTimeout(() => {
          if (roundRef.current?.status === 'finished') fetchCurrentRound()
        }, 5000)
      }
    }

    tick()
    intervalRef.current = setInterval(tick, CALL_INTERVAL_MS)
    return () => clearInterval(intervalRef.current)
  }, [phase, round?.round_id, round?.start_time, round?.status]) // eslint-disable-line

  // When round finishes (someone else won) → add lost entry
  useEffect(() => {
    if (round?.status !== 'finished') return
    const r = round
    if (recordedRef.current.has(r.round_id)) return
    const bets = myBetsRef.current
    if (bets.length === 0) {
      // No bets — still need to transition to next round
      setTimeout(() => {
        if (roundRef.current?.status === 'finished') fetchCurrentRound()
      }, 5000)
      return
    }
    recordedRef.current.add(r.round_id)
    setBetHistory(h => [{
      roundId: r.round_id, status: 'lost',
      betAmount: bets[0].bet_amount,
      cardCount: bets.reduce((s, b) => s + b.card_ids.length, 0),
      possibleWin: r.possible_win, winType: null, payout: 0,
      callCount: calledNumbers.length,
    }, ...h])
    setLoseInfo({ callCount: null }) // null = someone else won
    setTimeout(() => {
      if (roundRef.current?.status === 'finished') fetchCurrentRound()
    }, 5000)
  }, [round?.status, round?.round_id]) // eslint-disable-line

  async function doWin(win) {
    const r = roundRef.current
    if (!r) return

    const { token, chatId, username } = playerInfoRef.current

    const { data } = await supabase
      .from('game_rounds')
      .update({
        status: 'finished',
        winner_player_id: chatId,
        winner_username: username,
        winner_card_id: win.cardId,
        winner_type: win.winType,
        winner_payout: win.payout,
      })
      .eq('round_id', r.round_id)
      .in('status', ['waiting', 'active'])
      .select()
      .single()

    if (!data) return // someone else got there first

    recordedRef.current.add(r.round_id)

    // Credit wallet: winner gets the full prize pool
    if (token) {
      const result = await walletCredit({ token, chatId, username, amount: win.payout, roundId: r.round_id })
      if (result?.new_balance != null) setBalance(result.new_balance)
    } else {
      const { data: w } = await supabase.from('wallets').select('balance').eq('player_id', chatId).single()
      if (w) {
        const newBal = w.balance + win.payout
        await supabase.from('wallets').update({ balance: newBal }).eq('player_id', chatId)
        setBalance(newBal)
      }
    }

    setWinInfo(win)
    setWinPositions(win.positions || [])
    setActiveTab(1)

    const bets = myBetsRef.current
    setBetHistory(h => [{
      roundId: r.round_id, status: 'won',
      betAmount: bets[0]?.bet_amount,
      cardCount: bets.reduce((s, b) => s + b.card_ids.length, 0),
      possibleWin: r.possible_win, winType: win.winType,
      payout: win.payout, callCount: win.callCount,
    }, ...h])

    setTimeout(() => {
      if (roundRef.current?.status === 'finished') fetchCurrentRound()
    }, 5000)
  }

  // ── Bet placement ────────────────────────────────────────────
  const handleBet = useCallback(async () => {
    if (selectedCardIds.size === 0 || !bettingOpen) return

    const isFirstBet = myBetsRef.current.length === 0
    const { token, chatId, username } = playerInfoRef.current

    let r = roundRef.current

    if (!r) {
      await createNewRound()
      await new Promise(res => setTimeout(res, 300))
      r = roundRef.current
      if (!r) return
    }

    // Double-check betting still open (block within last 3s of countdown)
    if (r.start_time) {
      const elapsed = Date.now() - new Date(r.start_time).getTime()
      if (elapsed >= (COUNTDOWN_SECS - 3) * 1000) return
    }

    // Deduct via wallet API (live) or Supabase wallets (dev fallback)
    if (token) {
      const result = await walletDebit({ token, chatId, username, amount: totalCost, roundId: r.round_id })
      if (!result) return
      if (result.insufficientBalance) return
      setBalance(result.new_balance)
    } else {
      const { data: wallet } = await supabase.from('wallets').select('balance').eq('player_id', chatId).single()
      if (!wallet || wallet.balance < totalCost) return
      await supabase.from('wallets').update({ balance: wallet.balance - totalCost }).eq('player_id', chatId)
      setBalance(wallet.balance - totalCost)
    }

    // Insert bet (DB trigger increments player_count and total_pot)
    const { data: bet } = await supabase.from('round_bets').insert({
      round_id: r.round_id,
      player_id: chatId,
      card_ids: [...selectedCardIds],
      bet_amount: betAmount,
      total_cost: totalCost,
    }).select().single()

    if (bet) setMyBets(prev => [...prev, bet])
    setSelectedCardIds(new Set())
    setActiveTab(1)

    // Re-fetch round to get updated player_count from trigger.
    // Start countdown only when 2+ players have bet.
    const { data: freshRound } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('round_id', r.round_id)
      .single()

    if (freshRound) {
      setRound(freshRound)
      if (isFirstBet && freshRound.player_count >= 2 && !freshRound.start_time) {
        const { data: started } = await supabase
          .from('game_rounds')
          .update({ start_time: new Date().toISOString() })
          .eq('round_id', r.round_id)
          .is('start_time', null)
          .select()
          .single()
        if (started) setRound(started)
      }
    }
  }, [selectedCardIds, bettingOpen, totalCost, betAmount]) // eslint-disable-line

  const toggleCard = useCallback((id, forceRemove = false) => {
    if (!bettingOpen) return
    if (!forceRemove && takenCardIds.has(id)) return
    setSelectedCardIds(prev => {
      const next = new Set(prev)
      if (forceRemove || next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [bettingOpen, takenCardIds])

  const handlePlayAgain = () => {
    setWinInfo(null)
    setLoseInfo(null)
    setSelectedCardIds(new Set())
    setActiveTab(0)
    // If round finished but new round hasn't loaded yet, fetch/create one now
    if (roundRef.current?.status === 'finished') fetchCurrentRound()
  }

  useEffect(() => () => {
    clearInterval(intervalRef.current)
    clearInterval(ctdwnRef.current)
  }, [])

  return (
    <div className="h-screen bg-black text-white flex flex-col w-full overflow-hidden">

      {/* ── Header ── */}
      <div className="bg-gray-950 border-b border-gray-800/60 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-baseline gap-2">
          <h1 className="font-display text-xl text-cyan-400">BINGO</h1>
          <span className="text-gray-700 text-[9px] font-mono-nums truncate max-w-[72px]">
            {round?.round_id ?? '...'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {balance !== null && (
            <span className="font-mono-nums text-[9px] font-bold text-yellow-400">
              {balance.toLocaleString()} ETB
            </span>
          )}
          <button
            onClick={() => setIsMuted(m => !m)}
            className="p-1 rounded-lg text-gray-500 hover:text-gray-300 active:scale-90 transition-all shrink-0"
          >
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-600">
                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM17.78 9.22a.75.75 0 10-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 001.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 101.06-1.06L20.56 12l1.72-1.72a.75.75 0 00-1.06-1.06l-1.72 1.72-1.72-1.72z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-cyan-500">
                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 01-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.061z" />
              </svg>
            )}
          </button>
          <span className={`
            px-2.5 py-0.5 rounded-full text-[9px] font-semibold tracking-wider border shrink-0
            ${phase === 'calling'   ? 'bg-green-950/80 text-green-400  border-green-800'
            : phase === 'finished'  ? 'bg-gray-900     text-gray-500   border-gray-700'
            : phase === 'countdown' ? 'bg-yellow-950/80 text-yellow-400 border-yellow-800'
            : phase === 'loading'   ? 'bg-gray-900     text-gray-600   border-gray-700'
            :                         'bg-green-950/80 text-green-400  border-green-800'}
          `}>
            {phase === 'calling'   ? 'In Progress'
            : phase === 'finished' ? 'Game Over'
            : phase === 'countdown' ? `${countdown ?? '…'}s`
            : phase === 'loading'  ? 'Loading…'
            :                        'Betting Open'}
          </span>
        </div>
      </div>

      {/* ── Possible Win Banner ── */}
      <div className="bg-gray-950/80 border-b border-gray-800/40 px-4 py-1.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-600 text-[9px] uppercase tracking-widest font-semibold">Possible Win</span>
          <span className="text-gray-700 text-[9px]">·</span>
          <span className="text-gray-600 text-[9px]">{takenCardIds.size} card{takenCardIds.size !== 1 ? 's' : ''} placed</span>
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

          {/* Global recent winners */}
          <div className="mx-2 mt-2 flex-1 overflow-y-auto min-h-0">
            <p className="text-gray-700 text-[9px] uppercase tracking-widest font-semibold mb-1 sticky top-0 bg-transparent">Recent Winners</p>
            {globalHistory.length === 0 ? (
              <p className="text-gray-800 text-[8px] mt-1">No recent games</p>
            ) : globalHistory.map((g, i) => (
              <div key={i} className="flex items-center justify-between gap-1 py-1 border-b border-gray-900/80">
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-gray-500 text-[8px] truncate">{g.username ? `@${g.username}` : `Player #${String(g.winnerId).slice(-4)}`}</span>
                  <span className="text-gray-700 text-[7px] truncate">{g.winType}</span>
                </div>
                <span className="font-mono-nums text-[9px] font-bold text-emerald-400 shrink-0">+{(g.payout ?? 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
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
                selectedCardIds={selectedCardIds} onToggleCard={toggleCard}
                possibleWin={possibleWin}         totalCost={totalCost}
                onBet={handleBet}
                phase={phase}                     countdown={countdown}
                balance={balance}                 cardCount={takenCardIds.size}
                takenCardIds={takenCardIds}        myCardIds={myCardIds}
              />
            )}
            {activeTab === 1 && (
              <BingoTables
                allCards={allCards}
                selectedCardIds={myCardIds}
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
          winType={winInfo.winType} payout={winInfo.payout}
          callCount={winInfo.callCount} onClose={() => setWinInfo(null)}
          onPlayAgain={handlePlayAgain} isMuted={isMuted}
        />
      )}

      {loseInfo && !winInfo && (
        <LoseModal
          callCount={loseInfo.callCount}
          onClose={() => setLoseInfo(null)}
          onPlayAgain={handlePlayAgain} isMuted={isMuted}
        />
      )}
    </div>
  )
}
