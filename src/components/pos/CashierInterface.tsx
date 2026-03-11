'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { TaxEngine, generateZATCAQRData } from '@/lib/country-config'
import { cn, formatDate } from '@/lib/utils'
import { Order } from '@/lib/types'
import {
  Receipt, CreditCard, Banknote, Smartphone, Check,
  Printer, Download, X, AlertCircle, QrCode, UtensilsCrossed, ShoppingBag, Edit
} from 'lucide-react'
import { printCustomerInvoice } from './InvoicePrint'

export default function CashierInterface() {
  const { currentTenant, orders, updateOrder, setActiveView, setEditingOrder } = useAppStore()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'digital'>('cash')
  const [paymentDone, setPaymentDone] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)

  if (!currentTenant) return null
  const taxEngine = new TaxEngine(currentTenant.countryCode, currentTenant.vatRate)
  const pendingOrders = orders.filter(o => !o.isPaid && o.status !== 'cancelled')

  const processPayment = () => {
    if (!selectedOrder) return
    updateOrder(selectedOrder.id, {
      isPaid: true,
      status: 'completed',
      paymentMethod,
    })
    setPaymentDone(true)
    setTimeout(() => {
      setPaymentDone(false)
      setShowInvoice(false)
      setSelectedOrder(null)
    }, 3000)
  }

  const getZatcaQR = (order: Order) => {
    if (currentTenant.countryCode !== 'KSA') return ''
    return generateZATCAQRData({
      sellerName: currentTenant.name,
      vatNumber: currentTenant.vatNumber || '300000000000003',
      timestamp: new Date(order.createdAt).toISOString(),
      total: order.total,
      vatAmount: order.vatAmount,
    })
  }

  if (paymentDone) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Payment Complete!</h3>
          <p className="text-emerald-600">{taxEngine.formatCurrency(selectedOrder?.total || 0)}</p>
          <p className="text-emerald-600 text-sm">Receipt sent · Thank you!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)]">
      {/* Orders Queue */}
      <div className="w-full lg:w-80 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-gray-900 font-semibold text-sm flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            Pending Orders ({pendingOrders.length})
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
          {pendingOrders.length === 0 ? (
            <div className="text-center py-8 text-emerald-700 text-sm">No pending orders</div>
          ) : (
            pendingOrders.map(order => {
              const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
              return (
                <button
                  key={order.id}
                  onClick={() => { setSelectedOrder(order); setShowInvoice(false) }}
                  className={cn(
                    'w-full p-3 rounded-xl text-left transition-all border',
                    selectedOrder?.id === order.id
                      ? 'border-emerald-500/60 bg-emerald-100'
                      : 'border-emerald-800/20 hover:border-emerald-200 glass'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-900 font-bold text-sm">{order.invoiceNumber}</span>
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full',
                      order.status === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'served' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-50 text-amber-700'
                    )}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    {order.orderType === 'takeaway' ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-semibold">
                        <ShoppingBag className="w-2.5 h-2.5" />Takeaway
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-semibold">
                        <UtensilsCrossed className="w-2.5 h-2.5" />{order.tableNumber ? `T${order.tableNumber}` : 'Dine In'}
                      </span>
                    )}
                    <span>{order.items.length} items · {elapsed}m ago</span>
                  </div>
                  <div className="text-gray-900 font-bold text-sm mt-1">{taxEngine.formatCurrency(order.total)}</div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Invoice & Payment */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {!selectedOrder ? (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <Receipt className="w-12 h-12 text-emerald-800 mx-auto mb-3" />
              <p className="text-emerald-600">Select an order to process payment</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-gray-900 font-bold">{selectedOrder.invoiceNumber}</h3>
                  {selectedOrder.orderType === 'takeaway' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                      <ShoppingBag className="w-3 h-3" />Take Away
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      <UtensilsCrossed className="w-3 h-3" />Dine In
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-xs mt-0.5">
                  {selectedOrder.tableNumber ? `Table ${selectedOrder.tableNumber}` : selectedOrder.customerName || 'Walk-in'} ·
                  {formatDate(new Date(selectedOrder.createdAt), 'DD/MM/YYYY HH:mm')}
                </p>
              </div>
              <div className="flex gap-2">
                {(selectedOrder.status === 'pending' || selectedOrder.status === 'preparing') && (
                  <button
                    onClick={() => {
                      if (setEditingOrder) setEditingOrder(selectedOrder)
                      setActiveView('pos')
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition-all border border-blue-200"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
                <button
                  onClick={() => printCustomerInvoice(selectedOrder, currentTenant)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-all"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Invoice
                </button>
                <button
                  onClick={() => setShowInvoice(!showInvoice)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg shadow-sm text-xs text-slate-600 border border-gray-200 hover:border-gray-300"
                >
                  <Receipt className="w-3.5 h-3.5" /> Preview
                </button>
              </div>
            </div>

            {showInvoice ? (
              /* Invoice Preview */
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <div className="max-w-sm mx-auto bg-white rounded-2xl shadow-sm p-6 border border-emerald-200 space-y-4">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-gray-900 font-bold text-lg mx-auto mb-2">
                      {currentTenant.name.charAt(0)}
                    </div>
                    <h2 className="text-gray-900 font-bold text-lg">{currentTenant.name}</h2>
                    <p className="text-emerald-600 text-xs">{currentTenant.address}</p>
                    <p className="text-emerald-600 text-xs">{currentTenant.phone}</p>
                    {currentTenant.vatNumber && (
                      <p className="text-emerald-500 text-xs mt-1">VAT: {currentTenant.vatNumber}</p>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex justify-between text-xs text-emerald-500 mb-3">
                      <span>{selectedOrder.invoiceNumber}</span>
                      <span>{formatDate(new Date(selectedOrder.createdAt), 'DD/MM/YYYY HH:mm')}</span>
                    </div>
                    {selectedOrder.tableNumber && (
                      <div className="text-xs text-emerald-500 mb-3">Table: {selectedOrder.tableNumber}</div>
                    )}
                    <div className="space-y-2">
                      {selectedOrder.items.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <div>
                            <span className="text-gray-900">{item.menuItem.name}</span>
                            <span className="text-emerald-600 ml-2">x{item.quantity}</span>
                          </div>
                          <span className="text-gray-900">{taxEngine.formatCurrency(item.unitPrice * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 space-y-2">
                    <div className="flex justify-between text-xs text-emerald-500">
                      <span>Subtotal</span>
                      <span>{taxEngine.formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-emerald-500">
                      <span>{taxEngine.getVatLabel()}</span>
                      <span>{taxEngine.formatCurrency(selectedOrder.vatAmount)}</span>
                    </div>
                    <div className="flex justify-between text-gray-900 font-bold text-base">
                      <span>Total</span>
                      <span>{taxEngine.formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </div>

                  {currentTenant.countryCode === 'KSA' && (
                    <div className="text-center pt-2">
                      <div className="text-xs text-emerald-600 mb-2">{taxEngine.getComplianceLabel()}</div>
                      <div className="w-24 h-24 bg-white rounded-xl p-2 mx-auto flex items-center justify-center">
                        <QrCode className="w-16 h-16 text-[#0a0f0d]" />
                      </div>
                      <div className="text-[10px] text-emerald-700 mt-1">ZATCA QR Code</div>
                    </div>
                  )}

                  {currentTenant.invoiceFooter && (
                    <div className="text-center text-xs text-emerald-600 border-t border-gray-100 pt-3">
                      {currentTenant.invoiceFooter}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Order Items */
              <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                <div className="space-y-2">
                  {selectedOrder.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                      <div>
                        <div className="text-gray-900 text-sm font-medium">{item.menuItem.name}</div>
                        <div className="text-emerald-600 text-xs">{taxEngine.formatCurrency(item.unitPrice)} × {item.quantity}</div>
                      </div>
                      <div className="text-gray-900 font-bold text-sm">
                        {taxEngine.formatCurrency(item.unitPrice * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Panel */}
            <div className="p-5 border-t border-gray-100 space-y-4">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="p-3 bg-emerald-50 rounded-xl text-center">
                  <div className="text-emerald-500 text-xs">Subtotal</div>
                  <div className="text-gray-900 font-bold">{taxEngine.formatCurrency(selectedOrder.subtotal)}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl text-center">
                  <div className="text-emerald-500 text-xs">{taxEngine.getVatLabel()}</div>
                  <div className="text-gray-900 font-bold">{taxEngine.formatCurrency(selectedOrder.vatAmount)}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl text-center border border-emerald-200">
                  <div className="text-emerald-600 text-xs font-medium">Total Due</div>
                  <div className="text-gray-900 font-black text-lg">{taxEngine.formatCurrency(selectedOrder.total)}</div>
                </div>
              </div>

              <div className="flex gap-2">
                {[
                  { method: 'cash' as const, label: 'Cash', icon: Banknote },
                  { method: 'card' as const, label: 'Card', icon: CreditCard },
                  { method: 'digital' as const, label: 'Digital', icon: Smartphone },
                ].map(({ method, label, icon: Icon }) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all border',
                      paymentMethod === method
                        ? 'bg-emerald-700/50 text-gray-900 border-emerald-500/50'
                        : 'glass text-emerald-500 border-gray-200 hover:text-emerald-700'
                    )}
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={processPayment}
                  className="py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Confirm · {taxEngine.formatCurrency(selectedOrder.total)}
                </button>
                <button
                  onClick={() => printCustomerInvoice(selectedOrder, currentTenant)}
                  className="py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Invoice
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
