'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { TaxEngine } from '@/lib/country-config'
import { cn } from '@/lib/utils'
import { ReportPeriod, buildTimeSeries, buildTopSellingItems, countActiveOrders, filterOrdersByPeriod, filterOrdersByTenant, getAverageOrderValue, getRevenue } from '@/lib/analytics'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts'
import { TrendingUp, Download, DollarSign, ShoppingCart, Clock } from 'lucide-react'

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
}

export default function ReportsModule() {
  const { currentTenant, orders } = useAppStore()
  const [period, setPeriod] = useState<ReportPeriod>('month')

  if (!currentTenant) return null
  const taxEngine = new TaxEngine(currentTenant.countryCode, currentTenant.vatRate)
  const tenantOrders = filterOrdersByTenant(orders, currentTenant.id)
  const scopedOrders = filterOrdersByPeriod(tenantOrders, period)
  const chartData = buildTimeSeries(tenantOrders, period)
  const topItems = buildTopSellingItems(scopedOrders)

  const totalRevenue = getRevenue(scopedOrders)
  const totalOrders = scopedOrders.length
  const avgOrderValue = getAverageOrderValue(scopedOrders)
  const activeOrders = countActiveOrders(scopedOrders)
  const maxRevenue = topItems.length > 0 ? Math.max(...topItems.map(item => item.revenue)) : 1

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
          { label: `${PERIOD_LABELS[period]} Revenue`, value: taxEngine.formatCurrency(totalRevenue), icon: DollarSign, color: 'text-emerald-600' },
          { label: `${PERIOD_LABELS[period]} Orders`, value: totalOrders.toLocaleString(), icon: ShoppingCart, color: 'text-blue-600' },
          { label: 'Avg Order Value', value: taxEngine.formatCurrency(avgOrderValue), icon: TrendingUp, color: 'text-amber-600' },
          { label: 'Open Orders', value: activeOrders.toLocaleString(), icon: Clock, color: 'text-purple-600' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <kpi.icon className={cn('w-5 h-5', kpi.color)} />
              <span className="text-xs text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full">{PERIOD_LABELS[period]}</span>
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
          <h3 className="text-gray-900 font-semibold mb-4">{PERIOD_LABELS[period]} Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} />
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
          <h3 className="text-gray-900 font-semibold mb-4">{PERIOD_LABELS[period]} Order Flow</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} />
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
          {topItems.length > 0 ? topItems.map((item, idx) => {
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
          }) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              No sales data available for {PERIOD_LABELS[period].toLowerCase()}.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
