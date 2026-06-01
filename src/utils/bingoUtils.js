// BINGO column ranges: B=1-15, I=16-30, N=31-45, G=46-60, O=61-75
const COLUMN_RANGES = {
  B: [1, 15],
  I: [16, 30],
  N: [31, 45],
  G: [46, 60],
  O: [61, 75],
}

const COLUMNS = ['B', 'I', 'N', 'G', 'O']

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateBingoCard() {
  const card = {}
  COLUMNS.forEach((col, colIndex) => {
    const [min, max] = COLUMN_RANGES[col]
    const nums = new Set()
    while (nums.size < 5) {
      nums.add(randomInt(min, max))
    }
    card[col] = [...nums]
  })
  // FREE space in center (N column, index 2)
  card['N'][2] = 'FREE'
  return card
}

export function generateMultipleCards(count) {
  return Array.from({ length: count }, () => generateBingoCard())
}

export function generateCallSequence() {
  const all = []
  for (let i = 1; i <= 75; i++) all.push(i)
  // Fisher-Yates shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = randomInt(0, i)
    ;[all[i], all[j]] = [all[j], all[i]]
  }
  return all
}

export function getColumnForNumber(num) {
  if (num >= 1 && num <= 15) return 'B'
  if (num >= 16 && num <= 30) return 'I'
  if (num >= 31 && num <= 45) return 'N'
  if (num >= 46 && num <= 60) return 'G'
  return 'O'
}

// Returns a Set of called numbers that exist on this card as "row,col" positions
export function getMarkedPositions(card, calledNumbers) {
  const marked = new Set()
  const calledSet = new Set(calledNumbers)
  COLUMNS.forEach((col, colIndex) => {
    card[col].forEach((val, rowIndex) => {
      if (val === 'FREE' || calledSet.has(val)) {
        marked.add(`${rowIndex},${colIndex}`)
      }
    })
  })
  return marked
}

export function checkWinPatterns(marked) {
  const wins = []

  // Check rows (One Line)
  for (let row = 0; row < 5; row++) {
    if ([0,1,2,3,4].every(col => marked.has(`${row},${col}`))) {
      wins.push({ type: 'One Line', positions: [0,1,2,3,4].map(col => `${row},${col}`) })
    }
  }

  // Check columns (One Line)
  for (let col = 0; col < 5; col++) {
    if ([0,1,2,3,4].every(row => marked.has(`${row},${col}`))) {
      wins.push({ type: 'One Line', positions: [0,1,2,3,4].map(row => `${row},${col}`) })
    }
  }

  // Check diagonals
  const diag1 = [0,1,2,3,4].map(i => `${i},${i}`)
  const diag2 = [0,1,2,3,4].map(i => `${i},${4-i}`)
  if (diag1.every(p => marked.has(p))) wins.push({ type: 'Diagonal', positions: diag1 })
  if (diag2.every(p => marked.has(p))) wins.push({ type: 'Diagonal', positions: diag2 })

  // Four corners
  const corners = ['0,0', '0,4', '4,0', '4,4']
  if (corners.every(p => marked.has(p))) wins.push({ type: 'Four Corners', positions: corners })

  // Two lines: any 2 complete rows or columns
  const completeRows = []
  const completeCols = []
  for (let row = 0; row < 5; row++) {
    if ([0,1,2,3,4].every(col => marked.has(`${row},${col}`))) completeRows.push(row)
  }
  for (let col = 0; col < 5; col++) {
    if ([0,1,2,3,4].every(row => marked.has(`${row},${col}`))) completeCols.push(col)
  }
  if (completeRows.length >= 2 || completeCols.length >= 2 || (completeRows.length + completeCols.length) >= 2) {
    wins.push({ type: 'Two Lines', positions: [] })
  }

  // Full House
  if (marked.size >= 24) { // all 24 non-free + free = 25, free is always marked
    const allPositions = []
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) allPositions.push(`${r},${c}`)
    if (allPositions.every(p => marked.has(p))) {
      wins.push({ type: 'Full House', positions: allPositions })
    }
  }

  return wins
}

export function calculatePayout(betAmount, winType, callCount) {
  const multipliers = {
    'One Line': 10,
    'Four Corners': 10,
    'Diagonal': 15,
    'Two Lines': 25,
  }

  if (winType === 'Full House') {
    let multiplier = 100
    if (callCount <= 30) multiplier = 500
    else if (callCount <= 40) multiplier = 400
    else if (callCount <= 50) multiplier = 300
    else if (callCount <= 60) multiplier = 200
    return betAmount * multiplier
  }

  return betAmount * (multipliers[winType] || 0)
}

export const COLUMNS_LIST = COLUMNS
