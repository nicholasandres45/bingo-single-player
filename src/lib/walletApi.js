const BASE_URL = 'https://wallet-api-rdxt.onrender.com'

function todayStr() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '')
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function walletGetUser(chatId, token) {
  try {
    const res = await fetch(`${BASE_URL}/api/userinfo/get/${chatId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.userData ?? null
  } catch { return null }
}

export async function walletDebit({ token, chatId, username, amount, roundId }) {
  try {
    const res = await fetch(`${BASE_URL}/api/debit`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        user_id: String(chatId),
        username,
        transaction_type: 'debit',
        amount,
        game: 'Bingo',
        round_id: roundId,
        transaction_id: `TXN_${todayStr()}_${roundId}_DEBIT_${chatId}_${Date.now()}`,
      }),
    })
    const data = await res.json()
    if (res.status === 422) return { insufficientBalance: true }
    if (!res.ok || !data.success) return null
    return data
  } catch { return null }
}

export async function walletCredit({ token, chatId, username, amount, roundId }) {
  try {
    const res = await fetch(`${BASE_URL}/api/credit`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        user_id: String(chatId),
        username,
        transaction_type: 'credit',
        amount,
        game: 'Bingo',
        round_id: roundId,
        transaction_id: `TXN_${todayStr()}_${roundId}_CREDIT_${chatId}`,
      }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) return null
    return data
  } catch { return null }
}

export async function walletRollback({ token, chatId, username, amount, roundId }) {
  try {
    const res = await fetch(`${BASE_URL}/api/credit/rollback`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        user_id: String(chatId),
        username,
        transaction_type: 'rollback',
        amount,
        game: 'Bingo',
        round_id: roundId,
        transaction_id: `TXN_${todayStr()}_${roundId}_ROLLBACK_${chatId}`,
      }),
    })
    const data = await res.json()
    if (res.status === 409) return { success: true, alreadyDone: true }
    if (!res.ok || !data.success) return null
    return data
  } catch { return null }
}
