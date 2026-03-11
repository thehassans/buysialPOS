'use client'

import { useState } from 'react'
import { MOCK_INVENTORY, MOCK_SUPPLIERS } from '@/lib/mock-data'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'
import { Package, AlertTriangle, Plus, Search, Truck, TrendingDown } from 'lucide-react'

export default function InventoryModule() {
  const { currentTenant } = useAppStore()
  const [tab, setTab] = useState<'inventory' | 'suppliers'>('inventory')
  const [search, setSearch] = useState('')

  const filtered = MOCK_INVENTORY.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  )
  const lowStock = filtered.filter(i => i.quantity <= i.minQuantity)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Inventory Management</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-all">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Alerts */}
      {lowStock.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <div className="text-red-600 font-medium text-sm">{lowStock.length} items below minimum stock</div>
            <div className="text-red-600 text-xs">{lowStock.map(i => i.name).join(', ')}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ id: 'inventory', label: 'Stock', icon: Package }, { id: 'suppliers', label: 'Suppliers', icon: Truck }].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              tab === t.id ? 'bg-emerald-700 text-white' : 'glass text-emerald-500 border border-gray-200 hover:text-emerald-700'
            )}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'inventory' && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search inventory..."
              className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl shadow-sm text-sm text-gray-900 placeholder-emerald-700 border border-gray-200 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Item', 'Category', 'Stock', 'Min Stock', 'Unit Cost', 'Status', 'Last Restocked'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-emerald-600 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => {
                    const isLow = item.quantity <= item.minQuantity
                    const pct = Math.min(100, (item.quantity / item.minQuantity) * 100)
                    return (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-gray-900 font-medium text-sm">{item.name}</div>
                          {item.nameAr && <div className="text-emerald-600 text-xs" dir="rtl">{item.nameAr}</div>}
                        </td>
                        <td className="px-4 py-3 text-emerald-500 text-sm">{item.category}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={cn('font-bold text-sm', isLow ? 'text-red-600' : 'text-gray-900')}>
                              {item.quantity} {item.unit}
                            </span>
                          </div>
                          <div className="h-1.5 w-20 bg-emerald-100 rounded-full mt-1">
                            <div
                              className={cn('h-full rounded-full', isLow ? 'bg-red-500' : 'bg-emerald-500')}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-emerald-500 text-sm">{item.minQuantity} {item.unit}</td>
                        <td className="px-4 py-3 text-emerald-700 text-sm">{currentTenant?.currency || 'SAR'} {item.costPerUnit}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'text-[10px] px-2 py-0.5 rounded-full font-medium border',
                            isLow ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-700 border-gray-200'
                          )}>
                            {isLow ? '⚠ Low Stock' : '✓ OK'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-emerald-600 text-xs">
                          {item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'suppliers' && (
        <div className="grid md:grid-cols-2 gap-4">
          {MOCK_SUPPLIERS.map(supplier => (
            <div key={supplier.id} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200 hover:border-emerald-200 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-gray-900 font-bold">{supplier.name}</h3>
                  <div className="text-emerald-500 text-xs mt-0.5">{supplier.category}</div>
                </div>
                <Truck className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="text-emerald-600">📞 {supplier.phone}</div>
                {supplier.email && <div className="text-emerald-600">✉️ {supplier.email}</div>}
                <div className="text-emerald-600">👤 {supplier.contact}</div>
              </div>
            </div>
          ))}
          <button className="bg-white rounded-2xl shadow-sm p-5 border border-dashed border-gray-200 hover:border-emerald-200 transition-all flex items-center justify-center gap-2 text-emerald-600 hover:text-emerald-600">
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">Add Supplier</span>
          </button>
        </div>
      )}
    </div>
  )
}
