'use client'

import { useState, useEffect } from 'react'
import { MOCK_TENANTS, MOCK_CATEGORIES, MOCK_MENU_ITEMS } from '@/lib/mock-data'
import { TaxEngine } from '@/lib/country-config'
import { cn } from '@/lib/utils'
import { ShoppingCart, Plus, Minus, Sun, Moon, Search, Flame, Sparkles, X, ChefHat } from 'lucide-react'
import { MenuItem, OrderItem } from '@/lib/types'

export default function PublicMenuPage({ params }: { params: { slug: string } }) {
  const [darkMode, setDarkMode] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [cart, setCart] = useState<OrderItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [orderPlaced, setOrderPlaced] = useState(false)

  const tenant = MOCK_TENANTS.find(t => t.slug === params.slug) || MOCK_TENANTS[0]
  const taxEngine = new TaxEngine(tenant.countryCode, tenant.vatRate)

  const filteredItems = MOCK_MENU_ITEMS.filter(item => {
    const matchesCat = activeCategory === 'all' || item.categoryId === activeCategory
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.nameAr && item.nameAr.includes(search))
    return matchesCat && matchesSearch && item.isAvailable
  })

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)
  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const { vatAmount, total } = taxEngine.calculate(subtotal)

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const ex = prev.find(c => c.menuItemId === item.id)
      if (ex) return prev.map(c => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { id: `ci-${Date.now()}`, menuItemId: item.id, menuItem: item, quantity: 1, unitPrice: item.price, status: 'pending' as const }]
    })
  }

  const updateQty = (itemId: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.menuItemId !== itemId) return c
      const newQty = c.quantity + delta
      return newQty <= 0 ? null : { ...c, quantity: newQty }
    }).filter(Boolean) as OrderItem[])
  }

  const placeOrder = () => {
    setCartOpen(false)
    setOrderPlaced(true)
    setTimeout(() => { setOrderPlaced(false); setCart([]) }, 4000)
  }

  const bg = darkMode ? 'bg-gray-50' : 'bg-gray-50'
  const card = darkMode ? 'bg-white border-emerald-900/40' : 'bg-white border-gray-100'
  const text = darkMode ? 'text-gray-900' : 'text-gray-900'
  const subtext = darkMode ? 'text-emerald-500' : 'text-gray-500'

  if (orderPlaced) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', bg)}>
        <div className="text-center space-y-6 px-4">
          <div className="w-24 h-24 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center mx-auto">
            <ChefHat className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className={cn('text-2xl font-black', text)}>Order Received! 🎉</h2>
          <p className={cn(subtext, 'text-sm')}>Your order has been sent to the kitchen.<br />We'll bring it to your table shortly.</p>
          <div className="flex items-center justify-center gap-2 text-emerald-500 text-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Preparing your order...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('min-h-screen', bg, text)}>
      {/* Header */}
      <header className={cn('sticky top-0 z-30', darkMode ? 'bg-gray-50/90 backdrop-blur-xl border-b border-gray-100' : 'bg-white/90 backdrop-blur-xl border-b border-gray-100')}>
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <h1 className={cn('font-black text-lg leading-tight', text)}>{tenant.name}</h1>
            <p className={cn('text-xs', subtext)}>{tenant.countryCode === 'KSA' ? '🇸🇦' : '🇦🇪'} · {taxEngine.getVatLabel()}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={cn('w-9 h-9 rounded-full flex items-center justify-center transition-all', darkMode ? 'bg-emerald-900/40 text-emerald-600' : 'bg-gray-100 text-gray-600')}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {cartCount > 0 && (
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-full"
              >
                <ShoppingCart className="w-4 h-4" />
                {cartCount}
                <span className="ml-1">{taxEngine.formatCurrency(total)}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pb-24">
        {/* Search */}
        <div className="py-4">
          <div className={cn('relative flex items-center rounded-2xl border', darkMode ? 'bg-emerald-50 border-gray-200' : 'bg-gray-100 border-gray-200')}>
            <Search className={cn('absolute left-3.5 w-4 h-4', subtext)} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search dishes..."
              className={cn('w-full bg-transparent pl-10 pr-4 py-3 text-sm focus:outline-none', text, 'placeholder:text-opacity-50')}
              style={{ color: darkMode ? '#d1fae5' : '#111827' }}
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn('flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all border',
              activeCategory === 'all'
                ? 'bg-emerald-600 text-white border-transparent'
                : darkMode ? 'bg-emerald-50 text-emerald-600 border-gray-200' : 'bg-white text-gray-600 border-gray-200'
            )}
          >
            All
          </button>
          {MOCK_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn('flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all border',
                activeCategory === cat.id
                  ? 'bg-emerald-600 text-white border-transparent'
                  : darkMode ? 'bg-emerald-50 text-emerald-600 border-gray-200' : 'bg-white text-gray-600 border-gray-200'
              )}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          {filteredItems.map(item => {
            const inCart = cart.find(c => c.menuItemId === item.id)
            return (
              <div
                key={item.id}
                className={cn('rounded-2xl border overflow-hidden transition-all', card, inCart ? 'ring-1 ring-emerald-500/50' : '')}
              >
                <div className="flex gap-3 p-3">
                  {item.image && (
                    <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.isPopular && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] bg-gold-500/20 text-gold-400 px-1.5 py-0.5 rounded-full font-medium">
                              <Flame className="w-2.5 h-2.5" /> Popular
                            </span>
                          )}
                          {item.isNew && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-500/20 text-emerald-600 px-1.5 py-0.5 rounded-full font-medium">
                              <Sparkles className="w-2.5 h-2.5" /> New
                            </span>
                          )}
                        </div>
                        <h3 className={cn('font-bold text-sm mt-0.5', text)}>{item.name}</h3>
                        {item.nameAr && (
                          <p className={cn('text-xs mt-0.5', subtext)} dir="rtl">{item.nameAr}</p>
                        )}
                        {item.description && (
                          <p className={cn('text-xs mt-1 line-clamp-2', subtext)}>{item.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-emerald-500 font-black text-sm">{taxEngine.formatCurrency(item.price)}</span>
                          {item.preparationTime && (
                            <span className={cn('text-[10px]', subtext)}>⏱ {item.preparationTime}m</span>
                          )}
                          {item.calories && (
                            <span className={cn('text-[10px]', subtext)}>{item.calories} cal</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 self-end">
                    {!inCart ? (
                      <button
                        onClick={() => addToCart(item)}
                        className="w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-all active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-full bg-emerald-900/50 text-emerald-600 flex items-center justify-center">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className={cn('w-5 text-center font-bold text-sm', text)}>{inCart.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className={cn('relative w-full max-w-lg mx-auto rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin', darkMode ? 'bg-white' : 'bg-white')}>
            <div className="flex items-center justify-between">
              <h3 className={cn('text-lg font-black', text)}>Your Order</h3>
              <button onClick={() => setCartOpen(false)} className={cn('w-8 h-8 rounded-full flex items-center justify-center', darkMode ? 'bg-emerald-900/40 text-emerald-600' : 'bg-gray-100 text-gray-600')}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className={cn('font-medium text-sm', text)}>{item.menuItem.name}</div>
                    <div className={cn('text-xs', subtext)}>{taxEngine.formatCurrency(item.unitPrice)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.menuItemId, -1)} className="w-6 h-6 rounded-full bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className={cn('w-4 text-center font-bold text-sm', text)}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.menuItemId, 1)} className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <div className={cn('text-sm font-bold w-20 text-right', text)}>
                    {taxEngine.formatCurrency(item.unitPrice * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className={cn('border-t pt-3 space-y-1.5', darkMode ? 'border-gray-100' : 'border-gray-100')}>
              <div className={cn('flex justify-between text-xs', subtext)}>
                <span>Subtotal</span><span>{taxEngine.formatCurrency(subtotal)}</span>
              </div>
              <div className={cn('flex justify-between text-xs', subtext)}>
                <span>{taxEngine.getVatLabel()}</span><span>{taxEngine.formatCurrency(vatAmount)}</span>
              </div>
              <div className={cn('flex justify-between font-black text-base', text)}>
                <span>Total</span><span>{taxEngine.formatCurrency(total)}</span>
              </div>
            </div>

            <button
              onClick={placeOrder}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base rounded-2xl transition-all"
            >
              Place Order · {taxEngine.formatCurrency(total)}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
