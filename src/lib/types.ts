export type CountryCode = 'KSA' | 'UAE' | 'OMN'
export type Currency = 'SAR' | 'AED' | 'OMR'
export type UserRole = 'super_admin' | 'admin' | 'manager' | 'cashier' | 'waiter' | 'chef'
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'
export type OrderType = 'dine_in' | 'takeaway'
export type MenuPortion = 'full' | 'half'
export type Language = 'en' | 'ar'
export type Theme = 'dark' | 'light'
export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise'

export interface CountryConfig {
  code: CountryCode
  name: string
  currency: Currency
  currencySymbol: string
  vatRate: number
  locale: string
  direction: 'ltr' | 'rtl'
  dateFormat: string
  supportHijri: boolean
  complianceLabel: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  logo?: string
  countryCode: CountryCode
  currency: Currency
  vatRate: number
  vatNumber?: string
  address: string
  phone: string
  email: string
  subscriptionPlan: SubscriptionPlan
  isActive: boolean
  createdAt: Date
  validUntil?: Date
  invoiceFooter?: string
  primaryColor?: string
  adminPassword?: string
}

export interface User {
  id: string
  tenantId: string
  name: string
  email: string
  password?: string
  role: UserRole
  language: Language
  avatar?: string
  isActive: boolean
  hourlyRate?: number
  createdAt: Date
}

export interface Category {
  id: string
  tenantId: string
  name: string
  nameAr?: string
  icon?: string
  sortOrder: number
  isActive: boolean
}

export interface MenuItem {
  id: string
  tenantId: string
  categoryId: string
  name: string
  nameAr?: string
  description?: string
  descriptionAr?: string
  price: number
  hasHalfPlate?: boolean
  halfPlatePrice?: number
  image?: string
  isAvailable: boolean
  preparationTime?: number
  calories?: number
  allergens?: string[]
  isPopular?: boolean
  isNew?: boolean
}

export interface OrderItem {
  id: string
  menuItemId: string
  menuItem: MenuItem
  portionType?: MenuPortion
  quantity: number
  unitPrice: number
  notes?: string
  status: 'pending' | 'preparing' | 'ready'
}

export interface Order {
  id: string
  tenantId: string
  tableNumber?: number
  waiterId?: string
  cashierId?: string
  items: OrderItem[]
  status: OrderStatus
  subtotal: number
  vatRate: number
  vatAmount: number
  total: number
  paymentMethod?: 'cash' | 'card' | 'digital'
  isPaid: boolean
  createdAt: Date
  updatedAt: Date
  notes?: string
  invoiceNumber?: string
  isQrOrder?: boolean
  customerName?: string
  customerPhone?: string
  orderType?: OrderType
}

export interface Table {
  id: string
  tenantId: string
  number: number
  capacity: number
  isOccupied: boolean
  currentOrderId?: string
  section?: string
}

export interface InventoryItem {
  id: string
  tenantId: string
  name: string
  nameAr?: string
  unit: string
  quantity: number
  minQuantity: number
  costPerUnit: number
  supplierId?: string
  category: string
  lastRestocked?: Date
}

export interface Supplier {
  id: string
  tenantId: string
  name: string
  contact: string
  email?: string
  phone: string
  address?: string
  category: string
}

export interface AttendanceRecord {
  id: string
  tenantId: string
  userId: string
  user?: User
  clockIn: Date
  clockOut?: Date
  hoursWorked?: number
  date: string
}

export interface PayrollEntry {
  id: string
  tenantId: string
  userId: string
  user?: User
  periodStart: Date
  periodEnd: Date
  hoursWorked: number
  hourlyRate: number
  grossPay: number
  deductions: number
  netPay: number
  isPaid: boolean
}

export interface SubscriptionPlanConfig {
  id: SubscriptionPlan
  name: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  maxUsers: number
  maxTables: number
  isPopular?: boolean
}

export interface DashboardStats {
  todayRevenue: number
  todayOrders: number
  activeOrders: number
  lowStockItems: number
  staffPresent: number
  averageOrderValue: number
}

export interface KDSOrder {
  orderId: string
  tableNumber?: number
  items: OrderItem[]
  status: OrderStatus
  createdAt: Date
  priority: 'normal' | 'high' | 'urgent'
  elapsedMinutes: number
}
