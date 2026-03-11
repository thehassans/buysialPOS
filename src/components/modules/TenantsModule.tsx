'use client'

import { useState } from 'react'
import { MOCK_TENANTS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { Plus, Search, CheckCircle, XCircle, Crown, X, Edit2, LogIn } from 'lucide-react'
import { Tenant, CountryCode, Currency, SubscriptionPlan } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/app-store'

const EMPTY_FORM = {
  name: '', slug: '', email: '', phone: '', address: '',
  countryCode: 'KSA' as CountryCode, currency: 'SAR' as Currency,
  vatRate: 0.15, vatNumber: '', subscriptionPlan: 'starter' as SubscriptionPlan,
  isActive: true, primaryColor: '#059669', validUntil: '', adminPassword: ''
}

const COUNTRY_OPTIONS: { code: CountryCode; label: string; currency: Currency; vat: number }[] = [
  { code: 'KSA', label: '🇸🇦 Saudi Arabia', currency: 'SAR', vat: 0.15 },
  { code: 'UAE', label: '🇦🇪 United Arab Emirates', currency: 'AED', vat: 0.05 },
  { code: 'OMN', label: '🇴🇲 Oman', currency: 'OMR', vat: 0.05 },
]

const PLAN_OPTIONS: SubscriptionPlan[] = ['starter', 'professional', 'enterprise']

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
    {children}
  </div>
)

const inputCls = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none bg-gray-50 focus:bg-white transition-colors"
const selectCls = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none bg-gray-50 focus:bg-white transition-colors"

export default function TenantsModule() {
  const router = useRouter()
  const { tenants, addTenant, updateTenant, loginAs } = useAppStore()
  const [search, setSearch] = useState('')
  const [viewTenant, setViewTenant] = useState<Tenant | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.countryCode.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setViewTenant(null)
    setShowForm(true)
  }

  const openEdit = (t: Tenant) => {
    setEditingId(t.id)
    setForm({
      name: t.name, slug: t.slug, email: t.email, phone: t.phone,
      address: t.address, countryCode: t.countryCode, currency: t.currency,
      vatRate: t.vatRate, vatNumber: t.vatNumber || '',
      subscriptionPlan: t.subscriptionPlan, isActive: t.isActive,
      primaryColor: t.primaryColor || '#059669',
      validUntil: t.validUntil ? new Date(t.validUntil).toISOString().split('T')[0] : '',
      adminPassword: t.adminPassword || ''
    })
    setViewTenant(null)
    setShowForm(true)
  }

  const handleCountryChange = (code: CountryCode) => {
    const c = COUNTRY_OPTIONS.find(o => o.code === code)!
    setForm(f => ({ ...f, countryCode: code, currency: c.currency, vatRate: c.vat }))
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) return
    if (editingId) {
      updateTenant(editingId, {
        ...form,
        vatRate: Number(form.vatRate),
        validUntil: form.validUntil ? new Date(form.validUntil) : undefined
      })
    } else {
      const newTenant: Tenant = {
        id: `t${Date.now()}`,
        ...form,
        vatRate: Number(form.vatRate),
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
        createdAt: new Date(),
        validUntil: form.validUntil ? new Date(form.validUntil) : undefined,
        invoiceFooter: 'Thank you for dining with us!',
      }
      addTenant(newTenant)
    }
    setShowForm(false)
    setEditingId(null)
  }

  const toggleStatus = (id: string) => {
    const t = tenants.find(x => x.id === id)
    if (t) updateTenant(id, { isActive: !t.isActive })
    if (viewTenant?.id === id) setViewTenant(v => v ? { ...v, isActive: !v.isActive } : v)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Tenant Management</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Tenant
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Tenants', value: tenants.length, color: 'text-gray-900' },
          { label: 'Active', value: tenants.filter(t => t.isActive).length, color: 'text-emerald-600' },
          { label: '🇸🇦 KSA', value: tenants.filter(t => t.countryCode === 'KSA').length, color: 'text-green-700' },
          { label: '🇦🇪 UAE', value: tenants.filter(t => t.countryCode === 'UAE').length, color: 'text-blue-700' },
          { label: '🇴🇲 Oman', value: tenants.filter(t => t.countryCode === 'OMN').length, color: 'text-red-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-200 text-center">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tenants..."
          className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl shadow-sm text-sm text-gray-900 placeholder-slate-400 border border-gray-200 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Restaurant', 'Country', 'Subscription', 'VAT', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-emerald-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(tenant => (
                <tr key={tenant.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {tenant.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-gray-900 text-sm font-medium">{tenant.name}</div>
                        <div className="text-slate-500 text-xs">{tenant.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700 text-sm">
                    {tenant.countryCode === 'KSA' ? '🇸🇦 KSA' : tenant.countryCode === 'UAE' ? '🇦🇪 UAE' : '🇴🇲 Oman'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-semibold border inline-flex items-center gap-1',
                      tenant.subscriptionPlan === 'enterprise' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        tenant.subscriptionPlan === 'professional' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                    )}>
                      {tenant.subscriptionPlan === 'enterprise' && <Crown className="w-2.5 h-2.5" />}
                      {tenant.subscriptionPlan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 text-sm">{(tenant.vatRate * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3">
                    {tenant.isActive ? (
                      <div className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Active
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-red-500 font-medium">
                        <XCircle className="w-3.5 h-3.5" /> Inactive
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          loginAs('admin', tenant.id)
                          router.push('/dashboard?role=admin')
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg text-xs text-blue-600 font-medium border border-blue-200 hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm transition-all"
                      >
                        <LogIn className="w-3 h-3" /> Login As
                      </button>
                      <button
                        onClick={() => setViewTenant(tenant)}
                        className="px-2.5 py-1 bg-white rounded-lg text-xs text-emerald-600 font-medium border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEdit(tenant)}
                        className="p-1.5 bg-white rounded-lg text-slate-400 border border-gray-200 hover:text-emerald-600 hover:border-emerald-300 transition-all"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Detail Modal */}
      {viewTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewTenant(null)} />
          <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-lg relative z-10 border border-gray-200 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-black text-xl">
                  {viewTenant.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{viewTenant.name}</h2>
                  <p className="text-slate-500 text-sm">
                    {viewTenant.countryCode === 'KSA' ? '🇸🇦 Saudi Arabia' : viewTenant.countryCode === 'UAE' ? '🇦🇪 UAE' : '🇴🇲 Oman'}
                  </p>
                </div>
              </div>
              <button onClick={() => setViewTenant(null)} className="text-slate-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Email', value: viewTenant.email },
                { label: 'Phone', value: viewTenant.phone },
                { label: 'VAT Number', value: viewTenant.vatNumber || '—' },
                { label: 'Currency', value: viewTenant.currency },
                { label: 'VAT Rate', value: `${(viewTenant.vatRate * 100).toFixed(0)}%` },
                { label: 'Plan', value: viewTenant.subscriptionPlan },
                { label: 'Valid Until', value: viewTenant.validUntil ? new Date(viewTenant.validUntil).toLocaleDateString() : 'Lifetime' },
                { label: 'Admin Password', value: viewTenant.adminPassword ? '••••••••' : 'Not Set' },
              ].map(f => (
                <div key={f.label} className="bg-gray-50 rounded-xl p-3">
                  <div className="text-slate-500 text-xs font-medium">{f.label}</div>
                  <div className="text-gray-900 text-sm font-semibold mt-0.5">{f.value}</div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-slate-500 text-xs font-medium mb-1">Address</div>
              <div className="text-gray-900 text-sm">{viewTenant.address}</div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => openEdit(viewTenant)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all"
              >
                Edit Tenant
              </button>
              <button
                onClick={() => { toggleStatus(viewTenant.id); setViewTenant(null) }}
                className={cn(
                  'flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all border',
                  viewTenant.isActive
                    ? 'text-red-600 border-red-200 hover:bg-red-50 bg-white'
                    : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50 bg-white'
                )}
              >
                {viewTenant.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl relative z-10 border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Tenant' : 'Add New Tenant'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="col-span-1 sm:col-span-1 lg:col-span-3">
                  <Field label="Restaurant Name *">
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Al Fanar Restaurant" />
                  </Field>
                </div>
                <div className="col-span-1 sm:col-span-1 lg:col-span-3">
                  <Field label="Slug (URL identifier)">
                    <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className={inputCls} placeholder="al-fanar" />
                  </Field>
                </div>
                <div className="col-span-1 sm:col-span-1 lg:col-span-3">
                  <Field label="Email *">
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} placeholder="info@restaurant.com" />
                  </Field>
                </div>
                <div className="col-span-1 sm:col-span-1 lg:col-span-3">
                  <Field label="Phone">
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} placeholder="+966-11-123-4567" />
                  </Field>
                </div>
                <div className="col-span-1 sm:col-span-2 lg:col-span-4">
                  <Field label="Address">
                    <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className={inputCls} placeholder="King Fahd Road, Riyadh, KSA" />
                  </Field>
                </div>
                <div className="col-span-1 sm:col-span-2 lg:col-span-2">
                  <Field label="Admin Password">
                    <input type="password" value={form.adminPassword} onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))} className={inputCls} placeholder="Leave blank for none" />
                  </Field>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Country">
                  <select value={form.countryCode} onChange={e => handleCountryChange(e.target.value as CountryCode)} className={selectCls}>
                    {COUNTRY_OPTIONS.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="VAT Number">
                  <input value={form.vatNumber} onChange={e => setForm(f => ({ ...f, vatNumber: e.target.value }))} className={inputCls} placeholder="300012345600003" />
                </Field>
                <Field label="VAT Rate">
                  <select value={form.vatRate} onChange={e => setForm(f => ({ ...f, vatRate: Number(e.target.value) }))} className={selectCls}>
                    <option value={0.05}>5%</option>
                    <option value={0.15}>15%</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Subscription Plan">
                  <select value={form.subscriptionPlan} onChange={e => setForm(f => ({ ...f, subscriptionPlan: e.target.value as SubscriptionPlan }))} className={selectCls}>
                    {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </Field>
                <Field label="Expiration Date">
                  <input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="Status">
                  <select value={form.isActive ? 'active' : 'inactive'} onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'active' }))} className={selectCls}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </Field>
              </div>
            </div>

            <div className="flex gap-3 px-8 py-5 border-t border-gray-100 bg-gray-50">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-slate-600 hover:bg-gray-100 transition-all bg-white">
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all"
              >
                {editingId ? 'Save Changes' : 'Create Tenant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
