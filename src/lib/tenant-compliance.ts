import { CountryCode } from './types'

export interface TenantComplianceSettings {
  complianceActive: boolean
  featureToggles: Record<string, boolean>
}

const STORAGE_KEY = 'buysial-tenant-compliance-settings'

function readComplianceStore(): Record<string, TenantComplianceSettings> {
  if (typeof window === 'undefined') return {}
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeComplianceStore(store: Record<string, TenantComplianceSettings>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function getTenantComplianceSettings(tenantId: string): Partial<TenantComplianceSettings> {
  return readComplianceStore()[tenantId] || {}
}

export function setTenantComplianceSettings(tenantId: string, settings: TenantComplianceSettings) {
  const store = readComplianceStore()
  store[tenantId] = settings
  writeComplianceStore(store)
}

export function isTenantInvoiceQrEnabled(tenantId: string, countryCode: CountryCode) {
  if (countryCode !== 'KSA') return false
  const settings = getTenantComplianceSettings(tenantId)
  if (settings.complianceActive === false) return false
  if (settings.featureToggles?.qrCode === false) return false
  return true
}
