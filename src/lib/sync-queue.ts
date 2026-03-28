interface SyncOp {
  id: string
  url: string
  method: 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  retries: number
  timestamp: number
}

const QUEUE_KEY = 'buysial-sync-queue'

function emitQueueChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('sync-queue-changed'))
}

function getQueue(): SyncOp[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') } catch { return [] }
}

function saveQueue(ops: SyncOp[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(QUEUE_KEY, JSON.stringify(ops))
  emitQueueChanged()
}

export function enqueue(url: string, method: SyncOp['method'], body?: unknown) {
  const ops = getQueue()
  ops.push({ id: `${Date.now()}-${Math.random()}`, url, method, body, retries: 0, timestamp: Date.now() })
  saveQueue(ops)
}

export function getPendingCount(): number {
  return getQueue().length
}

export async function processQueue(): Promise<number> {
  const ops = getQueue()
  if (ops.length === 0) return 0
  let synced = 0
  const remaining: SyncOp[] = []
  for (const op of ops) {
    try {
      const res = await fetch(op.url, {
        method: op.method,
        headers: { 'Content-Type': 'application/json' },
        body: op.body ? JSON.stringify(op.body) : undefined,
      })
      if (res.ok) { synced++ } else { remaining.push({ ...op, retries: op.retries + 1 }) }
    } catch {
      remaining.push({ ...op, retries: op.retries + 1 })
    }
  }
  saveQueue(remaining)
  return synced
}

export async function apiSync(url: string, method: SyncOp['method'], body?: unknown): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (res.ok) return true
    enqueue(url, method, body)
    return false
  } catch {
    enqueue(url, method, body)
    return false
  }
}
