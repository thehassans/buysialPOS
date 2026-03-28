'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { TaxEngine } from '@/lib/country-config'
import { cn, formatDate } from '@/lib/utils'
import {
  ClipboardList, UtensilsCrossed, ShoppingBag, Table2, User, History,
  Search, ChevronDown, ChevronUp, Receipt
} from 'lucide-react'
import { printCustomerInvoice } from '../pos/InvoicePrint'

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700 border-amber-200',
  preparing: 'bg-blue-100 text-blue-700 border-blue-200',
  ready:     'bg-emerald-100 text-emerald-700 border-emerald-200',
  served:    'bg-purple-100 text-purple-700 border-purple-200',
  completed: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelled: 'bg-red-100 text-red-500 border-red-200',
}

export default function OrdersModule() {
  const { currentTenant, orders, users } = useAppStore()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showHistoryId, setShowHistoryId] = useState<string | null>(null)

  if (!currentTenant) return null
  const taxEngine = new TaxEngine(currentTenant.countryCode, currentTenant.vatRate)

  const getUserName = (id?: string) => {
    if (!id) return null
    return users.find(u => u.id === id)?.name || id
  }

  const tenantOrders = orders
    .filter(o => o.tenantId === currentTenant.id)
    .filter(o => {
      if (filterStatus !== 'all' && o.status !== filterStatus) return false
      if (filterType !== 'all' && o.orderType !== filterType) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          o.invoiceNumber?.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q) ||
          getUserName(o.waiterId)?.toLowerCase().includes(q) ||
          getUserName(o.cashierId)?.toLowerCase().includes(q) ||
          String(o.tableNumber || '').includes(q)
        )
      }
      return true
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const totalRevenue = tenantOrders.filter(o => o.isPaid).reduce((s, o) => s + o.total, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-emerald-600" /> All Orders
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">{currentTenant.name} · {tenantOrders.length} orders</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Orders', value: tenantOrders.length, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
          { label: 'Completed', value: tenantOrders.filter(o => o.isPaid).length, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Active', value: tenantOrders.filter(o => !['completed', 'cancelled'].includes(o.status)).length, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
          { label: 'Revenue Collected', value: taxEngine.formatCurrency(totalRevenue), color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-2xl border p-4', s.bg)}>
            <div className={cn('text-xl font-black', s.color)}>{s.value}</div>
            <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice, customer, waiter..."
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-slate-400 focus:outline-none focus:border-emerald-400 shadow-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-emerald-400 shadow-sm"
        >
          <option value="all">All Statuses</option>
          {['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-emerald-400 shadow-sm"
        >
          <option value="all">All Types</option>
          <option value="dine_in">Dine In</option>
          <option value="takeaway">Takeaway</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {tenantOrders.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No orders match your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[1.4fr_1fr_0.8fr_1fr_1fr_0.9fr_0.7fr] gap-3 px-5 py-3 bg-gray-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <span>Invoice</span>
              <span>Date & Time</span>
              <span>Type</span>
              <span>Staff</span>
              <span>Status</span>
              <span className="text-right">Total</span>
              <span></span>
            </div>
            {tenantOrders.map(order => {
              const expanded = expandedId === order.id
              const showHistory = showHistoryId === order.id
              const staffName = getUserName(order.waiterId) || getUserName(order.cashierId) || '—'

              return (
                <div key={order.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_0.8fr_1fr_1fr_0.9fr_0.7fr] gap-2 sm:gap-3 items-center">
                    {/* Invoice */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">{order.invoiceNumber || '—'}</span>
                        {order.isEdited && (
                          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-bold rounded-full border border-orange-200">EDITED</span>
                        )}
                      </div>
                      {order.tableNumber && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <Table2 className="w-3 h-3" /> Table {order.tableNumber}
                        </div>
                      )}
                      {order.customerName && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <User className="w-3 h-3" /> {order.customerName}
                        </div>
                      )}
                    </div>

                    {/* Date */}
                    <div className="text-xs text-slate-600">
                      {formatDate(new Date(order.createdAt), 'DD/MM/YYYY')}<br />
                      <span className="text-slate-400">{formatDate(new Date(order.createdAt), 'HH:mm')}</span>
                    </div>

                    {/* Type */}
                    <div>
                      {order.orderType === 'takeaway' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-semibold">
                          <ShoppingBag className="w-2.5 h-2.5" /> Takeaway
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-semibold">
                          <UtensilsCrossed className="w-2.5 h-2.5" /> Dine In
                        </span>
                      )}
                    </div>

                    {/* Staff */}
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{staffName}</span>
                    </div>

                    {/* Status */}
                    <div>
                      <span className={cn('inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border', STATUS_COLORS[order.status] || STATUS_COLORS.pending)}>
                        {order.status}
                      </span>
                      {order.isPaid && (
                        <span className="ml-1.5 text-[10px] text-emerald-600 font-semibold">✓ Paid</span>
                      )}
                    </div>

                    {/* Total */}
                    <div className="text-right">
                      <div className="font-bold text-sm text-gray-900">{taxEngine.formatCurrency(order.total)}</div>
                      {order.paymentMethod && (
                        <div className="text-[10px] text-slate-400 capitalize">{order.paymentMethod}</div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 justify-end">
                      {order.editHistory && order.editHistory.length > 0 && (
                        <button
                          onClick={() => setShowHistoryId(showHistory ? null : order.id)}
                          className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500 transition-all"
                          title="Edit history"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedId(expanded ? null : order.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-slate-500 transition-all"
                        title="View items"
                      >
                        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => printCustomerInvoice(order, currentTenant)}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-all"
                        title="Print invoice"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded items */}
                  {expanded && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                      {order.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-slate-600">{item.quantity}</span>
                            <span className="text-gray-700">{item.menuItem?.name || 'Item'}</span>
                            {item.notes && <span className="text-slate-400 italic">· {item.notes}</span>}
                          </div>
                          <span className="text-slate-500">{taxEngine.formatCurrency(item.unitPrice * item.quantity)}</span>
                        </div>
                      ))}
                      {order.notes && (
                        <div className="mt-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100 text-xs text-amber-700">
                          📝 {order.notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Edit history */}
                  {showHistory && order.editHistory && order.editHistory.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-orange-100 space-y-2">
                      <div className="text-xs font-semibold text-orange-700 flex items-center gap-1">
                        <History className="w-3 h-3" /> Edit History
                      </div>
                      {order.editHistory.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs bg-orange-50 rounded-lg px-3 py-2">
                          <div className="flex-1">
                            <span className="font-semibold text-orange-800">{h.editedByName}</span>
                            <span className="text-orange-600"> · {formatDate(new Date(h.editedAt), 'DD/MM/YYYY HH:mm')}</span>
                            <div className="text-orange-700 mt-0.5">{h.changes}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
