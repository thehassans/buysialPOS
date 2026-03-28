'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { MOCK_TENANTS, MOCK_MENU_ITEMS } from '@/lib/mock-data'
import { TaxEngine } from '@/lib/country-config'
import { cn } from '@/lib/utils'
import { Search, Flame, Sparkles, ChefHat, MapPin, Phone, Star, Clock } from 'lucide-react'
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

function formatSAR(amount: number, currency: string) {
  if (currency === 'SAR') {
    return amount.toFixed(2)
  }
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount)
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'radial-gradient(circle at 20% 30%, #0d2f1e 0%, #050b06 60%)' }}>
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center mx-auto animate-pulse">
            <ChefHat className="w-9 h-9 text-emerald-400" />
          </div>
          <p className="text-emerald-300 text-sm font-medium tracking-widest uppercase">Loading Menu…</p>
        </div>
      </div>
    )
  }

  if (!tenant || !tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050b06' }}>
        <div className="text-center text-slate-400 space-y-2">
          <ChefHat className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm">Menu unavailable. Scan the restaurant's QR code again.</p>
        </div>
      </div>
    )
  }

  const priceDisplay = (price: number) => isSAR
    ? <><SARBadge className="text-emerald-400 text-xs" /> <span>{price.toFixed(2)}</span></>
    : <span>{new TaxEngine(tenant.countryCode, tenant.vatRate).formatCurrency(price)}</span>

  return (
    <div className="min-h-screen text-white" style={{ background: 'radial-gradient(ellipse at top left, #0f2a1a 0%, #07120f 40%, #030808 100%)' }}>

      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 60% 0%, ${brandColor}22 0%, transparent 60%)` }} />
        <div className="mx-auto max-w-2xl px-5 pt-10 pb-8">
          <div
            className="relative rounded-[32px] border overflow-hidden p-6"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)' }}
          >
            <div className="flex items-center gap-5">
              {/* Logo */}
              <div
                className="w-20 h-20 rounded-[22px] flex-shrink-0 overflow-hidden border flex items-center justify-center text-2xl font-black"
                style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)' }}
              >
                {tenant.logo ? (
                  <img src={tenant.logo} alt={tenant.name} className="w-full h-full object-cover" />
                ) : (
                  tenant.name.charAt(0)
                )}
              </div>
              {/* Info */}
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-black text-white leading-tight truncate">{tenant.name}</h1>
                {tenant.address && (
                  <p className="text-slate-400 text-xs mt-1 flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: brandColor }} />
                    {tenant.address}
                  </p>
                )}
                {tenant.phone && (
                  <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 flex-shrink-0" style={{ color: brandColor }} />
                    {tenant.phone}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
                    style={{ color: brandColor, borderColor: `${brandColor}44`, background: `${brandColor}11` }}
                  >
                    {isSAR ? 'ر.س SAR Menu' : `${tenant.currency} Menu`}
                  </span>
                  <span className="text-[10px] text-slate-500">· View Only</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-2xl px-5 pb-16">

        {/* Search */}
        <div
          className="mb-5 flex items-center gap-3 px-4 py-3 rounded-2xl border"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search dishes…"
            className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-600 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-500 hover:text-white text-xs">✕</button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          <button
            onClick={() => setActiveCategory('all')}
            className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={activeCategory === 'all'
              ? { background: brandColor, color: '#fff' }
              : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            All
          </button>
          {availableCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={activeCategory === cat.id
                ? { background: brandColor, color: '#fff' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>

        {/* Items count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">
            {filtered.length} {filtered.length === 1 ? 'dish' : 'dishes'}
          </p>
          <p className="text-slate-600 text-xs">Prices excl. VAT</p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-16 text-slate-600 text-sm animate-pulse">Loading menu…</div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500 text-sm">No dishes found.</p>
          </div>
        )}

        {/* Menu items */}
        {!isLoading && (
          <div className="space-y-3">
            {filtered.map(item => (
              <div
                key={item.id}
                className="group flex gap-4 p-4 rounded-[24px] border transition-all hover:border-white/12"
                style={{ background: 'rgba(255,255,255,0.035)', borderColor: 'rgba(255,255,255,0.07)' }}
              >
                {/* Image */}
                <div className="w-24 h-24 rounded-[18px] overflow-hidden flex-shrink-0 bg-white/5">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {item.isPopular && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Flame className="w-2.5 h-2.5" /> Popular
                      </span>
                    )}
                    {item.isNew && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Sparkles className="w-2.5 h-2.5" /> New
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <h3 className="font-bold text-white text-[15px] leading-snug">{item.name}</h3>
                  {item.nameAr && (
                    <p className="text-slate-500 text-xs mt-0.5" dir="rtl">{item.nameAr}</p>
                  )}

                  {/* Description */}
                  {item.description && (
                    <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                  )}

                  {/* Meta + price */}
                  <div className="mt-2.5 flex items-end justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {item.preparationTime ? (
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Clock className="w-3 h-3" /> {item.preparationTime} min
                        </span>
                      ) : null}
                      {item.calories ? (
                        <span className="text-[10px] text-slate-500">{item.calories} kcal</span>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-lg font-black" style={{ color: brandColor }}>
                        {isSAR ? (
                          <>
                            <SARBadge className="text-sm" />
                            <span>{item.price.toFixed(2)}</span>
                          </>
                        ) : (
                          <span>{new TaxEngine(tenant.countryCode, tenant.vatRate).formatCurrency(item.price)}</span>
                        )}
                      </div>
                      {item.hasHalfPlate && item.halfPlatePrice && (
                        <div className="text-[10px] text-amber-500/70 font-semibold mt-0.5">
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
          <div className="mt-10 text-center text-slate-600 text-xs">{tenant.invoiceFooter}</div>
        )}
        <div className="mt-6 text-center">
          <p className="text-slate-700 text-[10px] font-semibold uppercase tracking-[0.2em]">Powered by Buysial ERP</p>
        </div>
      </main>

      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
