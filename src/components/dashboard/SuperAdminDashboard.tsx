'use client'

import { useState } from 'react'
import {
  Building2, TrendingUp, Users, DollarSign, Activity,
  Globe, CheckCircle, AlertCircle, ArrowUpRight, Crown,
  MapPin, Zap, Shield
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LineChart, Line
} from 'recharts'
import { MOCK_TENANTS, REVENUE_DATA, SUBSCRIPTION_GROWTH, SUBSCRIPTION_PLANS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const TENANT_MAP_POSITIONS = [
  { id: 't1', x: 48, y: 42, city: 'Riyadh' },
  { id: 't3', x: 41, y: 50, city: 'Riyadh' },
  { id: 't5', x: 34, y: 58, city: 'Jeddah' },
  { id: 't2', x: 70, y: 40, city: 'Dubai' },
  { id: 't4', x: 72, y: 42, city: 'Dubai' },
  { id: 't6', x: 82, y: 54, city: 'Muscat' },
  { id: 't7', x: 85, y: 68, city: 'Salalah' },
]

export default function SuperAdminDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '12m'>('12m')
  const activeTenants = MOCK_TENANTS.filter(t => t.isActive).length
  const totalRevenue = 2089400
  const totalUsers = 87

  const ksaCount = MOCK_TENANTS.filter(t => t.countryCode === 'KSA').length
  const uaeCount = MOCK_TENANTS.filter(t => t.countryCode === 'UAE').length
  const omnCount = MOCK_TENANTS.filter(t => t.countryCode === 'OMN').length

  const statsCards = [
    { label: 'Active Tenants', value: activeTenants, sub: `${MOCK_TENANTS.length} total registered`, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
    { label: 'Platform Revenue', value: `$${(totalRevenue / 1000).toFixed(0)}k`, sub: '+18.4% vs last month', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    { label: 'Total Users', value: totalUsers, sub: 'Across all tenants', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    { label: 'Countries', value: 3, sub: `🇸🇦 ${ksaCount} · 🇦🇪 ${uaeCount} · 🇴🇲 ${omnCount}`, icon: Globe, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Platform Overview</h2>
          <p className="text-slate-500 text-sm mt-1">Super Admin — All Tenants</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '12m'] as const).map(p => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                selectedPeriod === p
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-600 hover:text-emerald-700 border border-gray-200'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map(card => (
          <div key={card.label} className={cn('bg-white rounded-2xl p-5 border shadow-sm', card.bg)}>
            <div className="flex items-start justify-between mb-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', card.bg)}>
                <card.icon className={cn('w-4 h-4', card.color)} />
              </div>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-gray-900 mb-1">{card.value}</div>
            <div className="text-gray-700 text-xs font-medium">{card.label}</div>
            <div className="text-slate-400 text-xs mt-1">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-gray-900 font-semibold mb-4">Platform Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={REVENUE_DATA}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                labelStyle={{ color: '#0f172a' }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Subscription Growth */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-gray-900 font-semibold mb-4">Subscriptions by Tier</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={SUBSCRIPTION_GROWTH} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} labelStyle={{ color: '#0f172a' }} />
              <Bar dataKey="starter" fill="#6ee7b7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="professional" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="enterprise" fill="#d97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {[{ label: 'Starter', color: 'bg-emerald-200' }, { label: 'Pro', color: 'bg-emerald-500' }, { label: 'Enterprise', color: 'bg-gold-500' }].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                <div className={cn('w-2 h-2 rounded-full', l.color)} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tenant Map */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900 font-semibold">Active Restaurants</h3>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Globe className="w-3.5 h-3.5" />
              KSA & UAE
            </div>
          </div>
          {/* Stylized Map */}
          <div className="relative w-full h-52 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl overflow-hidden border border-gray-200">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-1/3 left-1/4 w-48 h-32 bg-emerald-300 rounded-full blur-3xl" />
              <div className="absolute top-1/3 right-1/4 w-32 h-24 bg-amber-300 rounded-full blur-3xl" />
            </div>
            {/* Grid lines */}
            {[25, 50, 75].map(p => (
              <div key={p}>
                <div className="absolute top-0 bottom-0 border-l border-gray-200" style={{ left: `${p}%` }} />
                <div className="absolute left-0 right-0 border-t border-gray-200" style={{ top: `${p}%` }} />
              </div>
            ))}
            {/* Region labels */}
            <div className="absolute top-4 left-4 text-gray-500 text-[10px] font-medium">🇸🇦 Saudi Arabia</div>
            <div className="absolute top-4 right-[30%] text-gray-500 text-[10px] font-medium">🇦🇪 UAE</div>
            <div className="absolute top-4 right-4 text-gray-500 text-[10px] font-medium">🇴🇲 Oman</div>

            {TENANT_MAP_POSITIONS.map(pos => {
              const tenant = MOCK_TENANTS.find(t => t.id === pos.id)
              if (!tenant) return null
              return (
                <div
                  key={pos.id}
                  className="absolute group cursor-pointer"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <div className={cn(
                    'w-3 h-3 rounded-full border-2 transition-all',
                    tenant.isActive
                      ? 'bg-emerald-500 border-emerald-300 shadow-emerald-glow'
                      : 'bg-red-500 border-red-300'
                  )}>
                    {tenant.isActive && <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30" />}
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-white border border-gray-200 shadow-lg rounded-lg p-2 text-xs text-gray-900 whitespace-nowrap z-10">
                    <div className="font-medium">{tenant.name}</div>
                    <div className="text-slate-500">{pos.city} · {tenant.subscriptionPlan}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tenant List */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-gray-900 font-semibold mb-4">Recent Tenants</h3>
          <div className="space-y-3">
            {MOCK_TENANTS.map(tenant => (
              <div key={tenant.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-emerald-50 transition-all cursor-pointer">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {tenant.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-900 text-sm font-medium truncate">{tenant.name}</div>
                  <div className="text-slate-500 text-xs flex items-center gap-1">
                    <span>{tenant.countryCode === 'KSA' ? '🇸🇦' : tenant.countryCode === 'UAE' ? '🇦🇪' : '🇴🇲'} {tenant.countryCode === 'OMN' ? 'Oman' : tenant.countryCode}</span>
                    <span>·</span>
                    <span>{tenant.currency}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                    tenant.subscriptionPlan === 'enterprise' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    tenant.subscriptionPlan === 'professional' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    'bg-blue-50 text-blue-700 border border-blue-200'
                  )}>
                    {tenant.subscriptionPlan}
                  </span>
                  <div className={cn('w-1.5 h-1.5 rounded-full', tenant.isActive ? 'bg-emerald-500' : 'bg-red-500')} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
