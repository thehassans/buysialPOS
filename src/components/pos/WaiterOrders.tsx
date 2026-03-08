'use client'

import { useAppStore } from '@/store/app-store'
import { TaxEngine } from '@/lib/country-config'
import { cn } from '@/lib/utils'
import { Order } from '@/lib/types'
import {
  ClipboardList, Clock, CheckCircle2, ChefHat,
  UtensilsCrossed, ShoppingBag, Flame, CircleCheck,
  XCircle, RefreshCw, Table2, User, Receipt
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { printCustomerInvoice } from './InvoicePrint'

const STATUS_CONFIG: Record<string, { label: string; labelAr: string; color: string; icon: any; pulse?: boolean }> = {
  pending:   { label: 'Pending',   labelAr: 'في الانتظار', color: 'bg-amber-100 text-amber-700 border-amber-200',   icon: Clock,          pulse: true },
  preparing: { label: 'Preparing', labelAr: 'قيد التحضير', color: 'bg-blue-100 text-blue-700 border-blue-200',     icon: ChefHat,        pulse: true },
  ready:     { label: 'Ready',     labelAr: 'جاهز',        color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2, pulse: false },
  served:    { label: 'Served',    labelAr: 'تم التقديم',  color: 'bg-purple-100 text-purple-700 border-purple-200', icon: UtensilsCrossed, pulse: false },
  completed: { label: 'Completed', labelAr: 'مكتمل',      color: 'bg-gray-100 text-gray-500 border-gray-200',      icon: CircleCheck,    pulse: false },
  cancelled: { label: 'Cancelled', labelAr: 'ملغي',       color: 'bg-red-100 text-red-500 border-red-200',          icon: XCircle,        pulse: false },
}

const STATUS_ORDER = ['pending', 'preparing', 'ready', 'served', 'completed']

function StatusSteps({ status }: { status: string }) {
  const currentIdx = STATUS_ORDER.indexOf(status)
  if (status === 'cancelled') return null
  return (
    <div className="flex items-center gap-1 mt-2">
      {STATUS_ORDER.map((s, i) => {
        const done = i <= currentIdx
        const active = i === currentIdx
        const cfg = STATUS_CONFIG[s]
        const Icon = cfg.icon
        return (
          <div key={s} className="flex items-center">
            <div className={cn(
              'flex items-center justify-center w-6 h-6 rounded-full border transition-all',
              done
                ? active
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-emerald-100 border-emerald-300 text-emerald-600'
                : 'bg-gray-50 border-gray-200 text-gray-300'
            )}>
              <Icon className="w-3 h-3" />
            </div>
            {i < STATUS_ORDER.length - 1 && (
              <div className={cn('w-5 h-0.5 mx-0.5', i < currentIdx ? 'bg-emerald-400' : 'bg-gray-200')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function WaiterOrders() {
  const { currentUser, currentTenant, orders, updateOrder } = useAppStore()
  const [tick, setTick] = useState(0)
  const [filter, setFilter] = useState<'active' | 'all'>('active')
  const isAr = false

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(interval)
  }, [])

  if (!currentUser || !currentTenant) return null
  const taxEngine = new TaxEngine(currentTenant.countryCode, currentTenant.vatRate)

  const myOrders = orders
    .filter(o => o.waiterId === currentUser.id || o.tenantId === currentTenant.id)
    .filter(o => filter === 'active' ? !['completed', 'cancelled'].includes(o.status) : true)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const activeCount = orders.filter(o =>
    (o.waiterId === currentUser.id || o.tenantId === currentTenant.id) &&
    !['completed', 'cancelled'].includes(o.status)
  ).length

  const readyCount = orders.filter(o =>
    (o.waiterId === currentUser.id || o.tenantId === currentTenant.id) &&
    o.status === 'ready'
  ).length

  const getElapsed = (createdAt: Date) => {
    const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
    if (mins < 1) return 'Just now'
    if (mins === 1) return '1 min ago'
    return `${mins} min ago`
  }

  const markServed = (order: Order) => {
    updateOrder(order.id, { status: 'served' })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Orders</h2>
          <p className="text-slate-500 text-sm mt-0.5">{currentUser.name} · {currentTenant.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTick(t => t + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-gray-200 text-xs font-medium text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Orders', value: activeCount, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Flame },
          { label: 'Ready to Serve', value: readyCount, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
          { label: 'Total Today', value: myOrders.length, color: 'text-slate-700', bg: 'bg-gray-50 border-gray-200', icon: ClipboardList },
        ].map(s => (
          <div key={s.label} className={cn('rounded-2xl p-4 border flex items-center gap-3', s.bg)}>
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', s.bg)}>
              <s.icon className={cn('w-5 h-5', s.color)} />
            </div>
            <div>
              <div className={cn('text-2xl font-black', s.color)}>{s.value}</div>
              <div className="text-slate-500 text-xs">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: 'active', label: 'Active Orders' },
          { key: 'all', label: 'All Orders' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-all border',
              filter === f.key
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-slate-600 border-gray-200 hover:border-emerald-200 hover:text-emerald-700'
            )}
          >
            {f.label}
            {f.key === 'active' && activeCount > 0 && (
              <span className={cn('ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold', filter === 'active' ? 'bg-white/30 text-white' : 'bg-emerald-100 text-emerald-700')}>
                {activeCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {myOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No {filter === 'active' ? 'active ' : ''}orders</p>
          <p className="text-slate-400 text-sm mt-1">Go to POS to create a new order</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {myOrders.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
            const Icon = cfg.icon
            const isReady = order.status === 'ready'
            const isDone = ['completed', 'cancelled'].includes(order.status)

            return (
              <div
                key={order.id}
                className={cn(
                  'bg-white rounded-2xl border shadow-sm overflow-hidden transition-all',
                  isReady ? 'border-emerald-400 ring-1 ring-emerald-300' : 'border-gray-200',
                  isDone ? 'opacity-70' : ''
                )}
              >
                {/* Ready banner */}
                {isReady && (
                  <div className="bg-emerald-600 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white text-sm font-bold">
                      <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                      Ready to Serve!
                    </div>
                    <button
                      onClick={() => markServed(order)}
                      className="px-3 py-1 bg-white text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-all"
                    >
                      Mark Served ✓
                    </button>
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-bold text-sm">{order.invoiceNumber}</span>
                        {/* Order type badge */}
                        {order.orderType === 'takeaway' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-semibold border border-orange-200">
                            <ShoppingBag className="w-2.5 h-2.5" /> Take Away
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-semibold border border-blue-200">
                            <Table2 className="w-2.5 h-2.5" /> {order.tableNumber ? `Table ${order.tableNumber}` : 'Dine In'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {getElapsed(order.createdAt)}
                        </span>
                        <span>{order.items.length} items</span>
                        {order.customerName && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {order.customerName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border', cfg.color)}>
                        <Icon className={cn('w-3 h-3', cfg.pulse && 'animate-pulse')} />
                        {cfg.label}
                      </span>
                      <span className="text-gray-900 font-bold text-sm">{taxEngine.formatCurrency(order.total)}</span>
                    </div>
                  </div>

                  {/* Progress steps */}
                  <StatusSteps status={order.status} />

                  {/* Items */}
                  <div className="mt-3 space-y-1">
                    {order.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'w-2 h-2 rounded-full flex-shrink-0',
                            item.status === 'ready' ? 'bg-emerald-500' :
                            item.status === 'preparing' ? 'bg-blue-500 animate-pulse' :
                            'bg-gray-300'
                          )} />
                          <span className="text-gray-700">{item.menuItem.name}</span>
                          <span className="text-slate-400">× {item.quantity}</span>
                        </div>
                        <span className="text-slate-500">{taxEngine.formatCurrency(item.unitPrice * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div className="mt-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100 text-xs text-amber-700">
                      📝 {order.notes}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => printCustomerInvoice(order, currentTenant)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-slate-600 rounded-lg text-xs font-medium transition-all border border-gray-200"
                    >
                      <Receipt className="w-3.5 h-3.5" /> Print Invoice
                    </button>
                    {order.status === 'ready' && (
                      <button
                        onClick={() => markServed(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all"
                      >
                        <UtensilsCrossed className="w-3.5 h-3.5" /> Mark Served
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
