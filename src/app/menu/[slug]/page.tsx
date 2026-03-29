'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { MOCK_TENANTS, MOCK_MENU_ITEMS } from '@/lib/mock-data'
import { TaxEngine } from '@/lib/country-config'
import { cn } from '@/lib/utils'
import { Search, Flame, Sparkles, ChefHat, MapPin, Phone, Clock } from 'lucide-react'
import { Category, MenuItem, Tenant } from '@/lib/types'

// ── SAR symbol per SAMA 2023 standard ──────────────────────────────────────
function SARBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-flex items-center justify-center font-bold', className)}
      title="Saudi Riyal (SAR)"
      aria-label="SAR"
    >
      ر.س
    </span>
  )
}

function buildTenantFromQuery(searchParams: URLSearchParams, slug: string): Tenant | null {
  const tenantId = searchParams.get('tenantId')
  const name = searchParams.get('name')
  if (!tenantId || !name) return null
  const countryCode = (searchParams.get('countryCode') as Tenant['countryCode']) || 'KSA'
  const currency = (searchParams.get('currency') as Tenant['currency']) || 'SAR'
  const vatRate = Number(searchParams.get('vatRate') || 0.15)
  return {
    id: tenantId, name, slug,
    logo: searchParams.get('logo') || '/logo.png',
    countryCode, currency,
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

function formatCategoryName(id: string) {
  return id.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function PublicMenuPage({ params }: { params: { slug: string } }) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [remoteTenant, setRemoteTenant] = useState<Tenant | null>(null)
  const [tenantLookupPending, setTenantLookupPending] = useState(true)
  const searchParams = useSearchParams()

  const slug = decodeURIComponent(params.slug)
  const tenantIdFromQuery = searchParams.get('tenantId')
  const queryTenant = useMemo(() => buildTenantFromQuery(searchParams, slug), [searchParams, slug])
  const fallbackTenant = useMemo(() => MOCK_TENANTS.find(t => t.slug === slug) || null, [slug])
  const tenant = useMemo(() => remoteTenant || queryTenant || fallbackTenant, [fallbackTenant, queryTenant, remoteTenant])
  const tenantId = tenantIdFromQuery || tenant?.id || null
  const brandColor = tenant?.primaryColor || '#059669'
  const isSAR = tenant?.currency === 'SAR'

  useEffect(() => {
    let cancelled = false
    setRemoteTenant(null)
    setTenantLookupPending(true)
    const loadTenant = async () => {
      if (queryTenant || fallbackTenant) { if (!cancelled) setTenantLookupPending(false); return }
      try {
        const res = await fetch('/api/tenants', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled || !Array.isArray(data)) return
        const match = data.find((t: Tenant) => t.id === tenantIdFromQuery || t.slug === slug)
        if (match) setRemoteTenant({ ...match, createdAt: new Date(match.createdAt), validUntil: match.validUntil ? new Date(match.validUntil) : undefined })
      } catch {} finally { if (!cancelled) setTenantLookupPending(false) }
    }
    loadTenant()
    return () => { cancelled = true }
  }, [fallbackTenant, queryTenant, slug, tenantIdFromQuery])

  useEffect(() => {
    if (!tenantId) { if (!tenantLookupPending) setIsLoading(false); return }
    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      try {
        const [menuRes, catRes] = await Promise.all([
          fetch(`/api/menu-items?tenantId=${encodeURIComponent(tenantId)}`),
          fetch(`/api/categories?tenantId=${encodeURIComponent(tenantId)}`),
        ])
        if (!menuRes.ok) throw new Error()
        const [menuData, catData] = await Promise.all([menuRes.json(), catRes.ok ? catRes.json() : Promise.resolve([])])
        if (cancelled) return
        const items = Array.isArray(menuData) ? menuData.filter((i: MenuItem) => i.tenantId === tenantId && i.isAvailable) : []
        const cats = Array.isArray(catData) ? catData.filter((c: Category) => c.tenantId === tenantId) : []
        setCategories(cats)
        setMenuItems(items.length > 0 ? items : MOCK_MENU_ITEMS.filter(i => i.tenantId === tenantId && i.isAvailable))
      } catch {
        if (!cancelled) setMenuItems(MOCK_MENU_ITEMS.filter(i => i.tenantId === tenantId && i.isAvailable))
      } finally { if (!cancelled) setIsLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [tenantId, tenantLookupPending])

  const availableCategories = useMemo(() => {
    const scoped = categories.filter(c => menuItems.some(i => i.categoryId === c.id))
    if (scoped.length > 0) return scoped
    return Array.from(new Set(menuItems.map(i => i.categoryId).filter(Boolean))).map((id, idx) => ({
      id, tenantId: tenantId || 'public', name: formatCategoryName(id), nameAr: undefined,
      icon: ['🍽️','🥗','🥘','🍰','🥤'][idx % 5], sortOrder: idx + 1, isActive: true,
    }))
  }, [categories, menuItems, tenantId])

  const filtered = useMemo(() => menuItems.filter(item => {
    const matchCat = activeCategory === 'all' || item.categoryId === activeCategory
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || (item.nameAr && item.nameAr.includes(search))
    return matchCat && matchSearch && item.isAvailable
  }), [menuItems, activeCategory, search])

  // ── Loading state ───────────────────────────────────────────────────────
  if (tenantLookupPending && !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center mx-auto animate-pulse">
            <ChefHat className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-400 text-[11px] font-medium tracking-[0.2em] uppercase">Loading Menu…</p>
        </div>
      </div>
    )
  }

  if (!tenant || !tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <div className="text-center text-gray-400 space-y-4">
          <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto">
            <ChefHat className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-sm">Menu unavailable. Please scan the QR code again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-slate-900 bg-[#fdfdfc] font-sans transition-colors selection:bg-emerald-100 selection:text-emerald-900">

      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-white border-b border-gray-100 pb-8 pt-12">
        <div className="mx-auto max-w-2xl px-5">
          <div className="flex flex-col items-center text-center">
            {/* Logo */}
            <div
              className="w-24 h-24 rounded-full flex-shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center text-3xl font-black bg-white shadow-sm mb-6 pb-0.5"
              style={{ color: brandColor }}
            >
              {tenant.logo ? (
                <img src={tenant.logo} alt={tenant.name} className="w-full h-full object-cover" />
              ) : (
                tenant.name.charAt(0)
              )}
            </div>
            {/* Info */}
            <div className="max-w-md w-full">
              <h1 className="text-3xl tracking-tight font-light text-slate-900 leading-tight mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                {tenant.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-slate-500 text-[11px] uppercase tracking-wider">
                {tenant.address && (
                  <p className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5" style={{ color: brandColor }} />
                    {tenant.address}
                  </p>
                )}
                {tenant.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" style={{ color: brandColor }} />
                    {tenant.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-8">

        {/* Search */}
        <div className="relative mb-8 max-w-md mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search our offerings…"
            className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-full text-[13px] text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-shadow"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex justify-center flex-wrap gap-2.5 mb-10">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              "px-5 py-2 rounded-full text-[11px] font-semibold tracking-wide uppercase transition-all whitespace-nowrap",
              activeCategory === 'all'
                ? "bg-slate-900 text-white shadow-md border border-transparent"
                : "bg-white text-slate-600 border border-gray-200 hover:border-gray-300 hover:text-slate-900"
            )}
            style={activeCategory === 'all' ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
          >
            All Items
          </button>
          {availableCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-5 py-2 rounded-full text-[11px] font-semibold tracking-wide uppercase transition-all whitespace-nowrap flex items-center gap-2",
                activeCategory === cat.id
                  ? "bg-slate-900 text-white shadow-md border border-transparent"
                  : "bg-white text-slate-600 border border-gray-200 hover:border-gray-300 hover:text-slate-900"
              )}
              style={activeCategory === cat.id ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>

        {/* Header line */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px bg-gray-200 flex-1" />
          <p className="text-gray-400 text-[10px] uppercase font-bold tracking-[0.2em] whitespace-nowrap">
            {activeCategory === 'all' ? 'Menu Array' : availableCategories.find(c => c.id === activeCategory)?.name}
          </p>
          <div className="h-px bg-gray-200 flex-1" />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-24 text-gray-400 text-[11px] uppercase tracking-widest animate-pulse">Curating menu…</div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-24">
            <p className="text-gray-400 text-sm">No dishes found in this category.</p>
          </div>
        )}

        {/* Menu items */}
        {!isLoading && (
          <div className="grid gap-6">
            {filtered.map(item => (
              <div
                key={item.id}
                className="group flex gap-5 p-5 bg-white rounded-3xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
              >
                {/* Image */}
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[20px] overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl opacity-50">🍽️</div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col py-1">
                  
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {item.isPopular && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
                        <Flame className="w-2.5 h-2.5" /> Chef's Pick
                      </span>
                    )}
                    {item.isNew && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                        <Sparkles className="w-2.5 h-2.5" /> Debut
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="text-lg text-slate-900 leading-snug" style={{ fontFamily: 'Georgia, serif' }}>{item.name}</h3>
                  {item.nameAr && (
                    <p className="text-gray-500 text-xs mt-1" dir="rtl">{item.nameAr}</p>
                  )}

                  {/* Description */}
                  {item.description && (
                    <p className="text-gray-500 text-[13px] mt-2 line-clamp-2 leading-relaxed font-light">{item.description}</p>
                  )}

                  <div className="flex-1" />

                  {/* Meta + price */}
                  <div className="mt-4 flex items-end justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      {item.preparationTime ? (
                        <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium tracking-wide">
                          <Clock className="w-3.5 h-3.5" /> {item.preparationTime}m
                        </span>
                      ) : null}
                      {item.calories ? (
                        <span className="text-[11px] text-gray-400 font-medium tracking-wide">{item.calories} cal</span>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-[17px] font-medium tracking-tight text-slate-900">
                        {isSAR ? (
                          <>
                            <SARBadge className="text-xs text-gray-400 mr-0.5 font-normal" />
                            <span>{item.price.toFixed(2)}</span>
                          </>
                        ) : (
                          <span>{new TaxEngine(tenant.countryCode, tenant.vatRate).formatCurrency(item.price)}</span>
                        )}
                      </div>
                      {item.hasHalfPlate && item.halfPlatePrice && (
                        <div className="text-[11px] text-gray-500 mt-1">
                          Half {isSAR ? `ر.س ${item.halfPlatePrice.toFixed(2)}` : new TaxEngine(tenant.countryCode, tenant.vatRate).formatCurrency(item.halfPlatePrice)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {tenant.invoiceFooter && (
          <div className="mt-16 text-center text-gray-400 text-xs font-serif italic max-w-xs mx-auto">
            "{tenant.invoiceFooter}"
          </div>
        )}
        <div className="mt-12 text-center pb-8 border-t border-gray-100 pt-8">
          <p className="text-gray-400 text-[9px] font-bold uppercase tracking-[0.25em]">
            Menu powered by <span className="text-emerald-600">Buysial</span>
          </p>
        </div>
      </main>
    </div>
  )
}
