'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { REVENUE_DATA } from '@/lib/mock-data'
import { TaxEngine } from '@/lib/country-config'
import { cn } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts'
import { TrendingUp, Download, Calendar, DollarSign, ShoppingCart, Users } from 'lucide-react'

const DAILY_DATA = [
  { time: '9am', orders: 8, revenue: 1840 },
  { time: '10am', orders: 14, revenue: 3220 },
  { time: '11am', orders: 22, revenue: 5060 },
  { time: '12pm', orders: 45, revenue: 10350 },
  { time: '1pm', orders: 52, revenue: 11960 },
  { time: '2pm', orders: 38, revenue: 8740 },
  { time: '3pm', orders: 28, revenue: 6440 },
  { time: '4pm', orders: 20, revenue: 4600 },
  { time: '5pm', orders: 30, revenue: 6900 },
  { time: '6pm', orders: 48, revenue: 11040 },
  { time: '7pm', orders: 65, revenue: 14950 },
  { time: '8pm', orders: 58, revenue: 13340 },
  { time: '9pm', orders: 42, revenue: 9660 },
]

const TOP_ITEMS = [
  { name: 'Mixed Grill', orders: 284, revenue: 41180 },
  { name: 'Lamb Ouzi', orders: 156, revenue: 28860 },
  { name: 'Chicken Mandi', orders: 312, revenue: 29640 },
  { name: 'Fresh Lemon Mint', orders: 520, revenue: 11440 },
  { name: 'Hummus Platter', orders: 445, revenue: 15575 },
]

export default function ReportsModule() {
  const { currentTenant, orders } = useAppStore()
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month')

  if (!currentTenant) return null
  const taxEngine = new TaxEngine(currentTenant.countryCode, currentTenant.vatRate)

  const totalRevenue = REVENUE_DATA.reduce((s, d) => s + d.revenue, 0)
  const totalOrders = REVENUE_DATA.reduce((s, d) => s + d.orders, 0)
  const avgOrderValue = totalRevenue / totalOrders

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Analytics & Reports</h2>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-white rounded-xl shadow-sm p-1 border border-gray-200">
            {(['today', 'week', 'month', 'year'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
                  period === p ? 'bg-emerald-700 text-white' : 'text-emerald-500 hover:text-emerald-700'
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-sm text-xs text-emerald-600 border border-gray-200 hover:text-emerald-700 transition-all">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: taxEngine.formatCurrency(totalRevenue), icon: DollarSign, color: 'text-emerald-600', change: '+18.4%' },
          { label: 'Total Orders', value: totalOrders.toLocaleString(), icon: ShoppingCart, color: 'text-blue-600', change: '+12.1%' },
          { label: 'Avg Order Value', value: taxEngine.formatCurrency(avgOrderValue), icon: TrendingUp, color: 'text-amber-600', change: '+5.7%' },
          { label: 'Customer Satisfaction', value: '4.8 / 5.0', icon: Users, color: 'text-purple-600', change: '+0.2' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <kpi.icon className={cn('w-5 h-5', kpi.color)} />
              <span className="text-xs text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full">{kpi.change}</span>
            </div>
            <div className="text-xl font-black text-gray-900">{kpi.value}</div>
            <div className="text-emerald-600 text-xs mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-gray-900 font-semibold mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={REVENUE_DATA}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                labelStyle={{ color: '#0f172a' }}
                formatter={(v: number) => [taxEngine.formatCurrency(v), 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#areaGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Orders */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-gray-900 font-semibold mb-4">Today's Order Flow</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={DAILY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} labelStyle={{ color: '#0f172a' }} />
              <Line type="monotone" dataKey="orders" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Items */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-gray-900 font-semibold mb-4">Top Selling Items</h3>
        <div className="space-y-3">
          {TOP_ITEMS.map((item, idx) => {
            const maxRevenue = Math.max(...TOP_ITEMS.map(i => i.revenue))
            const pct = (item.revenue / maxRevenue) * 100
            return (
              <div key={item.name} className="flex items-center gap-4">
                <span className="text-emerald-700 text-sm font-bold w-5">{idx + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-900 text-sm font-medium">{item.name}</span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-emerald-500">{item.orders} orders</span>
                      <span className="text-gray-900 font-bold">{taxEngine.formatCurrency(item.revenue)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
