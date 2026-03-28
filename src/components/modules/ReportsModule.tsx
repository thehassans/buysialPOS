'use client'

import { useMemo, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { TaxEngine } from '@/lib/country-config'
import { cn, mixHexColors, normalizeHexColor, withAlpha } from '@/lib/utils'
import { ReportPeriod, buildOrderStatusSeries, buildTimeSeries, buildTopSellingItems, countActiveOrders, countLowStockItems, countPresentStaff, filterOrdersByPeriod, filterOrdersByTenant, getAverageOrderValue, getRevenue } from '@/lib/analytics'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts'
import { AlertTriangle, Clock, CreditCard, DollarSign, Download, QrCode, Receipt, ShoppingCart, TrendingUp, Users, Wallet } from 'lucide-react'

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
}

function escapeCsv(value: string | number | boolean) {
  return `"${String(value).replace(/"/g, '""')}"`
}

export default function ReportsModule() {
  const { currentTenant, orders, inventoryItems, attendance } = useAppStore()
  const [period, setPeriod] = useState<ReportPeriod>('month')

  const tenantId = currentTenant?.id || ''
  const tenantOrders = tenantId ? filterOrdersByTenant(orders, tenantId) : []
  const scopedOrders = filterOrdersByPeriod(tenantOrders, period)
  const chartData = buildTimeSeries(tenantOrders, period)
  const topItems = buildTopSellingItems(scopedOrders, 6)
  const tenantInventory = tenantId ? inventoryItems.filter(item => item.tenantId === tenantId) : []
  const tenantAttendance = tenantId ? attendance.filter(record => record.tenantId === tenantId) : []
  const statusSeries = buildOrderStatusSeries(scopedOrders)

  const totalRevenue = getRevenue(scopedOrders)
  const netSales = scopedOrders.reduce((sum, order) => sum + order.subtotal, 0)
  const totalVat = scopedOrders.reduce((sum, order) => sum + order.vatAmount, 0)
  const totalOrders = scopedOrders.length
  const avgOrderValue = getAverageOrderValue(scopedOrders)
  const activeOrders = countActiveOrders(scopedOrders)
  const maxRevenue = topItems.length > 0 ? Math.max(...topItems.map(item => item.revenue)) : 1
  const lowStockCount = countLowStockItems(tenantInventory)
  const presentStaff = countPresentStaff(tenantAttendance)
  const paidRevenue = getRevenue(scopedOrders.filter(order => order.isPaid))
  const qrOrders = scopedOrders.filter(order => order.isQrOrder).length
  const takeawayOrders = scopedOrders.filter(order => order.orderType === 'takeaway').length
  const dineInOrders = scopedOrders.filter(order => order.orderType === 'dine_in').length
  const completionRate = totalOrders > 0
    ? Math.round((scopedOrders.filter(order => ['served', 'completed'].includes(order.status)).length / totalOrders) * 100)
    : 0
  const itemsPerOrder = totalOrders > 0
    ? scopedOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0) / totalOrders
    : 0
  const recentOrders = [...scopedOrders]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 8)
  const paymentBreakdown = useMemo(() => {
    const paymentMap = new Map<string, { label: string; orders: number; revenue: number }>()
    for (const order of scopedOrders) {
      const key = order.paymentMethod || 'unknown'
      const existing = paymentMap.get(key) || {
        label: key === 'cash' ? 'Cash' : key === 'card' ? 'Card' : key === 'digital' ? 'Digital' : 'Unspecified',
        orders: 0,
        revenue: 0,
      }
      existing.orders += 1
      existing.revenue += order.total
      paymentMap.set(key, existing)
    }
    return Array.from(paymentMap.values()).sort((left, right) => right.revenue - left.revenue)
  }, [scopedOrders])
  const peakRevenuePoint = chartData.reduce((best, current) => current.revenue > best.revenue ? current : best, chartData[0] || { label: '-', revenue: 0, orders: 0 })
  const peakOrderPoint = chartData.reduce((best, current) => current.orders > best.orders ? current : best, chartData[0] || { label: '-', revenue: 0, orders: 0 })
  const periodLabel = PERIOD_LABELS[period]

  if (!currentTenant) return null
  const taxEngine = new TaxEngine(currentTenant.countryCode, currentTenant.vatRate)
  const brandColor = normalizeHexColor(currentTenant.primaryColor)
  const navigationColor = normalizeHexColor(currentTenant.secondaryColor || mixHexColors(brandColor, '#0f172a', 0.35), '#0f766e')

  const handleExport = () => {
    const rows = [
      ['Section', 'Metric', 'Value'],
      ['Overview', 'Period', periodLabel],
      ['Overview', 'Gross Revenue', taxEngine.formatCurrency(totalRevenue)],
      ['Overview', 'Net Sales', taxEngine.formatCurrency(netSales)],
      ['Overview', taxEngine.getVatLabel(), taxEngine.formatCurrency(totalVat)],
      ['Overview', 'Orders', totalOrders],
      ['Overview', 'Average Order Value', taxEngine.formatCurrency(avgOrderValue)],
      ['Overview', 'Open Orders', activeOrders],
      ['Operations', 'Paid Revenue', taxEngine.formatCurrency(paidRevenue)],
      ['Operations', 'QR Orders', qrOrders],
      ['Operations', 'Staff On Shift', presentStaff],
      ['Operations', 'Low Stock Items', lowStockCount],
      ['Operations', 'Completion Rate', `${completionRate}%`],
      ['Operations', 'Average Items Per Order', itemsPerOrder.toFixed(1)],
      ['Peaks', 'Peak Revenue Point', `${peakRevenuePoint.label} (${taxEngine.formatCurrency(peakRevenuePoint.revenue)})`],
      ['Peaks', 'Peak Order Point', `${peakOrderPoint.label} (${peakOrderPoint.orders} orders)`],
      ['Channel Mix', 'Dine In Orders', dineInOrders],
      ['Channel Mix', 'Takeaway Orders', takeawayOrders],
      ['Channel Mix', 'QR Orders', qrOrders],
      [],
      ['Recent Orders', 'Invoice', 'Status', 'Type', 'Payment', 'Paid', 'Total', 'Created'],
      ...recentOrders.map(order => [
        'Recent Orders',
        order.invoiceNumber || order.id,
        order.status,
        order.orderType || 'unspecified',
        order.paymentMethod || 'unspecified',
        order.isPaid ? 'Yes' : 'No',
        taxEngine.formatCurrency(order.total),
        new Date(order.createdAt).toLocaleString(),
      ]),
    ]
    const csvContent = rows
      .map(row => row.length > 0 ? row.map(value => escapeCsv(value)).join(',') : '')
      .join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${currentTenant.slug}-${period}-report.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600 mb-2">Integrated business report</div>
          <h2 className="text-xl font-bold text-gray-900">Analytics & Reports</h2>
          <p className="text-sm text-slate-500 mt-1">Revenue, tax, payment channels, order flow, stock alerts, and live operations for {currentTenant.name} in one place.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 bg-white rounded-xl shadow-sm p-1 border border-gray-200">
            {(['today', 'week', 'month', 'year'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
                  period === p ? 'text-white shadow-sm' : 'text-emerald-500 hover:text-emerald-700'
                )}
                style={period === p ? { background: `linear-gradient(135deg, ${brandColor} 0%, ${navigationColor} 100%)` } : undefined}
              >
                {p}
              </button>
            ))}
          </div>
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-sm text-xs text-emerald-600 border border-gray-200 hover:text-emerald-700 transition-all">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
        {[
          { label: `${periodLabel} Revenue`, value: taxEngine.formatCurrency(totalRevenue), icon: DollarSign, color: '#059669', tone: 'Revenue captured across all completed and active orders.' },
          { label: 'Net Sales', value: taxEngine.formatCurrency(netSales), icon: Receipt, color: '#0f766e', tone: 'Subtotal before VAT collection for the selected period.' },
          { label: taxEngine.getVatLabel(), value: taxEngine.formatCurrency(totalVat), icon: Wallet, color: '#0ea5e9', tone: 'Collected VAT aligned with your configured tax engine.' },
          { label: `${periodLabel} Orders`, value: totalOrders.toLocaleString(), icon: ShoppingCart, color: '#2563eb', tone: 'Total order count for the selected reporting window.' },
          { label: 'Avg Order Value', value: taxEngine.formatCurrency(avgOrderValue), icon: TrendingUp, color: '#d97706', tone: 'Average basket size per order in the period.' },
          { label: 'Open Orders', value: activeOrders.toLocaleString(), icon: Clock, color: '#7c3aed', tone: 'Orders still in progress and awaiting completion.' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: withAlpha(kpi.color, 0.12) }}>
                <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
              </div>
              <span className="text-xs text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full">{periodLabel}</span>
            </div>
            <div className="text-xl font-black text-gray-900">{kpi.value}</div>
            <div className="text-emerald-600 text-xs mt-1">{kpi.label}</div>
            <div className="text-[11px] text-slate-500 mt-2 leading-5">{kpi.tone}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Paid Revenue', value: taxEngine.formatCurrency(paidRevenue), icon: CreditCard, color: '#0f766e', note: 'Revenue already settled and fully paid.' },
          { label: 'QR Orders', value: qrOrders.toLocaleString(), icon: QrCode, color: '#7c3aed', note: 'Orders placed directly from customer QR usage.' },
          { label: 'Staff On Shift', value: presentStaff.toLocaleString(), icon: Users, color: '#2563eb', note: 'Currently clocked-in staff members today.' },
          { label: 'Low Stock Items', value: lowStockCount.toLocaleString(), icon: AlertTriangle, color: '#dc2626', note: 'Inventory items at or below their minimum level.' },
        ].map(metric => (
          <div key={metric.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Operations</div>
                <div className="text-lg font-black text-slate-900 mt-2">{metric.value}</div>
              </div>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: withAlpha(metric.color, 0.12) }}>
                <metric.icon className="w-5 h-5" style={{ color: metric.color }} />
              </div>
            </div>
            <div className="text-sm font-semibold text-slate-900 mt-3">{metric.label}</div>
            <div className="text-[11px] text-slate-500 mt-1 leading-5">{metric.note}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-gray-900 font-semibold">{periodLabel} Revenue Trend</h3>
              <div className="text-xs text-slate-500 mt-1">Peak point: {peakRevenuePoint.label} • {taxEngine.formatCurrency(peakRevenuePoint.revenue)}</div>
            </div>
            <div className="rounded-full px-3 py-1 text-[11px] font-semibold" style={{ backgroundColor: withAlpha(brandColor, 0.12), color: brandColor }}>
              Gross revenue
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={brandColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={brandColor} stopOpacity={0} />
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
              <Area type="monotone" dataKey="revenue" stroke={brandColor} fill="url(#areaGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Orders */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-gray-900 font-semibold">{periodLabel} Order Flow</h3>
              <div className="text-xs text-slate-500 mt-1">Busiest point: {peakOrderPoint.label} • {peakOrderPoint.orders} orders</div>
            </div>
            <div className="rounded-full px-3 py-1 text-[11px] font-semibold" style={{ backgroundColor: withAlpha(navigationColor, 0.12), color: navigationColor }}>
              Order throughput
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }} labelStyle={{ color: '#0f172a' }} />
              <Line type="monotone" dataKey="orders" stroke={navigationColor} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Items */}
      <div className="grid xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)_minmax(0,0.9fr)] gap-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-gray-900 font-semibold">Top Selling Items</h3>
              <div className="text-xs text-slate-500 mt-1">Best performing products by revenue in {periodLabel.toLowerCase()}.</div>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-100">
              {topItems.length} tracked
            </div>
          </div>
          <div className="space-y-3">
            {topItems.length > 0 ? topItems.map((item, idx) => {
              const pct = (item.revenue / maxRevenue) * 100
              return (
                <div key={item.name} className="flex items-center gap-4">
                  <span className="text-emerald-700 text-sm font-bold w-5">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1 gap-3">
                      <span className="text-gray-900 text-sm font-medium truncate">{item.name}</span>
                      <div className="flex items-center gap-4 text-xs flex-shrink-0">
                        <span className="text-emerald-500">{item.orders} orders</span>
                        <span className="text-gray-900 font-bold">{taxEngine.formatCurrency(item.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${brandColor} 0%, ${mixHexColors(brandColor, '#ffffff', 0.28)} 100%)` }}
                      />
                    </div>
                  </div>
                </div>
              )
            }) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                No sales data available for {periodLabel.toLowerCase()}.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <div className="mb-4">
            <h3 className="text-gray-900 font-semibold">Order Status Breakdown</h3>
            <div className="text-xs text-slate-500 mt-1">Track live demand and service execution by order status.</div>
          </div>
          <div className="space-y-4">
            {statusSeries.map(status => {
              const percentage = totalOrders > 0 ? (status.value / totalOrders) * 100 : 0
              return (
                <div key={status.name}>
                  <div className="flex items-center justify-between gap-3 text-sm mb-2">
                    <span className="font-medium text-slate-900">{status.name}</span>
                    <span className="text-slate-500">{status.value} • {percentage.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: status.color }} />
                  </div>
                </div>
              )
            })}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 mt-2">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">Completion rate</div>
              <div className="text-2xl font-black text-slate-900 mt-2">{completionRate}%</div>
              <div className="text-xs text-slate-500 mt-1">Based on served and completed orders in this reporting window.</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 space-y-5">
          <div>
            <h3 className="text-gray-900 font-semibold">Integrated Snapshot</h3>
            <div className="text-xs text-slate-500 mt-1">Payments, order channels, and service mix combined in one operational summary.</div>
          </div>
          <div className="space-y-3">
            {paymentBreakdown.length > 0 ? paymentBreakdown.map(payment => {
              const percentage = totalRevenue > 0 ? (payment.revenue / totalRevenue) * 100 : 0
              return (
                <div key={payment.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-900">{payment.label}</span>
                    <span className="text-slate-500">{payment.orders} orders</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span>{taxEngine.formatCurrency(payment.revenue)}</span>
                    <span>{percentage.toFixed(0)}% of revenue</span>
                  </div>
                </div>
              )
            }) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No payment data available for this period yet.
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">Dine in</div>
              <div className="text-2xl font-black text-slate-900 mt-2">{dineInOrders}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">Takeaway</div>
              <div className="text-2xl font-black text-slate-900 mt-2">{takeawayOrders}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">Items / order</div>
              <div className="text-2xl font-black text-slate-900 mt-2">{itemsPerOrder.toFixed(1)}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">QR mix</div>
              <div className="text-2xl font-black text-slate-900 mt-2">{totalOrders > 0 ? Math.round((qrOrders / totalOrders) * 100) : 0}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div>
            <h3 className="text-gray-900 font-semibold">Recent Orders</h3>
            <div className="text-xs text-slate-500 mt-1">Latest order activity with payment and service context for the selected period.</div>
          </div>
          <div className="rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600">
            {recentOrders.length} entries shown
          </div>
        </div>
        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="py-3 pr-4 font-medium">Invoice</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 font-medium">Channel</th>
                  <th className="py-3 pr-4 font-medium">Payment</th>
                  <th className="py-3 pr-4 font-medium">Total</th>
                  <th className="py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} className="border-b border-slate-100/80 last:border-0">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-slate-900">{order.invoiceNumber || order.id}</div>
                      <div className="text-xs text-slate-500 mt-1">{order.customerName || `Table ${order.tableNumber || '—'}`}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 capitalize">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600 capitalize">{order.orderType || 'unspecified'}{order.isQrOrder ? ' • QR' : ''}</td>
                    <td className="py-3 pr-4 text-slate-600 capitalize">{order.paymentMethod || 'unspecified'}{order.isPaid ? ' • Paid' : ' • Due'}</td>
                    <td className="py-3 pr-4 font-semibold text-slate-900">{taxEngine.formatCurrency(order.total)}</td>
                    <td className="py-3 text-slate-500">{new Date(order.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500 text-sm">
            No order activity is available for {periodLabel.toLowerCase()}.
          </div>
        )}
      </div>
    </div>
  )
}
