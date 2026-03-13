import { AttendanceRecord, InventoryItem, Order } from './types'

export type ReportPeriod = 'today' | 'week' | 'month' | 'year'

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function todayKey(now = new Date()) {
  return startOfDay(now).toISOString().split('T')[0]
}

export function filterOrdersByTenant(orders: Order[], tenantId: string) {
  return orders.filter(order => order.tenantId === tenantId && order.status !== 'cancelled')
}

export function getPeriodStart(period: ReportPeriod, now = new Date()) {
  switch (period) {
    case 'today':
      return startOfDay(now)
    case 'week': {
      const date = startOfDay(now)
      date.setDate(date.getDate() - 6)
      return date
    }
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1)
    case 'year':
      return new Date(now.getFullYear(), 0, 1)
  }
}

export function filterOrdersByPeriod(orders: Order[], period: ReportPeriod, now = new Date()) {
  const start = getPeriodStart(period, now).getTime()
  const end = now.getTime()
  return orders.filter(order => {
    const time = new Date(order.createdAt).getTime()
    return time >= start && time <= end && order.status !== 'cancelled'
  })
}

export function getRevenue(orders: Order[]) {
  return orders.reduce((sum, order) => sum + order.total, 0)
}

export function getAverageOrderValue(orders: Order[]) {
  if (orders.length === 0) return 0
  return getRevenue(orders) / orders.length
}

export function countActiveOrders(orders: Order[]) {
  return orders.filter(order => !['completed', 'cancelled'].includes(order.status)).length
}

export function countLowStockItems(items: InventoryItem[]) {
  return items.filter(item => item.quantity <= item.minQuantity).length
}

export function countPresentStaff(attendance: AttendanceRecord[], now = new Date()) {
  const key = todayKey(now)
  return attendance.filter(record => record.date === key && !record.clockOut).length
}

export function buildTimeSeries(orders: Order[], period: ReportPeriod, now = new Date()) {
  if (period === 'today') {
    const points = Array.from({ length: 24 }, (_, hour) => ({
      label: new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour).toLocaleTimeString([], { hour: 'numeric' }).toLowerCase(),
      orders: 0,
      revenue: 0,
    }))
    for (const order of filterOrdersByPeriod(orders, 'today', now)) {
      const hour = new Date(order.createdAt).getHours()
      points[hour].orders += 1
      points[hour].revenue += order.total
    }
    return points
  }

  if (period === 'week') {
    const start = getPeriodStart('week', now)
    const points = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return {
        key: startOfDay(date).getTime(),
        label: date.toLocaleDateString([], { weekday: 'short' }),
        orders: 0,
        revenue: 0,
      }
    })
    const lookup = new Map(points.map(point => [point.key, point]))
    for (const order of filterOrdersByPeriod(orders, 'week', now)) {
      const key = startOfDay(new Date(order.createdAt)).getTime()
      const point = lookup.get(key)
      if (!point) continue
      point.orders += 1
      point.revenue += order.total
    }
    return points.map(({ key, ...rest }) => rest)
  }

  if (period === 'month') {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const points = Array.from({ length: daysInMonth }, (_, index) => ({
      label: `${index + 1}`,
      orders: 0,
      revenue: 0,
    }))
    for (const order of filterOrdersByPeriod(orders, 'month', now)) {
      const day = new Date(order.createdAt).getDate() - 1
      if (points[day]) {
        points[day].orders += 1
        points[day].revenue += order.total
      }
    }
    return points
  }

  const points = Array.from({ length: 12 }, (_, month) => ({
    label: new Date(now.getFullYear(), month, 1).toLocaleDateString([], { month: 'short' }),
    orders: 0,
    revenue: 0,
  }))
  for (const order of filterOrdersByPeriod(orders, 'year', now)) {
    const month = new Date(order.createdAt).getMonth()
    points[month].orders += 1
    points[month].revenue += order.total
  }
  return points
}

export function buildTopSellingItems(orders: Order[], limit = 5) {
  const totals = new Map<string, { name: string; orders: number; revenue: number }>()
  for (const order of orders) {
    for (const item of order.items) {
      const key = item.menuItemId || item.menuItem?.name || item.id
      const existing = totals.get(key) || {
        name: item.menuItem?.name || 'Unknown Item',
        orders: 0,
        revenue: 0,
      }
      existing.orders += item.quantity
      existing.revenue += item.quantity * item.unitPrice
      totals.set(key, existing)
    }
  }
  return Array.from(totals.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

export function buildOrderStatusSeries(orders: Order[]) {
  const buckets = [
    { name: 'Pending', value: 0, color: '#f59e0b', statuses: ['pending'] },
    { name: 'Preparing', value: 0, color: '#3b82f6', statuses: ['preparing'] },
    { name: 'Ready', value: 0, color: '#10b981', statuses: ['ready'] },
    { name: 'Served', value: 0, color: '#8b5cf6', statuses: ['served', 'completed'] },
  ]
  for (const order of orders) {
    const bucket = buckets.find(entry => entry.statuses.includes(order.status))
    if (bucket) bucket.value += 1
  }
  return buckets
}

export function buildRecentTrend(orders: Order[], days = 7, now = new Date()) {
  const start = startOfDay(new Date(now.getTime() - (days - 1) * DAY_MS))
  const points = Array.from({ length: days }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return {
      key: startOfDay(date).getTime(),
      day: date.toLocaleDateString([], { weekday: 'short' }),
      orders: 0,
      revenue: 0,
    }
  })
  const lookup = new Map(points.map(point => [point.key, point]))
  for (const order of orders) {
    const key = startOfDay(new Date(order.createdAt)).getTime()
    const point = lookup.get(key)
    if (!point) continue
    point.orders += 1
    point.revenue += order.total
  }
  return points.map(({ key, ...rest }) => rest)
}
