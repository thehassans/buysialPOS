'use client'

import { useState } from 'react'
import { MOCK_TENANTS, SUBSCRIPTION_PLANS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { Building2, Plus, Search, CheckCircle, XCircle, Crown } from 'lucide-react'
import { Tenant } from '@/lib/types'

export default function TenantsModule() {
  const [search, setSearch] = useState('')
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)

  const filtered = MOCK_TENANTS.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.countryCode.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Tenant Management</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-all">
          <Plus className="w-4 h-4" /> Add Tenant
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total Tenants', value: MOCK_TENANTS.length, color: 'text-gray-900' },
          { label: 'Active', value: MOCK_TENANTS.filter(t => t.isActive).length, color: 'text-emerald-600' },
          { label: '🇸🇦 KSA', value: MOCK_TENANTS.filter(t => t.countryCode === 'KSA').length, color: 'text-green-700' },
          { label: '🇦🇪 UAE', value: MOCK_TENANTS.filter(t => t.countryCode === 'UAE').length, color: 'text-blue-700' },
          { label: '🇴🇲 Oman', value: MOCK_TENANTS.filter(t => t.countryCode === 'OMN').length, color: 'text-red-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-200 text-center">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tenants..."
          className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl shadow-sm text-sm text-gray-900 placeholder-emerald-700 border border-gray-200 focus:outline-none focus:border-emerald-600"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Restaurant', 'Country', 'Subscription', 'VAT', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-emerald-600 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(tenant => (
                <tr key={tenant.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center text-gray-900 font-bold text-xs flex-shrink-0">
                        {tenant.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-gray-900 text-sm font-medium">{tenant.name}</div>
                        <div className="text-emerald-600 text-xs">{tenant.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-700 text-sm">
                      {tenant.countryCode === 'KSA' ? '🇸🇦 KSA' : tenant.countryCode === 'UAE' ? '🇦🇪 UAE' : '🇴🇲 Oman'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-medium border',
                      tenant.subscriptionPlan === 'enterprise' ? 'bg-amber-50 text-amber-700 border-gold-800/30' :
                      tenant.subscriptionPlan === 'professional' ? 'bg-emerald-50 text-emerald-700 border-gray-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    )}>
                      {tenant.subscriptionPlan === 'enterprise' && <Crown className="w-2.5 h-2.5 inline mr-0.5" />}
                      {tenant.subscriptionPlan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-emerald-600 text-sm">{(tenant.vatRate * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3">
                    {tenant.isActive ? (
                      <div className="flex items-center gap-1 text-xs text-emerald-700">
                        <CheckCircle className="w-3.5 h-3.5" /> Active
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-red-400">
                        <XCircle className="w-3.5 h-3.5" /> Inactive
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-emerald-600 text-xs">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedTenant(tenant)}
                        className="px-2.5 py-1 bg-white rounded-lg shadow-sm text-xs text-emerald-600 border border-gray-200 hover:text-emerald-700 hover:border-emerald-200 transition-all"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tenant Detail Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedTenant(null)} />
          <div className="bg-white rounded-3xl shadow-sm p-8 w-full max-w-lg relative z-10 border border-emerald-200 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-gray-900 font-black text-xl">
                  {selectedTenant.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedTenant.name}</h2>
                  <p className="text-emerald-500 text-sm">
                    {selectedTenant.countryCode === 'KSA' ? '🇸🇦 Saudi Arabia' : selectedTenant.countryCode === 'UAE' ? '🇦🇪 United Arab Emirates' : '🇴🇲 Oman'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedTenant(null)} className="text-emerald-600 hover:text-emerald-600 text-xl">×</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Email', value: selectedTenant.email },
                { label: 'Phone', value: selectedTenant.phone },
                { label: 'VAT Number', value: selectedTenant.vatNumber || '—' },
                { label: 'Currency', value: selectedTenant.currency },
                { label: 'VAT Rate', value: `${(selectedTenant.vatRate * 100).toFixed(0)}%` },
                { label: 'Plan', value: selectedTenant.subscriptionPlan },
              ].map(f => (
                <div key={f.label}>
                  <div className="text-emerald-600 text-xs font-medium">{f.label}</div>
                  <div className="text-gray-900 text-sm mt-0.5">{f.value}</div>
                </div>
              ))}
            </div>

            <div>
              <div className="text-emerald-600 text-xs font-medium mb-1">Address</div>
              <div className="text-gray-900 text-sm">{selectedTenant.address}</div>
            </div>

            <div className="flex gap-2 pt-2">
              <button className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-all">
                Edit Tenant
              </button>
              <button className={cn(
                'flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all border',
                selectedTenant.isActive
                  ? 'glass text-red-400 border-red-200 hover:bg-red-50'
                  : 'glass text-emerald-600 border-gray-200 hover:bg-emerald-50'
              )}>
                {selectedTenant.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
