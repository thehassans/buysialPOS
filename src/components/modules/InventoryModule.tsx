'use client'

import { useState } from 'react'
import { MOCK_SUPPLIERS } from '@/lib/mock-data'
import { useAppStore } from '@/store/app-store'
import { InventoryItem } from '@/lib/types'
import { cn, formatCurrency, getCurrencySymbol } from '@/lib/utils'
import { Package, AlertTriangle, Plus, Search, Truck, Pencil, Trash2, X, Save } from 'lucide-react'

const EMPTY_FORM: Partial<InventoryItem> = {
  name: '',
  nameAr: '',
  unit: 'kg',
  quantity: 0,
  minQuantity: 0,
  costPerUnit: 0,
  category: '',
  supplierId: '',
}

export default function InventoryModule() {
  const { currentTenant, inventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useAppStore()
  const [tab, setTab] = useState<'inventory' | 'suppliers'>('inventory')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<InventoryItem>>({ ...EMPTY_FORM })

  if (!currentTenant) return null

  const tenantInventory = inventoryItems.filter(item => item.tenantId === currentTenant.id)
  const tenantSuppliers = MOCK_SUPPLIERS.filter(supplier => supplier.tenantId === currentTenant.id)
  const currencySymbol = getCurrencySymbol(currentTenant.currency)
  const filtered = tenantInventory.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase()) ||
    (item.nameAr && item.nameAr.includes(search))
  )
  const lowStock = tenantInventory.filter(item => item.quantity <= item.minQuantity)

  const openAdd = () => {
    setEditingItem(null)
    setForm({ ...EMPTY_FORM })
    setShowModal(true)
  }

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setForm({ ...item })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.name || !form.category || !form.unit) return
    if (editingItem) {
      updateInventoryItem(editingItem.id, {
        ...form,
        quantity: Number(form.quantity) || 0,
        minQuantity: Number(form.minQuantity) || 0,
        costPerUnit: Number(form.costPerUnit) || 0,
        lastRestocked: new Date(),
      })
    } else {
      addInventoryItem({
        id: `inv-${Date.now()}`,
        tenantId: currentTenant.id,
        name: form.name,
        nameAr: form.nameAr,
        unit: form.unit,
        quantity: Number(form.quantity) || 0,
        minQuantity: Number(form.minQuantity) || 0,
        costPerUnit: Number(form.costPerUnit) || 0,
        category: form.category,
        supplierId: form.supplierId || undefined,
        lastRestocked: new Date(),
      })
    }
    setShowModal(false)
    setEditingItem(null)
    setForm({ ...EMPTY_FORM })
  }

  const handleDelete = (id: string) => {
    deleteInventoryItem(id)
    setDeleteConfirm(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Inventory Management</h2>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-all">
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
                    {['Item', 'Category', 'Stock', 'Min Stock', 'Unit Cost', 'Status', 'Last Restocked', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-emerald-600 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => {
                    const isLow = item.quantity <= item.minQuantity
                    const pct = item.minQuantity > 0 ? Math.min(100, (item.quantity / item.minQuantity) * 100) : 100
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
                        <td className="px-4 py-3 text-emerald-700 text-sm">{formatCurrency(item.costPerUnit, currentTenant.currency)}</td>
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
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteConfirm(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <div className="text-slate-500 text-sm font-medium">No inventory items yet</div>
              <button onClick={openAdd} className="mt-3 text-sm text-emerald-600 hover:text-emerald-700">
                + Add your first inventory item
              </button>
            </div>
          )}
        </>
      )}

      {tab === 'suppliers' && (
        <div className="grid md:grid-cols-2 gap-4">
          {tenantSuppliers.map(supplier => (
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
          {tenantSuppliers.length === 0 && (
            <div className="md:col-span-2 bg-white rounded-2xl shadow-sm p-8 border border-gray-200 text-center text-slate-500 text-sm">
              No suppliers configured for this tenant yet.
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">{editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Item Name *</label>
                <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Arabic Name</label>
                <input value={form.nameAr || ''} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} dir="rtl" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Category *</label>
                <input value={form.category || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400" placeholder="Meat, Seafood, Dry Goods..." />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Unit *</label>
                <input value={form.unit || ''} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400" placeholder="kg, L, pcs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Quantity</label>
                <input type="number" min="0" value={form.quantity ?? ''} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) || 0 }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Minimum Stock</label>
                <input type="number" min="0" value={form.minQuantity ?? ''} onChange={e => setForm(f => ({ ...f, minQuantity: Number(e.target.value) || 0 }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-600 block mb-1">Unit Cost ({currencySymbol})</label>
                <input type="number" min="0" step="0.01" value={form.costPerUnit ?? ''} onChange={e => setForm(f => ({ ...f, costPerUnit: Number(e.target.value) || 0 }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400" />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-slate-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={!form.name || !form.category || !form.unit} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> {editingItem ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="font-bold text-gray-900">Delete Inventory Item?</h3>
            <p className="text-slate-500 text-sm">This will permanently remove the item.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-slate-600">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
