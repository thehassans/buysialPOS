'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { MenuItem, OrderItem, Table, OrderType, Order } from '@/lib/types'
import { TaxEngine } from '@/lib/country-config'
import { cn } from '@/lib/utils'
import { generateInvoiceNumber } from '@/lib/utils'
import { printCustomerInvoice, printKitchenTicket } from './InvoicePrint'
import {
  ShoppingCart, Plus, Minus, Trash2, Send, Table2,
  CheckCircle, Search, UtensilsCrossed, ShoppingBag, User, Phone, Printer, Receipt, XCircle
} from 'lucide-react'
import { useEffect } from 'react'
import { getDevicePrintRole, shouldAutoPrintKitchen } from '@/lib/device-print'

export default function POSInterface() {
  const { currentTenant, currentUser, addOrder, updateOrder, categories, menuItems, tables, reserveTable, editingOrder, setEditingOrder } = useAppStore()
  const [orderType, setOrderType] = useState<OrderType>('dine_in')
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [cart, setCart] = useState<OrderItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [orderSent, setOrderSent] = useState(false)
  const [lastOrder, setLastOrder] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [autoPrintKitchen, setAutoPrintKitchen] = useState(true)

  useEffect(() => {
    if (editingOrder) {
      setCart(editingOrder.items || [])
      setOrderType(editingOrder.orderType || 'dine_in')
      setNotes(editingOrder.notes || '')
      setCustomerName(editingOrder.customerName || '')
      if (editingOrder.tableNumber) {
        const table = tables.find(t => t.number === editingOrder.tableNumber && t.tenantId === currentTenant?.id)
        if (table) setSelectedTable(table)
      }
    }
  }, [editingOrder, tables, currentTenant?.id])

  if (!currentTenant) return null
  const taxEngine = new TaxEngine(currentTenant.countryCode, currentTenant.vatRate)
  const tenantCategories = [
    ...categories.filter(category => category.tenantId === currentTenant.id),
    ...Array.from(new Set(menuItems.filter(item => item.tenantId === currentTenant.id).map(item => item.categoryId)))
      .filter(categoryId => !categories.some(category => category.id === categoryId))
      .map((categoryId, index) => ({
        id: categoryId,
        tenantId: currentTenant.id,
        name: categoryId.replace(/[-_]/g, ' ').replace(/\b\w/g, character => character.toUpperCase()),
        icon: '🍽️',
        sortOrder: categories.length + index + 1,
        isActive: true,
      })),
  ].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
  const deviceRole = getDevicePrintRole(currentTenant.id)

  const filteredItems = menuItems.filter(item => {
    if (item.tenantId !== currentTenant.id) return false
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.nameAr && item.nameAr.includes(searchQuery))
    return matchesCategory && matchesSearch && item.isAvailable
  })

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id)
      if (existing) return prev.map(c => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { id: `ci-${Date.now()}`, menuItemId: item.id, menuItem: item, quantity: 1, unitPrice: item.price, status: 'pending' as const }]
    })
  }

  const removeFromCart = (itemId: string) => setCart(prev => prev.filter(c => c.menuItemId !== itemId))

  const updateQty = (itemId: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.menuItemId === itemId) {
        const newQty = c.quantity + delta
        return newQty <= 0 ? null : { ...c, quantity: newQty }
      }
      return c
    }).filter(Boolean) as OrderItem[])
  }

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const { vatAmount, total } = taxEngine.calculate(subtotal)

  const sendOrder = () => {
    if (orderType === 'dine_in' && !selectedTable) return
    if (cart.length === 0) return

    if (editingOrder) {
      updateOrder(editingOrder.id, {
        items: cart,
        subtotal,
        vatAmount,
        total,
        notes,
        tableNumber: orderType === 'dine_in' ? selectedTable?.number : undefined,
        orderType,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
      })
      setLastOrder({ ...editingOrder, items: cart, total, subtotal, vatAmount })
      if (autoPrintKitchen && shouldAutoPrintKitchen(currentTenant)) {
        printKitchenTicket({ ...editingOrder, items: cart } as Order, currentTenant)
      }
      setOrderSent(true)
      setTimeout(() => {
        setEditingOrder(null)
        setCart([])
        setOrderSent(false)
        setLastOrder(null)
        setSelectedTable(null)
        setNotes('')
        setCustomerName('')
        setCustomerPhone('')
      }, 2500)
      return
    }

    const order = {
      id: `ord-${Date.now()}`,
      tenantId: currentTenant.id,
      waiterId: currentUser?.role === 'waiter' ? currentUser.id : undefined,
      tableNumber: orderType === 'dine_in' ? selectedTable?.number : undefined,
      items: cart,
      status: 'pending' as const,
      subtotal,
      vatRate: currentTenant.vatRate,
      vatAmount,
      total,
      isPaid: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      invoiceNumber: generateInvoiceNumber('INV'),
      notes,
      orderType,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
    }
    addOrder(order)
    if (orderType === 'dine_in' && selectedTable) {
      reserveTable(selectedTable.number, order.id)
    }
    setLastOrder(order)
    if (autoPrintKitchen && shouldAutoPrintKitchen(currentTenant)) {
      printKitchenTicket(order, currentTenant)
    }
    setOrderSent(true)
    setTimeout(() => {
      setCart([])
      setOrderSent(false)
      setLastOrder(null)
      setSelectedTable(null)
      setNotes('')
      setCustomerName('')
      setCustomerPhone('')
    }, 3500)
  }

  if (orderSent && lastOrder) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-6 sm:p-10 max-w-md w-full text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900">{editingOrder ? 'Order Updated!' : 'Order Sent!'}</h3>
            <p className="text-slate-500 mt-1">{lastOrder.invoiceNumber}</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className={cn('px-4 py-1.5 rounded-full text-sm font-bold', orderType === 'dine_in' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700')}>
              {orderType === 'dine_in' ? '🍽️ Dine In' : '🥡 Take Away'}
            </span>
            {lastOrder.tableNumber && <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">Table {lastOrder.tableNumber}</span>}
          </div>
          <p className="text-slate-500 text-sm">{cart.length} items · {taxEngine.formatCurrency(lastOrder.total)}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => printKitchenTicket(lastOrder, currentTenant)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-all"
            >
              <Printer className="w-4 h-4" /> Kitchen
            </button>
            <button
              onClick={() => printCustomerInvoice(lastOrder, currentTenant)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all"
            >
              <Receipt className="w-4 h-4" /> Invoice
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[calc(100vh-8rem)] lg:h-[calc(100vh-8rem)]">
      {/* Left: Menu */}
      <div className="flex-1 flex flex-col gap-3 overflow-visible lg:overflow-hidden min-w-0">

        {/* Order Type Toggle */}
        <div className="bg-white rounded-2xl p-3 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Order Type</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOrderType('dine_in')}
              className={cn(
                'flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all',
                orderType === 'dine_in'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-50 text-slate-600 border border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
              )}
            >
              <UtensilsCrossed className="w-4 h-4" />
              Dine In
            </button>
            <button
              onClick={() => { setOrderType('takeaway'); setSelectedTable(null) }}
              className={cn(
                'flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all',
                orderType === 'takeaway'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-50 text-slate-600 border border-gray-200 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200'
              )}
            >
              <ShoppingBag className="w-4 h-4" />
              Take Away
            </button>
          </div>
        </div>

        {/* Table Selection (only for dine-in) */}
        {orderType === 'dine_in' && (
          !selectedTable ? (
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Table2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-gray-900 font-semibold text-sm">Select Table</h3>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {tables.filter(t => t.tenantId === currentTenant.id).map(table => (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTable(table)}
                    className={cn(
                      'p-2 rounded-lg text-xs font-bold transition-all',
                      table.isOccupied
                        ? 'bg-red-50 text-red-500 border border-red-200 cursor-not-allowed'
                        : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                    )}
                    disabled={table.isOccupied}
                  >
                    T{table.number}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-blue-50 rounded-xl px-4 py-2.5 border border-blue-200">
              <div className="flex items-center gap-2 min-w-0">
                <Table2 className="w-4 h-4 text-blue-600" />
                <span className="text-gray-900 font-semibold text-sm">Table {selectedTable.number}</span>
                <span className="text-slate-500 text-xs truncate">· {selectedTable.section} · Cap {selectedTable.capacity}</span>
              </div>
              <button onClick={() => setSelectedTable(null)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Change</button>
            </div>
          )
        )}

        {/* Search & Categories */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search menu items..."
            className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl text-sm text-gray-900 placeholder-slate-400 border border-gray-200 focus:border-emerald-400 focus:outline-none shadow-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button onClick={() => setSelectedCategory('all')} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0', selectedCategory === 'all' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-700')}>All</button>
          {tenantCategories.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-1.5', selectedCategory === cat.id ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-700')}>
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredItems.map(item => {
              const inCart = cart.find(c => c.menuItemId === item.id)
              return (
                <button key={item.id} onClick={() => addToCart(item)} className={cn('bg-white rounded-xl p-3 text-left transition-all pos-item group border relative shadow-sm', inCart ? 'border-emerald-400 bg-emerald-50 ring-1 ring-emerald-200' : 'border-gray-200 hover:border-emerald-300 hover:shadow')}>
                  {item.isPopular && <div className="absolute top-2 left-2 text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold">HOT</div>}
                  {item.isNew && <div className="absolute top-2 right-2 text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full font-bold">NEW</div>}
                  {item.image && <div className="w-full h-20 rounded-lg overflow-hidden mb-2 bg-gray-100"><img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" /></div>}
                  <div className="text-gray-900 text-xs font-semibold leading-tight mb-1">{item.name}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-600 font-bold text-sm">{taxEngine.formatCurrency(item.price)}</span>
                    {inCart && <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">{inCart.quantity}</span>}
                  </div>
                  {item.preparationTime && <div className="text-slate-400 text-[10px] mt-1">⏱ {item.preparationTime} min</div>}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right: Order Panel */}
      <div className="w-full lg:w-80 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-shrink-0">
        {/* Order Header */}
        <div className={cn('p-4 border-b border-gray-100', orderType === 'dine_in' ? 'bg-blue-50' : 'bg-orange-50')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {orderType === 'dine_in' ? <UtensilsCrossed className="w-4 h-4 text-blue-600" /> : <ShoppingBag className="w-4 h-4 text-orange-600" />}
              <span className={cn('font-bold text-sm', orderType === 'dine_in' ? 'text-blue-700' : 'text-orange-700')}>
                {orderType === 'dine_in' ? 'Dine In' : 'Take Away'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {orderType === 'dine_in' && selectedTable && <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">T{selectedTable.number}</span>}
              <span className="text-xs text-slate-500">{cart.length} items</span>
            </div>
          </div>
        </div>

        {/* Customer Info (for takeaway or optional for dine-in) */}
        {!editingOrder && (
          <div className="px-3 pt-3 space-y-2">
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder={orderType === 'takeaway' ? 'Customer name *' : 'Customer name (optional)'}
                className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-900 placeholder-slate-400 border border-gray-200 focus:outline-none focus:border-emerald-400"
              />
            </div>
            {orderType === 'takeaway' && (
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-900 placeholder-slate-400 border border-gray-200 focus:outline-none focus:border-emerald-400"
                />
              </div>
            )}
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
          {editingOrder && (
            <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-700">Editing: {editingOrder.invoiceNumber}</span>
              <button 
                onClick={() => {
                  setEditingOrder(null)
                  setCart([])
                  setSelectedTable(null)
                }}
                className="p-1 rounded-full hover:bg-blue-200 text-blue-600 transition-colors"
                title="Cancel Edit"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <ShoppingCart className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-slate-500 text-sm">No items yet</p>
              <p className="text-slate-400 text-xs">Tap items to add</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <div className="text-gray-900 text-xs font-medium truncate">{item.menuItem.name}</div>
                  <div className="text-slate-500 text-xs">{taxEngine.formatCurrency(item.unitPrice)}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.menuItemId, -1)} className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-slate-600 hover:bg-gray-300">
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="text-gray-900 text-xs font-bold w-5 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.menuItemId, 1)} className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-200">
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                  <button onClick={() => removeFromCart(item.menuItemId)} className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100">
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Footer */}
        {cart.length > 0 && (
          <div className="p-3 border-t border-gray-100 space-y-2.5">
            {/* Totals */}
            <div className="space-y-1 bg-gray-50 rounded-xl p-3">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Subtotal</span>
                <span>{taxEngine.formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{taxEngine.getVatLabel()}</span>
                <span>{taxEngine.formatCurrency(vatAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-gray-900 pt-1 border-t border-gray-200">
                <span>Total</span>
                <span className="text-emerald-600">{taxEngine.formatCurrency(total)}</span>
              </div>
            </div>

            {/* Notes */}
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Order notes..."
              rows={2}
              className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-900 placeholder-slate-400 border border-gray-200 focus:outline-none focus:border-emerald-400 resize-none"
            />

            {/* Auto-print toggle */}
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setAutoPrintKitchen(!autoPrintKitchen)}
                  className={cn('w-8 h-4 rounded-full transition-colors relative cursor-pointer', autoPrintKitchen ? 'bg-emerald-500' : 'bg-gray-300')}
                >
                  <div className={cn('absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform', autoPrintKitchen ? 'translate-x-4' : 'translate-x-0.5')} />
                </div>
                <span className="text-xs text-slate-500">{deviceRole === 'waiter' ? 'Dedicated kitchen/cashier devices auto-print' : 'Also auto-print on this device'}</span>
              </label>
              <Printer className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Send Button */}
            <button
              onClick={sendOrder}
              disabled={orderType === 'dine_in' ? !selectedTable : false}
              className={cn(
                'w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2',
                (orderType === 'takeaway' || selectedTable)
                  ? editingOrder
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    : orderType === 'dine_in'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                      : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                  : 'bg-gray-100 text-slate-400 cursor-not-allowed'
              )}
            >
              <Send className="w-4 h-4" />
              {editingOrder 
                ? `Update Order (${cart.length} items)`
                : orderType === 'dine_in'
                  ? (selectedTable ? `Send to Kitchen · T${selectedTable.number}` : 'Select a Table First')
                  : 'Send Take Away Order'
              }
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
