const COLUMN_RANGES = {
  B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75],
}

const COLUMNS = ['B', 'I', 'N', 'G', 'O']

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000
  }
}

function hashStr(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}

function seededCard(rng) {
  const card = {}
  COLUMNS.forEach(col => {
    const [min, max] = COLUMN_RANGES[col]
    const pool = Array.from({ length: max - min + 1 }, (_, i) => min + i)
    for (let i = 0; i < 5; i++) {
      const j = i + Math.floor(rng() * (pool.length - i))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    card[col] = pool.slice(0, 5)
  })
  card['N'][2] = 'FREE'
  return card
}

export function generate450CardsForRound(roundId) {
  const rng = mulberry32(hashStr(roundId))
  return Array.from({ length: TOTAL_CARDS }, () => seededCard(rng))
}

export function generateCallSequenceForRound(roundId) {
  const rng = mulberry32(hashStr(roundId) ^ 0xDEADBEEF)
  const all = Array.from({ length: 75 }, (_, i) => i + 1)
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[all[i], all[j]] = [all[j], all[i]]
  }
  return all
}

export function generateBingoCard() {
  const card = {}
  COLUMNS.forEach(col => {
    const [min, max] = COLUMN_RANGES[col]
    const nums = new Set()
    while (nums.size < 5) nums.add(randomInt(min, max))
    card[col] = [...nums]
  })
  card['N'][2] = 'FREE'
  return card
}

export function generateMultipleCards(count) {
  return Array.from({ length: count }, () => generateBingoCard())
}

export function generateCallSequence() {
  const all = []
  for (let i = 1; i <= 75; i++) all.push(i)
  for (let i = all.length - 1; i > 0; i--) {
    const j = randomInt(0, i)
    ;[all[i], all[j]] = [all[j], all[i]]
  }
  return all
}

export const MAX_CALLS = 75
export const TOTAL_CARDS = 450
export const PLATFORM_CUT = 0.10

export function calculatePossibleWin(betAmount) {
  return Math.floor(betAmount * TOTAL_CARDS * (1 - PLATFORM_CUT))
}

export function calculatePayout(possibleWin, winType) {
  const portions = {
    'One Line':     0.10,
    'Four Corners': 0.15,
    'Diagonal':     0.20,
    'Two Lines':    0.35,
    'Full House':   1.00,
  }
  return Math.floor(possibleWin * (portions[winType] || 0))
}

export function getColumnForNumber(num) {
  if (num <= 15) return 'B'
  if (num <= 30) return 'I'
  if (num <= 45) return 'N'
  if (num <= 60) return 'G'
  return 'O'
}

export function getMarkedPositions(card, calledNumbers) {
  const marked = new Set()
  const calledSet = new Set(calledNumbers)
  COLUMNS.forEach((col, colIndex) => {
    card[col].forEach((val, rowIndex) => {
      if (val === 'FREE' || calledSet.has(val)) marked.add(`${rowIndex},${colIndex}`)
    })
  })
  return marked
}

export function checkWinPatterns(marked) {
  const wins = []

  for (let row = 0; row < 5; row++) {
    if ([0,1,2,3,4].every(col => marked.has(`${row},${col}`)))
      wins.push({ type: 'One Line', positions: [0,1,2,3,4].map(col => `${row},${col}`) })
  }
  for (let col = 0; col < 5; col++) {
    if ([0,1,2,3,4].every(row => marked.has(`${row},${col}`)))
      wins.push({ type: 'One Line', positions: [0,1,2,3,4].map(row => `${row},${col}`) })
  }

  const diag1 = [0,1,2,3,4].map(i => `${i},${i}`)
  const diag2 = [0,1,2,3,4].map(i => `${i},${4-i}`)
  if (diag1.every(p => marked.has(p))) wins.push({ type: 'Diagonal', positions: diag1 })
  if (diag2.every(p => marked.has(p))) wins.push({ type: 'Diagonal', positions: diag2 })

  const corners = ['0,0', '0,4', '4,0', '4,4']
  if (corners.every(p => marked.has(p))) wins.push({ type: 'Four Corners', positions: corners })

  const completeRows = [0,1,2,3,4].filter(r => [0,1,2,3,4].every(c => marked.has(`${r},${c}`)))
  const completeCols = [0,1,2,3,4].filter(c => [0,1,2,3,4].every(r => marked.has(`${r},${c}`)))
  if (completeRows.length + completeCols.length >= 2)
    wins.push({ type: 'Two Lines', positions: [] })

  const allPos = []
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) allPos.push(`${r},${c}`)
  if (marked.size >= 25 && allPos.every(p => marked.has(p)))
    wins.push({ type: 'Full House', positions: allPos })

  return wins
}

export const COLUMNS_LIST = COLUMNS
