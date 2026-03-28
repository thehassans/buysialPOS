import { DevicePrintRole, Tenant } from './types'

type PrintChannel = 'kitchen' | 'cashier'

const PRINT_STORAGE_PREFIX = 'buysial-print'
const DEVICE_ROLE_STORAGE_PREFIX = 'buysial-device-role'

function getDefaultRole(): DevicePrintRole {
  const rawRole = (process.env.NEXT_PUBLIC_DEVICE_ROLE || 'waiter').trim().toLowerCase()
  if (rawRole === 'kitchen' || rawRole === 'cashier' || rawRole === 'admin') return rawRole
  return 'waiter'
}

function getDeviceRoleKey(tenantId?: string) {
  return `${DEVICE_ROLE_STORAGE_PREFIX}:${tenantId || 'global'}`
}

export function getDevicePrintRole(tenantId?: string): DevicePrintRole {
  if (typeof window !== 'undefined') {
    const tenantRole = window.localStorage.getItem(getDeviceRoleKey(tenantId))
    const globalRole = window.localStorage.getItem(getDeviceRoleKey())
    const resolvedRole = (tenantRole || globalRole || getDefaultRole()).trim().toLowerCase()
    if (resolvedRole === 'kitchen' || resolvedRole === 'cashier' || resolvedRole === 'admin') return resolvedRole
  }
  return getDefaultRole()
}

export function setDevicePrintRole(role: DevicePrintRole, tenantId?: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(getDeviceRoleKey(tenantId), role)
}

export function getPrinterNameForChannel(channel: PrintChannel, tenant: Tenant) {
  return channel === 'kitchen' ? tenant.kitchenPrinterName : tenant.cashierPrinterName
}

export function shouldAutoPrintKitchen(tenant?: Tenant) {
  if (!tenant?.kitchenPrinterEnabled || !tenant.kitchenAutoPrint) return false
  const role = getDevicePrintRole(tenant.id)
  return role === 'kitchen' || role === 'admin'
}

export function shouldAutoPrintCashier(tenant?: Tenant) {
  if (!tenant?.cashierPrinterEnabled || !tenant.cashierAutoPrint) return false
  const role = getDevicePrintRole(tenant.id)
  return role === 'cashier' || role === 'admin'
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
