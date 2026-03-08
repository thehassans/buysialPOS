'use client'

import { useState, useRef } from 'react'
import { useAppStore } from '@/store/app-store'
import { MenuItem } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Plus, Pencil, Trash2, Search, X, Save, ImagePlus,
  Flame, DollarSign, Clock, Tag, Star, Sparkles, Eye, EyeOff
} from 'lucide-react'
import { MOCK_CATEGORIES } from '@/lib/mock-data'

const EMPTY_FORM: Partial<MenuItem> = {
  name: '', nameAr: '', description: '', descriptionAr: '',
  price: 0, calories: 0, preparationTime: 0,
  isAvailable: true, isPopular: false, isNew: false,
  categoryId: '', image: '',
}

async function convertToWebP(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const MAX = 800
      let w = img.width, h = img.height
      if (w > MAX) { h = Math.round(h * MAX / w); w = MAX }
      if (h > MAX) { w = Math.round(w * MAX / h); h = MAX }
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/webp', 0.85))
    }
    img.onerror = reject
    img.src = url
  })
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={cn(
      'relative w-9 h-5 rounded-full transition-all cursor-pointer',
      enabled ? 'bg-emerald-500' : 'bg-gray-200'
    )}>
      <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform', enabled ? 'translate-x-4' : 'translate-x-0.5')} />
    </button>
  )
}

export default function MenuManagementModule() {
  const { currentTenant, menuItems, addMenuItem, updateMenuItem, deleteMenuItem } = useAppStore()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [form, setForm] = useState<Partial<MenuItem>>(EMPTY_FORM)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [converting, setConverting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!currentTenant) return null

  const tenantItems = menuItems.filter(m => m.tenantId === currentTenant.id)
  const categories = MOCK_CATEGORIES.filter(c => c.tenantId === currentTenant.id)

  const filtered = tenantItems.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.nameAr?.includes(search)
    const matchCat = selectedCategory === 'all' || item.categoryId === selectedCategory
    return matchSearch && matchCat
  })

  const openAdd = () => {
    setEditingItem(null)
    setForm({ ...EMPTY_FORM, tenantId: currentTenant.id, categoryId: categories[0]?.id || '' })
    setImagePreview('')
    setShowModal(true)
  }

  const openEdit = (item: MenuItem) => {
    setEditingItem(item)
    setForm({ ...item })
    setImagePreview(item.image || '')
    setShowModal(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setConverting(true)
    try {
      const webp = await convertToWebP(file)
      setImagePreview(webp)
      setForm(f => ({ ...f, image: webp }))
    } catch {
      alert('Image conversion failed. Please try another image.')
    } finally {
      setConverting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleSave = () => {
    if (!form.name || !form.price) return
    if (editingItem) {
      updateMenuItem(editingItem.id, form)
    } else {
      addMenuItem({
        ...form,
        id: `m-${Date.now()}`,
        tenantId: currentTenant.id,
        isAvailable: form.isAvailable ?? true,
        isPopular: form.isPopular ?? false,
        isNew: form.isNew ?? false,
      } as MenuItem)
    }
    setShowModal(false)
  }

  const handleDelete = (id: string) => {
    deleteMenuItem(id)
    setDeleteConfirm(null)
  }

  const itemCount = tenantItems.length
  const availableCount = tenantItems.filter(m => m.isAvailable).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Menu Management</h2>
          <p className="text-slate-500 text-sm mt-0.5">{itemCount} items · {availableCount} available</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-sm text-gray-900 border border-gray-200 focus:outline-none focus:border-emerald-400 shadow-sm"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn('px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap border transition-all', selectedCategory === 'all' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-gray-200 hover:border-emerald-200')}
          >
            All ({itemCount})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn('px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap border transition-all', selectedCategory === cat.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-gray-200 hover:border-emerald-200')}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(item => (
          <div key={item.id} className={cn(
            'bg-white rounded-2xl border shadow-sm overflow-hidden group hover:border-emerald-200 transition-all',
            !item.isAvailable && 'opacity-60'
          )}>
            <div className="relative h-36 bg-gray-100">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                {item.isPopular && <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full">⭐</span>}
                {item.isNew && <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[9px] font-bold rounded-full">NEW</span>}
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={() => openEdit(item)} className="p-2 bg-white rounded-lg text-gray-700 hover:text-emerald-600">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteConfirm(item.id)} className="p-2 bg-white rounded-lg text-gray-700 hover:text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{item.name}</div>
                  {item.nameAr && <div className="text-slate-400 text-xs truncate" dir="rtl">{item.nameAr}</div>}
                </div>
                <div className="text-emerald-600 font-bold text-sm whitespace-nowrap">
                  {currentTenant.currency} {item.price}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                {item.calories && <span className="flex items-center gap-0.5"><Flame className="w-3 h-3" />{item.calories}</span>}
                {item.preparationTime && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{item.preparationTime}m</span>}
                <button
                  onClick={() => updateMenuItem(item.id, { isAvailable: !item.isAvailable })}
                  className={cn('ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium transition-all',
                    item.isAvailable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                  )}
                >
                  {item.isAvailable ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                  {item.isAvailable ? 'Available' : 'Hidden'}
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Tag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No items found</p>
            <button onClick={openAdd} className="mt-3 text-sm text-emerald-600 hover:text-emerald-700">
              + Add your first item
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Image upload */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-2">Image (auto-converts to WebP)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="relative w-full h-40 rounded-2xl border-2 border-dashed border-gray-200 hover:border-emerald-300 cursor-pointer overflow-hidden transition-all bg-gray-50 flex items-center justify-center"
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-medium">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      {converting ? (
                        <div className="text-emerald-600 text-sm animate-pulse">Converting to WebP...</div>
                      ) : (
                        <>
                          <ImagePlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-400 text-sm">Click to upload image</p>
                          <p className="text-slate-300 text-xs mt-1">JPG, PNG, WEBP → Auto-converted to WebP</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>

              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Name (EN) *</label>
                  <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400" placeholder="e.g. Hummus" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Name (AR)</label>
                  <input value={form.nameAr || ''} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))}
                    dir="rtl" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400" placeholder="الحمص" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Description</label>
                <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 resize-none" placeholder="Describe the dish..." />
              </div>

              {/* Price, Calories, Prep time */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Price ({currentTenant.currency}) *</label>
                  <input type="number" min="0" step="0.5" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Calories (kcal)</label>
                  <input type="number" min="0" value={form.calories || ''} onChange={e => setForm(f => ({ ...f, calories: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Prep (min)</label>
                  <input type="number" min="0" value={form.preparationTime || ''} onChange={e => setForm(f => ({ ...f, preparationTime: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400" />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Category</label>
                <select value={form.categoryId || ''} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 bg-white">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl">
                {[
                  { key: 'isAvailable', label: 'Available', icon: Eye },
                  { key: 'isPopular', label: 'Popular', icon: Star },
                  { key: 'isNew', label: 'New Badge', icon: Sparkles },
                ].map(t => (
                  <div key={t.key} className="flex flex-col items-center gap-1.5">
                    <t.icon className="w-4 h-4 text-slate-400" />
                    <span className="text-[11px] text-slate-600">{t.label}</span>
                    <Toggle enabled={!!(form as any)[t.key]} onToggle={() => setForm(f => ({ ...f, [t.key]: !(f as any)[t.key] }))} />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-slate-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name || !form.price}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> {editingItem ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="font-bold text-gray-900">Delete Item?</h3>
            <p className="text-slate-500 text-sm">This cannot be undone.</p>
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
