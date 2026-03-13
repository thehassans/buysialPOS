export type DevicePrintRole = 'waiter' | 'kitchen' | 'cashier' | 'admin'

type PrintChannel = 'kitchen' | 'cashier'

const PRINT_STORAGE_PREFIX = 'buysial-print'

export function getDevicePrintRole(): DevicePrintRole {
  const rawRole = (process.env.NEXT_PUBLIC_DEVICE_ROLE || 'waiter').trim().toLowerCase()
  if (rawRole === 'kitchen' || rawRole === 'cashier' || rawRole === 'admin') return rawRole
  return 'waiter'
}

export function shouldAutoPrintKitchen() {
  return getDevicePrintRole() === 'kitchen'
}

export function shouldAutoPrintCashier() {
  return getDevicePrintRole() === 'cashier'
}

function getStorageKey(channel: PrintChannel) {
  return `${PRINT_STORAGE_PREFIX}:${channel}`
}

function readPrinted(channel: PrintChannel) {
  if (typeof window === 'undefined') return [] as string[]
  try {
    const raw = window.localStorage.getItem(getStorageKey(channel))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []
  } catch {
    return [] as string[]
  }
}

function writePrinted(channel: PrintChannel, entries: string[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(getStorageKey(channel), JSON.stringify(entries.slice(-100)))
}

export function hasPrintedJob(channel: PrintChannel, fingerprint: string) {
  return readPrinted(channel).includes(fingerprint)
}

export function markPrintedJob(channel: PrintChannel, fingerprint: string) {
  const entries = readPrinted(channel)
  if (entries.includes(fingerprint)) return
  entries.push(fingerprint)
  writePrinted(channel, entries)
}

export function buildPrintFingerprint(orderId: string, signature?: string) {
  return `${orderId}:${signature || 'default'}`
}
