'use client'

import {
  TrendingUp, ShoppingCart, Package, Users, AlertTriangle,
  DollarSign, Clock, CheckCircle, ArrowUpRight, ChefHat
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { useAppStore } from '@/store/app-store'
import { MOCK_ORDERS, MOCK_INVENTORY, MOCK_ATTENDANCE, REVENUE_DATA } from '@/lib/mock-data'
import { TaxEngine } from '@/lib/country-config'
import { cn } from '@/lib/utils'

const WEEKLY_DATA = [
  { day: 'Mon', orders: 42, revenue: 8420 },
  { day: 'Tue', orders: 38, revenue: 7600 },
  { day: 'Wed', orders: 51, revenue: 10200 },
  { day: 'Thu', orders: 47, revenue: 9400 },
  { day: 'Fri', orders: 68, revenue: 13600 },
  { day: 'Sat', orders: 85, revenue: 17000 },
  { day: 'Sun', orders: 72, revenue: 14400 },
]

const CATEGORY_SALES = [
  { name: 'Grills', value: 38, color: '#f59e0b' },
  { name: 'Main Course', value: 28, color: '#10b981' },
  { name: 'Seafood', value: 18, color: '#3b82f6' },
  { name: 'Beverages', value: 10, color: '#8b5cf6' },
  { name: 'Desserts', value: 6, color: '#ec4899' },
]

export default function AdminDashboard() {
  const { currentTenant, orders } = useAppStore()
  if (!currentTenant) return null
  const taxEngine = new TaxEngine(currentTenant.countryCode, currentTenant.vatRate)

  const activeOrders = orders.filter(o => !o.isPaid && o.status !== 'cancelled')
  const todayRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const lowStockItems = MOCK_INVENTORY.filter(i => i.quantity <= i.minQuantity)

  const statsCards = [
    {
      label: 'Today Revenue',
      value: taxEngine.formatCurrency(todayRevenue),
      sub: `+12.5% vs yesterday`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200',
      trend: 'up',
    },
    {
      label: 'Active Orders',
      value: activeOrders.length,
      sub: `${activeOrders.filter(o => o.status === 'preparing').length} being prepared`,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-200',
      trend: 'up',
    },
    {
      label: 'Low Stock Alerts',
      value: lowStockItems.length,
      sub: 'Items below minimum',
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50 border-red-200',
      trend: 'warn',
    },
    {
      label: 'Staff Present',
      value: MOCK_ATTENDANCE.length,
      sub: `${MOCK_ATTENDANCE.length}/6 staff clocked in`,
      icon: Users,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200',
      trend: 'neutral',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'} 👋
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {currentTenant.name} · {currentTenant.countryCode === 'KSA' ? '🇸🇦' : '🇦🇪'} {taxEngine.getComplianceLabel()}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white rounded-xl px-3 py-2 border border-gray-200 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live · {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map(card => (
          <div key={card.label} className={cn('bg-white rounded-2xl p-5 border shadow-sm', card.bg)}>
            <div className="flex items-start justify-between mb-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', card.bg)}>
                <card.icon className={cn('w-4 h-4', card.color)} />
              </div>
              {card.trend === 'up' && <ArrowUpRight className="w-3 h-3 text-emerald-500" />}
              {card.trend === 'warn' && <AlertTriangle className="w-3 h-3 text-red-500" />}
            </div>
            <div className="text-2xl font-black text-gray-900 mb-1">{card.value}</div>
            <div className="text-gray-700 text-xs font-medium">{card.label}</div>
            <div className="text-slate-400 text-xs mt-1">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-gray-900 font-semibold mb-4">Weekly Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={WEEKLY_DATA} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
              <YAxis yAxisId="orders" orientation="left" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
              <YAxis yAxisId="revenue" orientation="right" tick={{ fill: '#d97706', fontSize: 10 }} tickFormatter={v => `${currentTenant.currency === 'SAR' ? 'ر.س' : 'د.إ'}${(v/1000).toFixed(0)}k`} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                labelStyle={{ color: '#0f172a' }}
              />
              <Bar yAxisId="orders" dataKey="orders" fill="#10b981" radius={[6, 6, 0, 0]} opacity={0.8} />
              <Bar yAxisId="revenue" dataKey="revenue" fill="#f59e0b" radius={[6, 6, 0, 0]} opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-2 h-2 rounded-full bg-emerald-500" />Orders</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500"><div className="w-2 h-2 rounded-full bg-amber-500" />Revenue</div>
          </div>
        </div>

        {/* Category Sales Pie */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-gray-900 font-semibold mb-4">Sales by Category</h3>
          <div className="flex justify-center">
            <PieChart width={160} height={160}>
              <Pie data={CATEGORY_SALES} cx={75} cy={75} innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {CATEGORY_SALES.map((entry, i) => (
                  <Cell key={i} fill={entry.color} opacity={0.85} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
            </PieChart>
          </div>
          <div className="space-y-2 mt-2">
            {CATEGORY_SALES.map(cat => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-600">{cat.name}</span>
                </div>
                <span className="text-gray-900 font-medium">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Orders & Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Orders */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 font-semibold">Live Orders</h3>
            <div className="flex items-center gap-1 text-xs text-emerald-600">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Real-time
            </div>
          </div>
          <div className="space-y-3">
            {orders.slice(0, 4).map(order => {
              const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
              return (
                <div key={order.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                    order.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-amber-100 text-amber-700'
                  )}>
                    {order.tableNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-900 text-xs font-medium">{order.invoiceNumber}</div>
                    <div className="text-slate-500 text-xs">{order.items.length} items · {elapsed}m ago</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-900 text-xs font-bold">{taxEngine.formatCurrency(order.total)}</div>
                    <div className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full mt-0.5',
                      order.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-amber-100 text-amber-700'
                    )}>
                      {order.status}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 font-semibold">Stock Alerts</h3>
            <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full border border-red-200">
              {lowStockItems.length} low
            </span>
          </div>
          <div className="space-y-3">
            {MOCK_INVENTORY.map(item => {
              const pct = Math.min(100, (item.quantity / item.minQuantity) * 100)
              const isLow = item.quantity <= item.minQuantity
              return (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn('font-medium', isLow ? 'text-red-600' : 'text-gray-700')}>
                      {isLow && '⚠️ '}{item.name}
                    </span>
                    <span className="text-slate-500">{item.quantity} {item.unit} / min {item.minQuantity}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', isLow ? 'bg-red-500' : 'bg-emerald-500')}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
