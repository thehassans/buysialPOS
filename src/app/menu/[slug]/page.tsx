'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { MOCK_TENANTS, MOCK_CATEGORIES, MOCK_MENU_ITEMS } from '@/lib/mock-data'
import { TaxEngine } from '@/lib/country-config'
import { cn } from '@/lib/utils'
import { ShoppingCart, Plus, Minus, Search, Flame, Sparkles, X, ChefHat, MapPin, Phone } from 'lucide-react'
import { MenuItem, MenuPortion, OrderItem, Tenant } from '@/lib/types'

const COUNTRY_META = {
  KSA: { flag: '🇸🇦', label: 'Saudi Arabia' },
  UAE: { flag: '🇦🇪', label: 'United Arab Emirates' },
  OMN: { flag: '🇴🇲', label: 'Oman' },
} as const

function buildTenantFromQuery(searchParams: URLSearchParams, slug: string): Tenant | null {
  const tenantId = searchParams.get('tenantId')
  const name = searchParams.get('name')

  if (!tenantId || !name) return null

  const countryCode = (searchParams.get('countryCode') as Tenant['countryCode']) || 'KSA'
  const currency = (searchParams.get('currency') as Tenant['currency']) || 'SAR'
  const vatRate = Number(searchParams.get('vatRate') || 0.15)

  return {
    id: tenantId,
    name,
    slug,
    logo: searchParams.get('logo') || '/logo.png',
    countryCode,
    currency,
    vatRate: Number.isFinite(vatRate) ? vatRate : 0.15,
    vatNumber: searchParams.get('vatNumber') || undefined,
    address: searchParams.get('address') || '',
    phone: searchParams.get('phone') || '',
    email: searchParams.get('email') || '',
    subscriptionPlan: 'professional',
    isActive: true,
    createdAt: new Date(),
    invoiceFooter: searchParams.get('invoiceFooter') || undefined,
    primaryColor: searchParams.get('primaryColor') || '#059669',
  }
}

function formatCategoryName(categoryId: string) {
  const knownCategory = MOCK_CATEGORIES.find(category => category.id === categoryId)
  if (knownCategory) return knownCategory.name
  return categoryId
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase())
}

function getPortionPrice(item: MenuItem, portionType: MenuPortion) {
  return portionType === 'half' && item.hasHalfPlate && item.halfPlatePrice
    ? item.halfPlatePrice
    : item.price
}

function getPortionLabel(portionType?: MenuPortion) {
  return portionType === 'half' ? 'Half Plate' : 'Full Plate'
}

export default function PublicMenuPage({ params }: { params: { slug: string } }) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [cart, setCart] = useState<OrderItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [usingFallbackMenu, setUsingFallbackMenu] = useState(false)
  const searchParams = useSearchParams()

  const slug = decodeURIComponent(params.slug)
  const tenant = useMemo(() => {
    return buildTenantFromQuery(searchParams, slug) || MOCK_TENANTS.find(item => item.slug === slug) || null
  }, [searchParams, slug])

  const tenantId = searchParams.get('tenantId') || tenant?.id || null
  const tenantLogo = tenant?.logo || searchParams.get('logo') || '/logo.png'
  const brandColor = tenant?.primaryColor || '#059669'
  const taxEngine = tenant ? new TaxEngine(tenant.countryCode, tenant.vatRate) : null

  useEffect(() => {
    if (!tenantId) {
      setMenuItems([])
      setIsLoading(false)
      return
    }

    let cancelled = false

    const loadMenu = async () => {
      setIsLoading(true)
      setUsingFallbackMenu(false)

      try {
        const response = await fetch(`/api/menu-items?tenantId=${encodeURIComponent(tenantId)}`)
        if (!response.ok) throw new Error('Failed to fetch menu')
        const data = await response.json()
        if (cancelled) return
        const scopedItems = Array.isArray(data)
          ? data.filter((item: MenuItem) => item.tenantId === tenantId && item.isAvailable)
          : []

        if (scopedItems.length > 0) {
          setMenuItems(scopedItems)
        } else {
          setUsingFallbackMenu(true)
          setMenuItems(MOCK_MENU_ITEMS.filter(item => item.tenantId === tenantId && item.isAvailable))
        }
      } catch {
        if (cancelled) return
        setUsingFallbackMenu(true)
        setMenuItems(MOCK_MENU_ITEMS.filter(item => item.tenantId === tenantId && item.isAvailable))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadMenu()

    return () => {
      cancelled = true
    }
  }, [tenantId])

  const categories = useMemo(() => {
    const scopedCategories = MOCK_CATEGORIES
      .filter(category => category.tenantId === tenantId)
      .filter(category => menuItems.some(item => item.categoryId === category.id))

    if (scopedCategories.length > 0) return scopedCategories

    return Array.from(new Set(menuItems.map(item => item.categoryId).filter(Boolean))).map((categoryId, index) => ({
      id: categoryId,
      tenantId: tenantId || 'public',
      name: formatCategoryName(categoryId),
      nameAr: undefined,
      icon: ['🍽️', '🥗', '🥘', '🍰', '🥤'][index % 5],
      sortOrder: index + 1,
      isActive: true,
    }))
  }, [menuItems, tenantId])

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCat = activeCategory === 'all' || item.categoryId === activeCategory
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.nameAr && item.nameAr.includes(search))
      return matchesCat && matchesSearch && item.isAvailable
    })
  }, [menuItems, activeCategory, search])

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const { vatAmount, total } = taxEngine ? taxEngine.calculate(subtotal) : { vatAmount: 0, total: subtotal }

  const addToCart = (item: MenuItem, portionType: MenuPortion = 'full') => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.menuItemId === item.id && (cartItem.portionType || 'full') === portionType)
      if (existing) {
        return prev.map(cartItem => cartItem.menuItemId === item.id && (cartItem.portionType || 'full') === portionType
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem)
      }

      return [
        ...prev,
        {
          id: `ci-${Date.now()}`,
          menuItemId: item.id,
          menuItem: item,
          portionType,
          quantity: 1,
          unitPrice: getPortionPrice(item, portionType),
          status: 'pending' as const,
        },
      ]
    })
  }

  const updateQty = (itemId: string, delta: number, portionType: MenuPortion = 'full') => {
    setCart(prev => prev.map(item => {
      if (item.menuItemId !== itemId || (item.portionType || 'full') !== portionType) return item
      const newQuantity = item.quantity + delta
      return newQuantity <= 0 ? null : { ...item, quantity: newQuantity }
    }).filter(Boolean) as OrderItem[])
  }

  const placeOrder = () => {
    setCartOpen(false)
    setOrderPlaced(true)
    setTimeout(() => {
      setOrderPlaced(false)
      setCart([])
    }, 4000)
  }

  const bg = 'bg-[radial-gradient(circle_at_top,_rgba(5,150,105,0.10),_transparent_26%),linear-gradient(180deg,#f7fbf9_0%,#f5f1ea_100%)]'
  const surface = 'bg-white/95 border-stone-200'
  const text = 'text-slate-950'
  const subtext = 'text-slate-500'
  const country = tenant ? COUNTRY_META[tenant.countryCode] : null

  if (!tenant || !tenantId) {
    return (
      <div className="min-h-screen bg-[#07120f] px-4 py-12 text-white">
        <div className="mx-auto max-w-lg rounded-[32px] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/10">
            <ChefHat className="h-9 w-9 text-emerald-300" />
          </div>
          <h1 className="mt-6 text-3xl font-black">Restaurant menu unavailable</h1>
          <p className="mt-3 text-sm text-slate-300">
            This QR link is not connected to a valid restaurant menu. Please scan the restaurant’s official QR code again.
          </p>
        </div>
      </div>
    )
  }

  if (orderPlaced) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center px-4', bg)}>
        <div className="w-full max-w-lg rounded-[36px] border border-white/70 bg-white/90 p-10 text-center shadow-[0_40px_120px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 bg-emerald-50" style={{ borderColor: brandColor }}>
            <ChefHat className="h-12 w-12" style={{ color: brandColor }} />
          </div>
          <h2 className={cn('mt-6 text-3xl font-black', text)}>Order received</h2>
          <p className={cn('mt-3 text-sm leading-relaxed', subtext)}>
            Your order has been sent to the kitchen for <span className="font-semibold text-slate-900">{tenant.name}</span>.
            We’ll bring it to your table shortly.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm" style={{ color: brandColor }}>
            <div className="h-2.5 w-2.5 rounded-full animate-ping" style={{ backgroundColor: brandColor }} />
            Preparing your order...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('min-h-screen', bg, text)}>
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,150,105,0.08),transparent_72%)]" />
        <div className="mx-auto max-w-3xl px-4 pb-10 pt-6 sm:px-6">
          <div className="rounded-[34px] border border-white/70 bg-white/90 p-5 shadow-[0_28px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-7">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
                {tenantLogo ? (
                  <img src={tenantLogo} alt={tenant.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-slate-700">{tenant.name.charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">{tenant.name}</h1>
                <p className="mt-1 text-sm text-slate-500">{country?.flag} {country?.label}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{tenant.currency} menu</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              {tenant.address && (
                <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                  <MapPin className="h-4 w-4" style={{ color: brandColor }} />
                  <span className="line-clamp-1">{tenant.address}</span>
                </div>
              )}
              {tenant.phone && (
                <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                  <Phone className="h-4 w-4" style={{ color: brandColor }} />
                  <span>{tenant.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
        <div className={cn('rounded-[34px] border p-4 shadow-[0_28px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6', surface)}>
          {usingFallbackMenu && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">
              Menu sync in progress.
            </div>
          )}

          {/* Search */}
          <div className="mb-4 rounded-[28px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-black text-slate-950">{menuItems.length} dishes</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">All prices in {tenant.currency}</div>
              </div>
              {cartCount > 0 && (
                <button
                  onClick={() => setCartOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-lg"
                  style={{ backgroundColor: brandColor }}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {cartCount}
                  <span>{taxEngine?.formatCurrency(total)}</span>
                </button>
              )}
            </div>

            <div className="relative mt-4 flex items-center rounded-2xl border border-slate-200 bg-[#f8faf9]">
              <Search className={cn('absolute left-3.5 h-4 w-4', subtext)} />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search signature dishes..."
                className={cn('w-full bg-transparent pl-10 pr-4 py-3 text-sm focus:outline-none', text, 'placeholder:text-slate-400')}
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-all',
                activeCategory === 'all' ? 'border-transparent text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600'
              )}
              style={activeCategory === 'all' ? { backgroundColor: brandColor } : undefined}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-all',
                  activeCategory === category.id ? 'border-transparent text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600'
                )}
                style={activeCategory === category.id ? { backgroundColor: brandColor } : undefined}
              >
                <span className="mr-1.5">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>

          {/* Menu Items */}
          <div className="space-y-4">
            {isLoading && (
              <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500">
                Loading the restaurant menu...
              </div>
            )}

            {!isLoading && filteredItems.length === 0 && (
              <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-12 text-center">
                <div className="text-xl font-black text-slate-950">No dishes found</div>
                <p className="mt-2 text-sm text-slate-500">
                  Try a different search term or category for this restaurant menu.
                </p>
              </div>
            )}

            {!isLoading && filteredItems.map(item => {
              const fullCartItem = cart.find(cartItem => cartItem.menuItemId === item.id && (cartItem.portionType || 'full') === 'full')
              const halfCartItem = cart.find(cartItem => cartItem.menuItemId === item.id && cartItem.portionType === 'half')
              const totalInCart = cart.filter(cartItem => cartItem.menuItemId === item.id).reduce((sum, cartItem) => sum + cartItem.quantity, 0)

              return (
                <div
                  key={item.id}
                  className={cn(
                    'overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm transition-all',
                    totalInCart > 0 ? 'ring-2 ring-offset-2 ring-offset-transparent' : ''
                  )}
                  style={totalInCart > 0 ? { borderColor: brandColor, boxShadow: `0 0 0 1px ${brandColor}40` } : undefined}
                >
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:p-5">
                    <div className="h-44 overflow-hidden rounded-[24px] bg-slate-100 sm:h-32 sm:w-36 sm:flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl">🍽️</div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          {item.isPopular && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-600">
                              <Flame className="h-3 w-3" />
                              Popular
                            </span>
                          )}
                          {item.isNew && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600">
                              <Sparkles className="h-3 w-3" />
                              New
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-black text-slate-950">{item.name}</h3>
                            {item.nameAr && (
                              <p className="mt-1 text-sm text-slate-500" dir="rtl">{item.nameAr}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black" style={{ color: brandColor }}>{taxEngine?.formatCurrency(item.price)}</div>
                            {item.hasHalfPlate && item.halfPlatePrice && (
                              <div className="mt-1 text-xs font-semibold text-amber-600">Half {taxEngine?.formatCurrency(item.halfPlatePrice)}</div>
                            )}
                          </div>
                        </div>

                        {item.description && (
                          <p className="mt-3 text-sm leading-relaxed text-slate-500">{item.description}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {item.preparationTime && (
                          <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-500">
                            ⏱ {item.preparationTime} min
                          </span>
                        )}
                        {item.calories && (
                          <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-500">
                            {item.calories} cal
                          </span>
                        )}

                        <div className="ml-auto">
                          {!item.hasHalfPlate ? (
                            !fullCartItem ? (
                              <button
                                onClick={() => addToCart(item, 'full')}
                                className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-sm transition-all active:scale-95"
                                style={{ backgroundColor: brandColor }}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateQty(item.id, -1, 'full')}
                                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="w-6 text-center text-sm font-bold text-slate-950">{fullCartItem.quantity}</span>
                                <button
                                  onClick={() => updateQty(item.id, 1, 'full')}
                                  className="flex h-9 w-9 items-center justify-center rounded-full text-white"
                                  style={{ backgroundColor: brandColor }}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )
                          ) : (
                            <div className="grid min-w-[220px] gap-2 sm:min-w-[250px]">
                              {(['full', 'half'] as MenuPortion[]).map(portion => {
                                if (portion === 'half' && !item.hasHalfPlate) return null
                                const portionCartItem = portion === 'half' ? halfCartItem : fullCartItem
                                return (
                                  <div key={portion} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                                    <div>
                                      <div className="text-[11px] font-semibold text-slate-700">{getPortionLabel(portion)}</div>
                                      <div className="text-[11px] text-slate-500">{taxEngine?.formatCurrency(getPortionPrice(item, portion))}</div>
                                    </div>
                                    {!portionCartItem ? (
                                      <button
                                        onClick={() => addToCart(item, portion)}
                                        className="flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-white"
                                        style={{ backgroundColor: brandColor }}
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                      </button>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => updateQty(item.id, -1, portion)}
                                          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
                                        >
                                          <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="w-5 text-center text-sm font-bold text-slate-950">{portionCartItem.quantity}</span>
                                        <button
                                          onClick={() => updateQty(item.id, 1, portion)}
                                          className="flex h-8 w-8 items-center justify-center rounded-full text-white"
                                          style={{ backgroundColor: brandColor }}
                                        >
                                          <Plus className="h-3 w-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {tenant.invoiceFooter && (
            <div className="mt-6 rounded-[24px] border border-slate-200 bg-white px-5 py-4 text-center text-sm text-slate-500">
              {tenant.invoiceFooter}
            </div>
          )}
        </div>
      </div>

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="relative mx-auto w-full max-w-xl rounded-t-[34px] bg-white p-6 shadow-[0_-20px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-950">Your order</h3>
                <p className="text-sm text-slate-500">{tenant.name}</p>
              </div>
              <button onClick={() => setCartOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-950">{item.menuItem.name}</div>
                    <div className="text-xs text-slate-500">{getPortionLabel(item.portionType)} · {taxEngine?.formatCurrency(item.unitPrice)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.menuItemId, -1, item.portionType || 'full')} className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-4 text-center text-sm font-bold text-slate-950">{item.quantity}</span>
                    <button onClick={() => updateQty(item.menuItemId, 1, item.portionType || 'full')} className="flex h-7 w-7 items-center justify-center rounded-full text-white" style={{ backgroundColor: brandColor }}>
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="w-20 text-right text-sm font-bold text-slate-950">
                    {taxEngine?.formatCurrency(item.unitPrice * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span>{taxEngine?.formatCurrency(subtotal)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-slate-500">
                <span>{taxEngine?.getVatLabel()}</span>
                <span>{taxEngine?.formatCurrency(vatAmount)}</span>
              </div>
              <div className="mt-3 flex justify-between text-lg font-black text-slate-950">
                <span>Total</span>
                <span>{taxEngine?.formatCurrency(total)}</span>
              </div>
            </div>

            <button
              onClick={placeOrder}
              className="mt-6 w-full rounded-[20px] py-4 text-base font-black text-white transition-all"
              style={{ backgroundColor: brandColor }}
            >
              Place Order · {taxEngine?.formatCurrency(total)}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
