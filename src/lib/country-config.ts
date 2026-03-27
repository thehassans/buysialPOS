import { CountryCode, CountryConfig } from './types'
import { formatCurrency as formatAmount, getCurrencySymbol } from './utils'

export const COUNTRY_CONFIGS: Record<CountryCode, CountryConfig> = {
  OMN: {
    code: 'OMN',
    name: 'Oman',
    currency: 'OMR',
    currencySymbol: 'ر.ع.',
    vatRate: 0.05,
    locale: 'ar-OM',
    direction: 'rtl',
    dateFormat: 'DD/MM/YYYY',
    supportHijri: false,
    complianceLabel: 'OTA Compliant',
  },
  KSA: {
    code: 'KSA',
    name: 'Saudi Arabia',
    currency: 'SAR',
    currencySymbol: getCurrencySymbol('SAR'),
    vatRate: 0.15,
    locale: 'ar-SA',
    direction: 'rtl',
    dateFormat: 'DD/MM/YYYY',
    supportHijri: true,
    complianceLabel: 'ZATCA Phase 2 Compliant',
  },
  UAE: {
    code: 'UAE',
    name: 'United Arab Emirates',
    currency: 'AED',
    currencySymbol: 'د.إ',
    vatRate: 0.05,
    locale: 'ar-AE',
    direction: 'rtl',
    dateFormat: 'DD/MM/YYYY',
    supportHijri: false,
    complianceLabel: 'FTA Compliant',
  },
}

export class TaxEngine {
  private vatRate: number
  private countryCode: CountryCode

  constructor(countryCode: CountryCode, customVatRate?: number) {
    this.countryCode = countryCode
    this.vatRate = customVatRate ?? COUNTRY_CONFIGS[countryCode].vatRate
  }

  calculate(subtotal: number): { subtotal: number; vatAmount: number; total: number; vatRate: number } {
    const vatAmount = subtotal * this.vatRate
    const total = subtotal + vatAmount
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      vatRate: this.vatRate,
    }
  }

  getVatLabel(): string {
    if (this.countryCode === 'KSA') return 'VAT (15%)'
    if (this.countryCode === 'UAE') return 'VAT (5%)'
    if (this.countryCode === 'OMN') return 'VAT (5%)'
    return `VAT (${(this.vatRate * 100).toFixed(0)}%)`
  }

  getComplianceLabel(): string {
    return COUNTRY_CONFIGS[this.countryCode].complianceLabel
  }

  formatCurrency(amount: number): string {
    const config = COUNTRY_CONFIGS[this.countryCode]
    return formatAmount(amount, config.currency, config.currencySymbol)
  }
}

export function getCountryConfig(code: CountryCode): CountryConfig {
  return COUNTRY_CONFIGS[code]
}

export function generateZATCAQRData(params: {
  sellerName: string
  vatNumber: string
  timestamp: string
  total: number
  vatAmount: number
}): string {
  const tlvData = [
    encodeTLV(1, params.sellerName),
    encodeTLV(2, params.vatNumber),
    encodeTLV(3, params.timestamp),
    encodeTLV(4, params.total.toFixed(2)),
    encodeTLV(5, params.vatAmount.toFixed(2)),
  ].join('')
  return btoa(tlvData)
}

function encodeTLV(tag: number, value: string): string {
  const encoder = new TextEncoder()
  const valueBytes = encoder.encode(value)
  return String.fromCharCode(tag, valueBytes.length, ...Array.from(valueBytes))
}

export function toHijriDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  } catch {
    return date.toLocaleDateString()
  }
}
