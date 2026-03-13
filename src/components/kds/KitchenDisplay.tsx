'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/app-store'
import { cn, getElapsedMinutes, getOrderPriority } from '@/lib/utils'
import { Clock, CheckCircle, ChefHat, Bell, AlertTriangle } from 'lucide-react'
import { OrderItem } from '@/lib/types'

export default function KitchenDisplay() {
  const { currentTenant, orders, updateOrder, updateOrderItemStatus } = useAppStore()
  const [, setTick] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(timer)
  }, [])

  if (!currentTenant) return null

  const activeOrders = orders.filter(o =>
    o.tenantId === currentTenant.id &&
    !o.isPaid && ['pending', 'preparing'].includes(o.status)
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const markItemReady = (orderId: string, itemId: string) => {
    updateOrderItemStatus(orderId, itemId, 'ready')
  }

  const markOrderReady = (orderId: string) => {
    updateOrder(orderId, { status: 'ready' })
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      {/* KDS Header */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm px-5 py-3 border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-900/40 border border-red-700/30 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="text-gray-900 font-bold text-sm">Kitchen Display System</div>
            <div className="text-emerald-600 text-xs">{activeOrders.length} active orders</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {[
            { label: 'Pending', count: activeOrders.filter(o => o.status === 'pending').length, color: 'text-amber-700' },
            { label: 'Preparing', count: activeOrders.filter(o => o.status === 'preparing').length, color: 'text-blue-700' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className={cn('text-lg font-black', s.color)}>{s.count}</div>
              <div className="text-emerald-700 text-xs">{s.label}</div>
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs text-emerald-500">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </div>
        </div>
      </div>

      {/* KDS Grid */}
      {activeOrders.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ChefHat className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900">All Clear!</h3>
            <p className="text-slate-500 text-sm">No active orders in the kitchen</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeOrders.map(order => {
              const elapsed = getElapsedMinutes(new Date(order.createdAt))
              const priority = getOrderPriority(elapsed)
              const allItemsReady = order.items.every(i => i.status === 'ready')

              return (
                <div
                  key={order.id}
                  className={cn(
                    'bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col',
                    priority === 'urgent' ? 'border-red-500/60 order-card-urgent' :
                    priority === 'high' ? 'border-gold-500/40' :
                    allItemsReady ? 'border-emerald-500/50 kds-ready' :
                    'border-gray-200'
                  )}
                >
                  {/* Order Header */}
                  <div className={cn(
                    'px-4 py-3 flex items-center justify-between border-b',
                    priority === 'urgent' ? 'bg-red-50 border-red-200' :
                    priority === 'high' ? 'bg-gold-900/20 border-amber-200' :
                    'bg-emerald-50 border-gray-100'
                  )}>
                    <div className="flex items-center gap-2">
                      {priority === 'urgent' && <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />}
                      {priority === 'high' && <Bell className="w-4 h-4 text-amber-600" />}
                      <span className="text-gray-900 font-bold text-sm">
                        {order.tableNumber ? `Table ${order.tableNumber}` : 'Takeaway'}
                      </span>
                      <span className="text-emerald-600 text-xs">{order.invoiceNumber}</span>
                    </div>
                    <div className={cn(
                      'flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg',
                      priority === 'urgent' ? 'bg-red-900/50 text-red-600' :
                      priority === 'high' ? 'bg-amber-50 text-amber-700' :
                      'bg-emerald-50 text-emerald-600'
                    )}>
                      <Clock className="w-3 h-3" />
                      {elapsed}m
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="flex-1 p-3 space-y-2">
                    {order.items.map((item: OrderItem) => (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-center gap-3 p-2.5 rounded-xl transition-all',
                          item.status === 'ready'
                            ? 'bg-emerald-50 opacity-60'
                            : 'bg-gray-50/60'
                        )}
                      >
                        <button
                          onClick={() => markItemReady(order.id, item.id)}
                          disabled={item.status === 'ready'}
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                            item.status === 'ready'
                              ? 'bg-emerald-600 text-white'
                              : 'border-2 border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
                          )}
                        >
                          {item.status === 'ready' && <CheckCircle className="w-3.5 h-3.5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            'text-sm font-medium',
                            item.status === 'ready' ? 'line-through text-emerald-700' : 'text-gray-900'
                          )}>
                            {item.menuItem.name}
                          </div>
                          {item.menuItem.nameAr && (
                            <div className="text-emerald-700 text-xs" dir="rtl">{item.menuItem.nameAr}</div>
                          )}
                          {item.notes && (
                            <div className="text-amber-600 text-xs mt-0.5">⚠️ {item.notes}</div>
                          )}
                        </div>
                        <div className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0',
                          item.quantity > 1 ? 'bg-gold-900/50 text-amber-700' : 'bg-emerald-50 text-emerald-600'
                        )}>
                          {item.quantity}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Footer */}
                  <div className="p-3 border-t border-gray-100">
                    <button
                      onClick={() => markOrderReady(order.id)}
                      disabled={!allItemsReady}
                      className={cn(
                        'w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2',
                        allItemsReady
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-gray-100 text-slate-400 cursor-not-allowed'
                      )}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {allItemsReady ? 'Mark Order Ready' : `${order.items.filter(i => i.status === 'ready').length}/${order.items.length} done`}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
