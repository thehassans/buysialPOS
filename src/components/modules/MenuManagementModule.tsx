'use client'

import { useRef, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { Category, MenuItem } from '@/lib/types'
import { cn, formatCurrency, getCurrencySymbol, slugify } from '@/lib/utils'
import {
  Plus, Pencil, Trash2, Search, X, Save, ImagePlus,
  Flame, DollarSign, Clock, Tag, Star, Sparkles, Eye, EyeOff
} from 'lucide-react'

const EMPTY_FORM: Partial<MenuItem> = {
  name: '', nameAr: '', description: '', descriptionAr: '',
  price: 0, calories: 0, preparationTime: 0,
  hasHalfPlate: false, halfPlatePrice: 0,
  isAvailable: true, isPopular: false, isNew: false,
  categoryId: '', image: '',
}

const DEFAULT_CATEGORY_ICON = '🍽️'

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
  const { currentTenant, menuItems, categories: storedCategories, addCategory, addMenuItem, updateMenuItem, deleteMenuItem } = useAppStore()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [form, setForm] = useState<Partial<MenuItem>>(EMPTY_FORM)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [converting, setConverting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [categoryMode, setCategoryMode] = useState<'existing' | 'new'>('existing')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryNameAr, setNewCategoryNameAr] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState(DEFAULT_CATEGORY_ICON)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!currentTenant) return null

  const tenantItems = menuItems.filter(m => m.tenantId === currentTenant.id)
  const currencySymbol = getCurrencySymbol(currentTenant.currency)
  const tenantCategories = storedCategories.filter(category => category.tenantId === currentTenant.id)
  const derivedCategories: Category[] = Array.from(new Set(tenantItems.map(item => item.categoryId).filter(Boolean)))
    .filter(categoryId => !tenantCategories.some(category => category.id === categoryId))
    .map((categoryId, index) => ({
      id: categoryId,
      tenantId: currentTenant.id,
      name: categoryId.replace(/[-_]/g, ' ').replace(/\b\w/g, character => character.toUpperCase()),
      nameAr: undefined,
      icon: DEFAULT_CATEGORY_ICON,
      sortOrder: tenantCategories.length + index + 1,
      isActive: true,
    }))
  const categories = [...tenantCategories, ...derivedCategories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))

  const filtered = tenantItems.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.nameAr?.includes(search)
    const matchCat = selectedCategory === 'all' || item.categoryId === selectedCategory
    return matchSearch && matchCat
  })

  const openAdd = () => {
    setEditingItem(null)
    setForm({ ...EMPTY_FORM, tenantId: currentTenant.id, categoryId: categories[0]?.id || '' })
    setImagePreview('')
    setCategoryMode('existing')
    setNewCategoryName('')
    setNewCategoryNameAr('')
    setNewCategoryIcon(DEFAULT_CATEGORY_ICON)
    setShowModal(true)
  }

  const openEdit = (item: MenuItem) => {
    setEditingItem(item)
    setForm({ ...item })
    setImagePreview(item.image || '')
    const existingCategory = categories.find(category => category.id === item.categoryId)
    setCategoryMode(existingCategory ? 'existing' : 'new')
    setNewCategoryName(existingCategory?.name || item.categoryId || '')
    setNewCategoryNameAr(existingCategory?.nameAr || '')
    setNewCategoryIcon(existingCategory?.icon || DEFAULT_CATEGORY_ICON)
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
    const needsNewCategory = categoryMode === 'new'
    const categoryName = newCategoryName.trim()
    if (!form.name || !form.price || (form.hasHalfPlate && !form.halfPlatePrice) || (!form.categoryId && !needsNewCategory) || (needsNewCategory && !categoryName)) return
    let resolvedCategoryId = form.categoryId || ''
    if (needsNewCategory) {
      resolvedCategoryId = `cat-${currentTenant.id}-${slugify(categoryName)}`
      const existingCategory = categories.find(category => category.id === resolvedCategoryId)
      if (!existingCategory) {
        const createdCategory: Category = {
          id: resolvedCategoryId,
          tenantId: currentTenant.id,
          name: categoryName,
          nameAr: newCategoryNameAr.trim() || undefined,
          icon: newCategoryIcon.trim() || DEFAULT_CATEGORY_ICON,
          sortOrder: categories.length + 1,
          isActive: true,
        }
        addCategory(createdCategory)
      }
    }
    const normalizedForm = {
      ...form,
      categoryId: resolvedCategoryId,
      hasHalfPlate: !!form.hasHalfPlate,
      halfPlatePrice: form.hasHalfPlate ? form.halfPlatePrice : undefined,
    }
    if (editingItem) {
      updateMenuItem(editingItem.id, normalizedForm)
    } else {
      addMenuItem({
        ...normalizedForm,
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
                <div className="text-right whitespace-nowrap">
                  <div className="text-emerald-600 font-bold text-sm">{formatCurrency(item.price, currentTenant.currency)}</div>
                  {item.hasHalfPlate && item.halfPlatePrice && (
                    <div className="text-[10px] text-amber-600 font-semibold">Half {formatCurrency(item.halfPlatePrice, currentTenant.currency)}</div>
                  )}
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
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Price ({currencySymbol}) *</label>
                  <input type="number" min="0" step="0.5" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400" />
                  {(form.price || 0) > 0 && (
                    <div className="mt-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 rounded-lg px-2 py-1">
                      After VAT ({Math.round((currentTenant.vatRate || 0) * 100)}%):{' '}
                      {formatCurrency((form.price || 0) * (1 + (currentTenant.vatRate || 0)), currentTenant.currency)}
                    </div>
                  )}
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

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-700">Half Plate Option</div>
                    <div className="text-[11px] text-slate-500">Enable a smaller portion with its own selling price.</div>
                  </div>
                  <Toggle enabled={!!form.hasHalfPlate} onToggle={() => setForm(f => ({
                    ...f,
                    hasHalfPlate: !f.hasHalfPlate,
                    halfPlatePrice: !f.hasHalfPlate ? (f.halfPlatePrice || 0) : 0,
                  }))} />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Half Plate Price ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.hasHalfPlate ? (form.halfPlatePrice || '') : ''}
                    onChange={e => setForm(f => ({ ...f, halfPlatePrice: parseFloat(e.target.value) || 0 }))}
                    disabled={!form.hasHalfPlate}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 disabled:bg-gray-100 disabled:text-slate-400"
                  />
                  {form.hasHalfPlate && (form.halfPlatePrice || 0) > 0 && (
                    <div className="mt-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 rounded-lg px-2 py-1">
                      After VAT: {formatCurrency((form.halfPlatePrice || 0) * (1 + (currentTenant.vatRate || 0)), currentTenant.currency)}
                    </div>
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-600 block">Category</label>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-1">
                  <button
                    type="button"
                    onClick={() => setCategoryMode('existing')}
                    className={cn('rounded-lg px-3 py-2 text-xs font-semibold transition-all', categoryMode === 'existing' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500')}
                  >
                    Choose existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategoryMode('new')}
                    className={cn('rounded-lg px-3 py-2 text-xs font-semibold transition-all', categoryMode === 'new' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500')}
                  >
                    Add category
                  </button>
                </div>

                {categoryMode === 'existing' ? (
                  <select value={form.categoryId || ''} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 bg-white">
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon || DEFAULT_CATEGORY_ICON} {c.name}</option>)}
                  </select>
                ) : (
                  <div className="grid grid-cols-[88px_1fr] gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">Icon</label>
                      <input
                        value={newCategoryIcon}
                        onChange={e => setNewCategoryIcon(e.target.value || DEFAULT_CATEGORY_ICON)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:border-emerald-400"
                        placeholder="🍽️"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">Name</label>
                        <input
                          value={newCategoryName}
                          onChange={e => setNewCategoryName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400"
                          placeholder="e.g. Rice Bowls"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 block mb-1">Name (AR)</label>
                        <input
                          value={newCategoryNameAr}
                          onChange={e => setNewCategoryNameAr(e.target.value)}
                          dir="rtl"
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400"
                          placeholder="أطباق الأرز"
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                disabled={!form.name || !form.price || (!!form.hasHalfPlate && !form.halfPlatePrice) || (categoryMode === 'existing' ? !form.categoryId : !newCategoryName.trim())}
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
