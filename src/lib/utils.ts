import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Currency } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeHexColor(color?: string, fallback = '#059669') {
  const value = String(color || '').trim()
  const hex = value.startsWith('#') ? value.slice(1) : value
  if (!/^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(hex)) return fallback
  if (hex.length === 3) {
    return `#${hex.split('').map(character => `${character}${character}`).join('')}`.toLowerCase()
  }
  return `#${hex}`.toLowerCase()
}

export function hexToRgb(color?: string) {
  const normalized = normalizeHexColor(color)
  const value = normalized.slice(1)
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  }
}

export function withAlpha(color: string | undefined, alpha: number) {
  const { r, g, b } = hexToRgb(color)
  const clamped = Math.min(Math.max(alpha, 0), 1)
  return `rgba(${r}, ${g}, ${b}, ${clamped})`
}

export function mixHexColors(base: string | undefined, mixWith: string, weight = 0.5) {
  const baseRgb = hexToRgb(base)
  const mixRgb = hexToRgb(mixWith)
  const mixRatio = Math.min(Math.max(weight, 0), 1)
  const toHex = (value: number) => Math.round(value).toString(16).padStart(2, '0')
  return `#${toHex(baseRgb.r * (1 - mixRatio) + mixRgb.r * mixRatio)}${toHex(baseRgb.g * (1 - mixRatio) + mixRgb.g * mixRatio)}${toHex(baseRgb.b * (1 - mixRatio) + mixRgb.b * mixRatio)}`
}

export function getReadableTextColor(color?: string) {
  const { r, g, b } = hexToRgb(color)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.65 ? '#0f172a' : '#ffffff'
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  SAR: '\u20C1',
  AED: 'د.إ',
  OMR: 'ر.ع.',
}

export function getCurrencySymbol(currency: Currency | string): string {
  return CURRENCY_SYMBOLS[currency as Currency] || currency
}

export function formatCurrency(amount: number, currency: Currency | string, symbol: string = getCurrencySymbol(currency)): string {
  return `${symbol} ${amount.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(date: Date, format: string = 'DD/MM/YYYY'): string {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', String(year))
    .replace('HH', hours)
    .replace('mm', mins)
}

export function generateInvoiceNumber(prefix: string = 'INV'): string {
  const date = new Date()
  const year = date.getFullYear()
  const random = Math.floor(Math.random() * 9000) + 1000
  return `${prefix}-${year}-${random}`
}

export function getElapsedMinutes(date: Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / 60000)
}

export function getOrderPriority(elapsedMinutes: number): 'normal' | 'high' | 'urgent' {
  if (elapsedMinutes > 30) return 'urgent'
  if (elapsedMinutes > 15) return 'high'
  return 'normal'
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Restaurant Owner',
  manager: 'Manager',
  cashier: 'Cashier',
  waiter: 'Waiter',
  chef: 'Chef',
}

export const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-50 text-purple-700 border-purple-200',
  admin: 'bg-amber-50 text-amber-700 border-amber-200',
  manager: 'bg-blue-50 text-blue-700 border-blue-200',
  cashier: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  waiter: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  chef: 'bg-red-50 text-red-700 border-red-200',
}
